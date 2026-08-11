# Growth Agent AI-1 设计说明

## 目标

为「明日复明日」建立统一、安全、可替换模型的 Supabase Edge Function 基础通路。第一阶段只完成模型适配层和 Growth Agent 请求入口，不实现每日成长分析、长期记忆分析或成长报告业务。

## 边界

- 前端不直接调用模型，也不保存模型密钥。
- Growth Agent 通过 Supabase Auth 校验用户身份。
- 业务入口接收统一的 `action`、`input`、`context` 请求。
- 第一版提供 `health_check` 最小真实调用入口，并允许 `daily_analysis`、`memory_chat`、`growth_report` 三种预留 action；预留 action 只建立通路，不读取或修改现有业务数据。
- 模型输出必须通过 Provider 层解析为 JSON。
- 不修改现有前端、任务、日期、天气、心情、记忆和 PWA 逻辑。

## 架构

```text
调用方
  -> growth-agent/index.ts
  -> ModelProvider 接口
  -> GLMProvider
  -> 智谱 GLM REST API
```

`growth-agent/index.ts` 负责 CORS、请求解析、身份校验、action 白名单和统一响应；`providers/types.ts` 定义模型无关接口；`providers/glm.ts` 负责 GLM 请求；`providers/index.ts` 负责 Provider 选择。

## 安全

- `GLM_API_KEY` 只从 Supabase Secret 读取。
- Edge Function 开启 JWT 校验。
- 不记录 Authorization、API Key 或用户隐私原文。
- 错误响应只暴露稳定的错误代码：`missing_api_key`、`unsupported_provider`、`provider_request_failed`、`provider_invalid_response`、`invalid_request`；不暴露模型密钥和上游响应敏感内容。

## 统一接口

请求：

```json
{
  "action": "daily_analysis",
  "input": "可选的用户输入",
  "context": {}
}
```

成功响应：

```json
{
  "ok": true,
  "action": "daily_analysis",
  "result": {}
}
```

Provider 统一返回 `{ provider, model, data }`，其中 `data` 是结构化 JSON 对象；后续 AI-2 再定义每日分析业务字段。

## 验收标准

1. 未登录请求被拒绝。
2. 已登录请求可以通过 `growth-agent` 到达 GLM Provider。
3. GLM Provider 从 `GLM_API_KEY` 读取密钥，并返回 JSON 对象。
4. 不修改现有产品功能和前端文件。
5. `node --check app.js`、`node --check sw.js` 和 `git diff --check` 通过。
