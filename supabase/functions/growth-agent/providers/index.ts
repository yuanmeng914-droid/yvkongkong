import { GLMProvider } from "./glm.ts";
import { ProviderError } from "./types.ts";
import type { ModelProvider } from "./types.ts";

export function createModelProvider(): ModelProvider {
  const provider = (Deno.env.get("MODEL_PROVIDER") || "glm").trim().toLowerCase();
  if (provider === "glm") return new GLMProvider();
  throw new ProviderError("unsupported_provider", 503);
}
