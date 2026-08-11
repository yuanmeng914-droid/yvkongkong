# AI Daily Insight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a logged-in user initiated daily AI insight to the growth page without changing task, weather, memory, login, or PWA behavior.

**Architecture:** The browser asks `growth-agent` for one selected date. The Edge Function derives all source data from the authenticated user’s Supabase rows, invokes the existing provider abstraction, validates a three-string JSON payload, upserts it, and returns it. The browser only renders the returned/persisted result.

**Tech Stack:** Static HTML/CSS/JavaScript, Supabase PostgREST with RLS, Supabase Edge Functions (Deno/TypeScript), existing GLM Model Provider, Node built-in test runner.

## Global Constraints

- Do not alter task carry-over, date navigation, weather, important-days, memories, login, or PWA behavior.
- Only logged-in users can request, read, or regenerate analysis.
- Do not send task titles or `user_memories` to the model.
- The model output must be valid JSON with `summary`, `observation`, and `tomorrow_suggestion` strings.
- Keep all provider keys in Supabase Secrets; no key may enter frontend files.

---

### Task 1: Persist user-owned daily insights

**Files:**
- Create: `supabase/upgrade-ai-insights.sql`

**Interfaces:**
- Produces: `public.ai_daily_insights` with `(user_id, insight_date)` primary key and RLS policies for authenticated owners.

- [ ] **Step 1: Add an idempotent SQL migration**

Create `ai_daily_insights` with text fields `summary`, `observation`, `tomorrow_suggestion`, JSONB `source_snapshot`, `model`, `created_at`, and `updated_at`; enable RLS and create owner-only select/insert/update/delete policies.

- [ ] **Step 2: Run the migration in Supabase SQL Editor**

Expected: successful completion with no changes to existing task or growth tables.

### Task 2: Validate the model-safe summary and result

**Files:**
- Create: `supabase/functions/growth-agent/daily-insight.js`
- Create: `supabase/functions/growth-agent/daily-insight.test.mjs`

**Interfaces:**
- Produces: `validateInsightDate(value): string | null`, `buildDailyInsightRequest(snapshot): { input: string, context: object }`, and `validateDailyInsight(data): { summary, observation, tomorrow_suggestion } | null`.

- [ ] **Step 1: Write failing Node tests**

Test valid ISO dates, rejected invalid dates, omission of task titles from the generated context, and valid/invalid three-field model output.

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `node --test supabase/functions/growth-agent/daily-insight.test.mjs`

Expected: failures because the module does not yet exist.

- [ ] **Step 3: Implement pure validation helpers**

Build prompts from counts, carry-over totals, mood values and review text; reject missing or overly long output fields.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `node --test supabase/functions/growth-agent/daily-insight.test.mjs`

Expected: all tests pass.

### Task 3: Add the daily_analysis action to Growth Agent

**Files:**
- Modify: `supabase/functions/growth-agent/index.ts`
- Modify: `supabase/functions/growth-agent/request-validation.js`

**Interfaces:**
- Consumes: authenticated JWT, date context, `buildDailyInsightRequest`, `validateDailyInsight`, existing `ModelProvider`.
- Produces: `{ ok: true, action: "daily_analysis", result: { summary, observation, tomorrow_suggestion, insight_date, cached } }`.

- [ ] **Step 1: Extend the validation tests for daily_analysis date context**

Accept only `{ action: "daily_analysis", context: { day: "YYYY-MM-DD", force?: boolean } }`; continue supporting existing AI-1 health checks.

- [ ] **Step 2: Read data server-side and cache by date**

Query `tasks`, `mood_entries`, and `daily_reviews` using the authenticated user client. Return a saved row unless `force` is true. If every source is empty, return `no_daily_data` without calling the provider.

- [ ] **Step 3: Generate and validate the insight**

Call `provider.generateJson()` with `daily_analysis`; validate the exact three user-visible fields, then upsert the result and non-sensitive snapshot to `ai_daily_insights`.

- [ ] **Step 4: Verify TypeScript and Node tests**

Run: `node --check supabase/functions/growth-agent/request-validation.js` and `node --test supabase/functions/growth-agent/*.test.mjs`.

Expected: successful checks and tests.

### Task 4: Render and request an insight from the growth page

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`

**Interfaces:**
- Consumes: `window.APP_CONFIG.supabaseUrl`, publishable key, logged-in Supabase session, selected day, Growth Agent response.
- Produces: an analysis card with idle/loading/success/empty/error states and a deliberate regenerate button.

- [ ] **Step 1: Add the smallest possible growth-page markup**

Place a new card after the review form. It contains a single action button, a status paragraph, and empty fields for the three returned strings. Do not alter the existing review form.

- [ ] **Step 2: Add focused browser functions**

Implement `requestDailyInsight(force)`, `renderDailyInsight()`, and `loadDailyInsightForSelectedDay()`. Build Authorization and API-key headers from the existing session and `APP_CONFIG`; never expose a secret.

- [ ] **Step 3: Add isolated CSS**

Add `.ai-insight-card` styles scoped to the new card, including responsive behavior and no changes to date/task card selectors.

- [ ] **Step 4: Verify existing JavaScript remains syntactically valid**

Run: `node --check app.js` and `node --check sw.js`.

### Task 5: Verify, deploy, and test the full user flow

**Files:**
- Modify: `README.md`

**Interfaces:**
- Documents: database migration, Growth Agent deployment, and manual test flow.

- [ ] **Step 1: Document only the new AI-2 setup**

Explain running `supabase/upgrade-ai-insights.sql`, deploying `growth-agent`, and that GLM secrets remain server-side.

- [ ] **Step 2: Run source verification**

Run: `node --test supabase/functions/growth-agent/*.test.mjs`; `node --check app.js`; `node --check sw.js`; `git diff --check`.

- [ ] **Step 3: Deploy and manually verify**

Deploy with `supabase.cmd functions deploy growth-agent --project-ref hjzjheodfuxlzwdvludu`. In the web app: log in, save a review or mood, click “AI 看看今天”, refresh, confirm the insight persists; click “重新看看今天” to verify explicit regeneration.
