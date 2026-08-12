# AI Long-Term Memory Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let daily AI analysis use a bounded set of confirmed user memories and offer deduplicated memory candidates that are saved only after explicit user confirmation.

**Architecture:** Keep memory selection and model-output validation in pure helpers beside the existing daily-insight helper. Growth Agent loads memories through the authenticated Supabase client, passes only the selected records to the provider, reconstructs references from trusted records, and stores the complete AI response in the existing JSON snapshot. The frontend only renders references and candidates and reuses the existing memory persistence path after user confirmation.

**Tech Stack:** Vanilla JavaScript, Deno Supabase Edge Functions, Supabase JS, Node test runner, existing HTML/CSS.

## Global Constraints

- Do not modify task creation, completion, rollover, recurrence, date switching, or task synchronization.
- Do not modify login, weather, important days, mood/review persistence, PWA, Service Worker, push, password reset, or GitHub Pages deployment.
- Do not add tables, columns, Embedding, pgvector, RAG, or another Agent.
- Do not publish or push this implementation automatically.
- Normal page entry uses the cached insight; only `force: true` reads the latest memories and regenerates.
- AI never writes a memory without an explicit user action.

---

### Task 1: Pure memory selection and response validation

**Files:**
- Create: `supabase/functions/growth-agent/memory-loop.js`
- Create: `supabase/functions/growth-agent/memory-loop.test.mjs`
- Modify: `supabase/functions/growth-agent/daily-insight.js`
- Modify: `supabase/functions/growth-agent/daily-insight.test.mjs`

**Interfaces:**
- Produces: `selectRelevantMemories(records, limit = 8)` returning safe `{ id, type, content }` records.
- Produces: `resolveReferencedMemories(ids, selected)` returning only trusted selected records.
- Produces: `validateMemoryCandidate(value)` returning a normalized candidate or `null`.
- Produces: `isDuplicateMemory(candidate, existing)` for deterministic text deduplication.
- Extends: `buildDailyInsightRequest(snapshot, memories)` and `validateDailyInsight(data)`.

- [ ] **Step 1: Write failing tests for category priority, recent ordering, limit, invalid records, reference whitelisting, candidate validation, and duplicate detection.**
- [ ] **Step 2: Run `node --test supabase/functions/growth-agent/memory-loop.test.mjs supabase/functions/growth-agent/daily-insight.test.mjs` and verify the new exports fail.**
- [ ] **Step 3: Implement the pure helper with category order `goal`, `habit`, `observation`, `experience`, `preference`; cap content at 500 characters and the selected list at 8.**
- [ ] **Step 4: Extend the daily prompt to request `referenced_memory_ids` and nullable `memory_candidate`, while preserving the three existing visible fields.**
- [ ] **Step 5: Run the focused tests and verify they pass.**

### Task 2: Authenticated Growth Agent memory data flow and cache

**Files:**
- Modify: `supabase/functions/growth-agent/index.ts`
- Modify: `supabase/functions/growth-agent/daily-insight.test.mjs`

**Interfaces:**
- Consumes: the pure helpers from Task 1.
- Produces: daily result fields `referenced_memories` and `memory_candidate` in both generated and cached responses.

- [ ] **Step 1: Add a failing contract test showing the trusted response is reconstructed from selected IDs and a duplicate candidate becomes `null`.**
- [ ] **Step 2: Load active `user_memories` using the request user's authenticated client, select only `id,category,content,updated_at,deleted_at`, and pass the selected list to `buildDailyInsightRequest`.**
- [ ] **Step 3: Reconstruct references from the selected records and validate/deduplicate the candidate before returning it.**
- [ ] **Step 4: Store `referenced_memories` and `memory_candidate` under `source_snapshot.ai_result_meta`; recover them from that JSON for cached responses without adding columns.**
- [ ] **Step 5: Confirm non-forced cached requests return before the memory query, while forced requests query current memories.**
- [ ] **Step 6: Run all Growth Agent tests.**

### Task 3: Frontend reference and candidate interaction

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `tests/ui-structure.test.mjs`

**Interfaces:**
- Consumes: `referenced_memories` and `memory_candidate` from the daily result.
- Reuses: `openMemoryDialog(memory)` and `persistMemory(memory)` with an explicit `source` value.

- [ ] **Step 1: Add failing UI structure assertions for a collapsible references section, candidate content/reason, and the three actions.**
- [ ] **Step 2: Add the smallest HTML blocks under the existing AI result without moving existing daily cards.**
- [ ] **Step 3: Render only server-returned references and candidate data; hide both blocks when empty.**
- [ ] **Step 4: Implement `记住` by creating a candidate memory with `source: "ai"`, checking duplicates against active local memories, then using existing persistence.**
- [ ] **Step 5: Implement `编辑后记住` by pre-filling the existing memory dialog with candidate category/content and preserving `source: "ai"` on submit.**
- [ ] **Step 6: Implement `先不用` as local UI dismissal only; do not write to Supabase.**
- [ ] **Step 7: Update user-facing copy so the page states that relevant confirmed memories may be used.**
- [ ] **Step 8: Run UI structure tests.**

### Task 4: Full regression and local handoff

**Files:**
- Modify only if tests reveal an AI-memory-loop defect in files already listed above.

**Interfaces:**
- Produces: a verified local implementation with no deployment.

- [ ] **Step 1: Run `node --test`.**
- [ ] **Step 2: Run `node --check app.js`, `node --check sw.js`, and syntax/import checks for the new helper.**
- [ ] **Step 3: Run `git diff --check`, `git status --short`, and inspect `git diff --stat` to confirm no prohibited feature files changed.**
- [ ] **Step 4: Test the local page for preserved date, lunar date, tasks, weather, mood, review, memories, important days, and AI blocks.**
- [ ] **Step 5: Report changed files, test evidence, deployment steps needed later, and remaining manual Supabase/GLM verification. Do not push or deploy.**
