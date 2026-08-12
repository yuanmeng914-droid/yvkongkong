# Task Completion Sync Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure a locally completed task is retried until Supabase stores that completion, without stale cloud data overwriting it.

**Architecture:** Add a small pure `task-sync.mjs` module for pending-state and merge decisions. Keep Supabase calls in `app.js`, mark every task mutation pending, serialize per-task writes, and retry pending work at safe lifecycle events.

**Tech Stack:** Browser ES modules, Supabase JS v2, Node.js built-in test runner, existing static PWA.

## Global Constraints

- Do not change database tables or Supabase task fields.
- Do not change page layout, date behavior, rollover rules, weather, AI, login, important days, feedback, or PWA behavior.
- Keep offline-first optimistic task interaction.
- Never report a task as synced until the latest local version is stored successfully.

---

### Task 1: Pure task synchronization rules

**Files:**
- Create: `task-sync.mjs`
- Create: `tests/task-sync.test.mjs`

**Interfaces:**
- Produces: `markTaskPending(task)`, `markTaskSynced(task, userId, revision)`, `needsTaskSync(task, userId)`, and `mergeTaskRecords(localTasks, cloudTasks, userId)`.

- [ ] Write tests proving pending tasks are retryable, only the matching revision can clear pending state, stale cloud records cannot overwrite newer local completion, and normal cloud records remain authoritative.
- [ ] Run `node --test tests/task-sync.test.mjs` and verify the tests fail because the module does not exist.
- [ ] Implement the minimum pure module needed by those tests.
- [ ] Run `node --test tests/task-sync.test.mjs` and verify all tests pass.

### Task 2: Integrate pending state and automatic retry

**Files:**
- Modify: `app.js`
- Modify: `index.html`
- Modify: `sw.js`
- Modify: `tests/ui-structure.test.mjs`

**Interfaces:**
- Consumes: the four exports from `task-sync.mjs`.
- Produces: reliable `persistTask`, `flushPendingTaskSync`, and lifecycle retry behavior.

- [ ] Add a UI/PWA integration test that requires the sync module to be loaded and cached.
- [ ] Run the test and verify it fails before changing production files.
- [ ] Import the module in `app.js`, preserve `syncPending` in normalization, and mark all task mutations pending before local save.
- [ ] Serialize writes by task ID; clear pending only when the saved revision is still current.
- [ ] Merge local and cloud tasks with `mergeTaskRecords`, then retry any merged pending records.
- [ ] Retry on login, browser `online`, and visible-page lifecycle events.
- [ ] Show pending status instead of “已同步” while any signed-in task needs synchronization.
- [ ] Add `task-sync.mjs` to the service-worker app shell and bump the asset versions once.
- [ ] Run the focused tests and then the full Node test suite.

### Task 3: Regression verification

**Files:**
- No production files beyond Tasks 1 and 2.

- [ ] Run JavaScript syntax checks for `app.js`, `task-sync.mjs`, and `sw.js`.
- [ ] Run all repository tests.
- [ ] Review the final diff and confirm no unrelated feature files or database schema changed.
- [ ] Record the exact verified behaviors and any remaining server-side limitation.
