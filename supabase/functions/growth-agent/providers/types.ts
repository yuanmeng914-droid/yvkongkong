export type JsonObject = Record<string, unknown>;

export type ModelRequest = {
  action: string;
  input: string;
  context: JsonObject;
};

export type ModelResponse = {
  provider: string;
  model: string;
  data: JsonObject;
};

export interface ModelProvider {
  readonly name: string;
  generateJson(request: ModelRequest): Promise<ModelResponse>;
}

export class ProviderError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status = 502) {
    super(code);
    this.name = "ProviderError";
    this.code = code;
    this.status = status;
  }
}
