import test from "node:test";
import assert from "node:assert/strict";

import {
  createTaskSyncQueue,
  markTaskPending,
  markTaskSynced,
  mergeTaskRecords,
  needsTaskSync,
} from "../task-sync.mjs";

const task = (overrides = {}) => ({
  id: "task-1",
  text: "测试任务",
  day: "2026-08-11",
  updatedAt: 100,
  completedAt: null,
  done: false,
  deletedAt: null,
  syncedUserId: "user-1",
  syncPending: false,
  ...overrides,
});

test("写入失败后保留的 pending 任务会在当前账号下继续重试", () => {
  const local = task();
  markTaskPending(local);

  assert.equal(local.syncPending, true);
  assert.equal(needsTaskSync(local, "user-1"), true);
});

test("只有当前本地版本写入成功才能清除 pending 状态", () => {
  const local = task({ updatedAt: 200, syncPending: true });

  assert.equal(markTaskSynced(local, "user-1", 100), false);
  assert.equal(local.syncPending, true);
  assert.equal(markTaskSynced(local, "user-1", 200), true);
  assert.equal(local.syncPending, false);
  assert.equal(local.syncedUserId, "user-1");
});

test("云端旧的未完成记录不能覆盖更新更晚的本地完成状态", () => {
  const local = task({
    updatedAt: 200,
    completedAt: "2026-08-11T08:00:00.000Z",
    done: true,
    syncPending: true,
  });
  const cloud = task({ updatedAt: 100, syncedUserId: "user-1" });

  const [merged] = mergeTaskRecords([local], [cloud], "user-1");

  assert.equal(merged.done, true);
  assert.equal(merged.completedAt, "2026-08-11T08:00:00.000Z");
  assert.equal(merged.syncPending, true);
});

test("本地更新时间更晚时即使旧版本没有 pending 标记也会恢复待同步", () => {
  const local = task({
    updatedAt: 200,
    completedAt: "2026-08-11T08:00:00.000Z",
    done: true,
  });
  const cloud = task({ updatedAt: 100 });

  const [merged] = mergeTaskRecords([local], [cloud], "user-1");

  assert.equal(merged.done, true);
  assert.equal(merged.syncPending, true);
});

test("没有本地待同步变更时采用更新的云端状态", () => {
  const local = task({ updatedAt: 100 });
  const cloud = task({
    updatedAt: 200,
    completedAt: "2026-08-11T09:00:00.000Z",
    done: true,
  });

  const [merged] = mergeTaskRecords([local], [cloud], "user-1");

  assert.equal(merged.done, true);
  assert.equal(merged.updatedAt, 200);
  assert.equal(merged.syncPending, false);
});

test("云端已经不存在且本地没有待同步变更的任务不会复活", () => {
  const local = task({ updatedAt: 100 });

  assert.deepEqual(mergeTaskRecords([local], [], "user-1"), []);
});

test("同一任务的连续写入严格串行，最后一次操作不会被旧请求覆盖", async () => {
  const queue = createTaskSyncQueue();
  const events = [];
  let releaseFirst;
  let markFirstStarted;
  const firstGate = new Promise((resolve) => { releaseFirst = resolve; });
  const firstStarted = new Promise((resolve) => { markFirstStarted = resolve; });

  const first = queue.enqueue("task-1", async () => {
    events.push("first:start");
    markFirstStarted();
    await firstGate;
    events.push("first:end");
  });
  const second = queue.enqueue("task-1", async () => {
    events.push("second:start");
    events.push("second:end");
  });

  await firstStarted;
  assert.deepEqual(events, ["first:start"]);
  releaseFirst();
  await Promise.all([first, second]);
  assert.deepEqual(events, ["first:start", "first:end", "second:start", "second:end"]);
});

test("前一次写入失败不会阻止同一任务的下一次重试", async () => {
  const queue = createTaskSyncQueue();
  const events = [];

  const failed = queue.enqueue("task-1", async () => {
    events.push("failed");
    throw new Error("offline");
  });
  const retried = queue.enqueue("task-1", async () => {
    events.push("retried");
    return true;
  });

  await assert.rejects(failed, /offline/);
  assert.equal(await retried, true);
  assert.deepEqual(events, ["failed", "retried"]);
});
