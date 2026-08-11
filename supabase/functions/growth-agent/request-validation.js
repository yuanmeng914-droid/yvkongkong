import { validateInsightDate } from "./daily-insight.js";

const allowedActions = new Set(["health_check", "daily_analysis", "memory_chat", "growth_report"]);

export function parseAgentRequest(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return invalid();
  const record = body;
  const action = typeof record.action === "string" ? record.action.trim() : "";
  const input = typeof record.input === "string" ? record.input.trim() : "";
  const context = record.context === undefined ? {} : record.context;
  if (!allowedActions.has(action)) return invalid();
  if (input.length > 10000) return invalid();
  if (!context || typeof context !== "object" || Array.isArray(context)) return invalid();
  if (action === "daily_analysis") {
    const day = validateInsightDate(context.day);
    if (!day || (context.force !== undefined && typeof context.force !== "boolean")) return invalid();
    return { ok: true, value: { action, input, context: { day, force: context.force === true } } };
  }
  return { ok: true, value: { action, input, context } };
}

function invalid() {
  return { ok: false, error: "invalid_request" };
}
