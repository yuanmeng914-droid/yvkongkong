import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createModelProvider } from "./providers/index.ts";
import { ProviderError } from "./providers/types.ts";
import type { JsonObject } from "./providers/types.ts";
import { parseAgentRequest } from "./request-validation.js";
import { buildDailyInsightRequest, hasDailySource, validateDailyInsight } from "./daily-insight.js";
import { finalizeMemoryAwareInsight, readInsightMemoryMeta, selectRelevantMemories } from "./memory-loop.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return json({ ok: false, error: "unauthorized" }, 401);

  const session = await getSession(authHeader);
  if (!session) return json({ ok: false, error: "unauthorized" }, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const parsed = parseAgentRequest(body);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, 400);

  try {
    if (parsed.value.action === "daily_analysis") {
      return await createDailyAnalysis(session.client, session.user.id, parsed.value.context as { day: string; force: boolean });
    }
    const provider = createModelProvider();
    const request = parsed.value.action === "health_check" && !parsed.value.input
      ? { ...parsed.value, input: "请返回一个 JSON 对象：status 为 ok，provider_ready 为 true。" }
      : parsed.value;
    const result = await provider.generateJson(request);
    return json({ ok: true, action: parsed.value.action, result });
  } catch (error) {
    if (error instanceof ProviderError) return json({ ok: false, error: error.code }, error.status);
    console.error("growth_agent_failed", { userId: session.user.id });
    return json({ ok: false, error: "agent_failed" }, 500);
  }
});

async function getSession(authHeader: string) {
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anonKey) return null;
  const client = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await client.auth.getUser();
  return error || !data.user ? null : { client, user: data.user };
}

async function createDailyAnalysis(client: ReturnType<typeof createClient>, userId: string, context: { day: string; force: boolean }) {
  const { data: cached, error: cachedError } = await client
    .from("ai_daily_insights")
    .select("insight_date,summary,observation,tomorrow_suggestion,model,updated_at,source_snapshot")
    .eq("insight_date", context.day)
    .maybeSingle();
  if (cachedError) throw new ProviderError("data_store_unavailable", 503);
  if (cached && !context.force) {
    const { source_snapshot, ...cachedInsight } = cached;
    return json({ ok: true, action: "daily_analysis", result: { ...cachedInsight, ...readInsightMemoryMeta(source_snapshot), cached: true } });
  }

  const snapshot = await loadDailySnapshot(client, context.day);
  if (!hasDailySource(snapshot)) {
    return json({ ok: true, action: "daily_analysis", result: { status: "no_daily_data", insight_date: context.day } });
  }

  const memoryRecords = await loadMemoryRecords(client);
  const selectedMemories = selectRelevantMemories(memoryRecords);
  const provider = createModelProvider();
  const request = buildDailyInsightRequest(snapshot, selectedMemories);
  const generated = await provider.generateJson({ action: "daily_analysis", ...request });
  const insight = validateDailyInsight(generated.data);
  if (!insight) throw new ProviderError("provider_invalid_response", 502);
  const result = finalizeMemoryAwareInsight(insight, selectedMemories, memoryRecords);

  const row = {
    user_id: userId,
    insight_date: context.day,
    summary: result.summary,
    observation: result.observation,
    tomorrow_suggestion: result.tomorrow_suggestion,
    source_snapshot: { ...request.context, ai_result_meta: { referenced_memories: result.referenced_memories, memory_candidate: result.memory_candidate } },
    model: generated.model,
    updated_at: new Date().toISOString(),
  };
  const { error: saveError } = await client.from("ai_daily_insights").upsert(row);
  if (saveError) throw new ProviderError("data_store_unavailable", 503);
  return json({ ok: true, action: "daily_analysis", result: { ...result, insight_date: context.day, model: generated.model, cached: false } });
}

async function loadMemoryRecords(client: ReturnType<typeof createClient>) {
  const { data, error } = await client
    .from("user_memories")
    .select("id,category,content,updated_at,deleted_at")
    .is("deleted_at", null);
  if (error) throw new ProviderError("data_store_unavailable", 503);
  return data || [];
}

async function loadDailySnapshot(client: ReturnType<typeof createClient>, day: string) {
  const [tasksResponse, moodResponse, reviewResponse] = await Promise.all([
    client.from("tasks").select("completed_at,carry_count,deleted_at").eq("scheduled_day", day),
    client.from("mood_entries").select("mood,note").eq("mood_date", day).maybeSingle(),
    client.from("daily_reviews").select("highlight,unfinished,next_step").eq("review_date", day).maybeSingle(),
  ]);
  if (tasksResponse.error || moodResponse.error || reviewResponse.error) throw new ProviderError("data_store_unavailable", 503);

  const tasks = (tasksResponse.data || []).filter((task) => !task.deleted_at);
  return {
    day,
    tasks: {
      total: tasks.length,
      completed: tasks.filter((task) => Boolean(task.completed_at)).length,
      unfinished: tasks.filter((task) => !task.completed_at).length,
      carried: tasks.filter((task) => Number(task.carry_count || 0) > 0).length,
    },
    mood: { mood: moodResponse.data?.mood || "", note: moodResponse.data?.note || "" },
    review: {
      highlight: reviewResponse.data?.highlight || "",
      unfinished: reviewResponse.data?.unfinished || "",
      next: reviewResponse.data?.next_step || "",
    },
  };
}

function json(body: JsonObject, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
