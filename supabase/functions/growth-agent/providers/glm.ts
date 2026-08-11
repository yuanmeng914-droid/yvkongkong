import { ProviderError } from "./types.ts";
import type { ModelProvider, ModelRequest, ModelResponse, JsonObject } from "./types.ts";

const GLM_ENDPOINT = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const DEFAULT_MODEL = "glm-5.2";

type GlmResponse = {
  choices?: Array<{ message?: { content?: unknown } }>;
};

export class GLMProvider implements ModelProvider {
  readonly name = "glm";
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey = Deno.env.get("GLM_API_KEY") || "", model = Deno.env.get("GLM_MODEL") || DEFAULT_MODEL) {
    this.apiKey = apiKey.trim();
    this.model = model.trim() || DEFAULT_MODEL;
    if (!this.apiKey) throw new ProviderError("missing_api_key", 503);
  }

  async generateJson(request: ModelRequest): Promise<ModelResponse> {
    let response: Response;
    try {
      response = await fetch(GLM_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content: [
                "你是明日复明日的 AI Agent 模型适配层。",
                "你只能基于调用方提供的内容进行理解，不要编造用户事实。",
                "必须只返回一个合法 JSON 对象，不要返回 Markdown、代码围栏或额外解释。",
                `当前 action：${request.action}`,
              ].join("\n"),
            },
            {
              role: "user",
              content: JSON.stringify({ input: request.input, context: request.context }),
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
          stream: false,
        }),
      });
    } catch {
      throw new ProviderError("provider_request_failed", 502);
    }

    if (!response.ok) throw new ProviderError("provider_request_failed", 502);

    let payload: GlmResponse;
    try {
      payload = await response.json() as GlmResponse;
    } catch {
      throw new ProviderError("provider_invalid_response", 502);
    }

    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new ProviderError("provider_invalid_response", 502);
    return { provider: this.name, model: this.model, data: parseJsonObject(content) };
  }
}

function parseJsonObject(content: string): JsonObject {
  const normalized = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try {
    const parsed: unknown = JSON.parse(normalized);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not_object");
    return parsed as JsonObject;
  } catch {
    throw new ProviderError("provider_invalid_response", 502);
  }
}
