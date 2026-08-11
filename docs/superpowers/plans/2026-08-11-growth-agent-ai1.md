# Growth Agent AI-1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a secure, provider-agnostic Supabase Edge Function foundation using a GLM provider without changing existing frontend or product logic.

**Architecture:** `growth-agent/index.ts` owns CORS, auth, request validation, and the stable response envelope. `providers/types.ts` defines the model contract, `providers/glm.ts` calls the GLM REST API, and `providers/index.ts` selects the provider by configuration.

**Tech Stack:** Supabase Edge Functions, Deno TypeScript, Supabase Auth, GLM REST API, JSON.

## Global Constraints

- Keep `GLM_API_KEY` in Supabase Secrets only.
- Do not modify `app.js`, `index.html`, `styles.css`, existing tables, or existing Edge Functions.
- Do not implement AI-2 business analysis in this task.
- Keep the model provider replaceable without changing Growth Agent business flow.

---

### Task 1: Add model-provider contract and GLM implementation

**Files:**
- Create: `supabase/functions/growth-agent/providers/types.ts`
- Create: `supabase/functions/growth-agent/providers/glm.ts`
- Create: `supabase/functions/growth-agent/providers/index.ts`

**Interfaces:**
- `ModelProvider.generateJson(request)` returns a JSON object asynchronously.
- Provider factory returns the configured provider and throws a stable configuration error when `GLM_API_KEY` is missing.

- [ ] Define the provider request and response types.
- [ ] Implement GLM REST request using `GLM_API_KEY` from `Deno.env`.
- [ ] Parse fenced or plain JSON and reject non-object output.
- [ ] Export a factory that selects `glm` by default.

### Task 2: Add the Growth Agent Edge Function

**Files:**
- Create: `supabase/functions/growth-agent/index.ts`

**Interfaces:**
- `POST /functions/v1/growth-agent` with `{ action, input?, context? }`.
- Allowed actions: `health_check`, `daily_analysis`, `memory_chat`, `growth_report`.
- Returns `{ ok, action, result }` or `{ ok:false, error }`.

- [ ] Handle CORS preflight.
- [ ] Require an Authorization header and validate the Supabase user.
- [ ] Validate the JSON body and action allowlist.
- [ ] Call the provider and return a stable JSON envelope.
- [ ] Avoid logging credentials or private user data.
- [ ] Use `health_check` as the minimal real model-call verification action.

### Task 3: Configure and verify

**Files:**
- Modify: `supabase/config.toml`

- [ ] Set `verify_jwt = true` for `growth-agent` without changing weather configuration.
- [ ] Run `node --check app.js`.
- [ ] Run `node --check sw.js`.
- [ ] Run `git diff --check`.
- [ ] Review the diff to confirm only AI-1 files changed.
