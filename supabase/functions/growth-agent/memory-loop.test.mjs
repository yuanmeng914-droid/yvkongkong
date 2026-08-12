import test from "node:test";
import assert from "node:assert/strict";
import {
  finalizeMemoryAwareInsight,
  readInsightMemoryMeta,
  isDuplicateMemory,
  resolveReferencedMemories,
  selectRelevantMemories,
  validateMemoryCandidate,
} from "./memory-loop.js";

test("selects at most eight active memories by category priority and recency", () => {
  const records = [
    { id: "preference-1", category: "preference", content: "喜欢安静地开始一天", updated_at: "2026-08-12T12:00:00Z" },
    { id: "experience-1", category: "experience", content: "完成过一次长途徒步", updated_at: "2026-08-12T12:00:00Z" },
    { id: "observation-old", category: "observation", content: "忙碌时容易忘记休息", updated_at: "2026-08-10T12:00:00Z" },
    { id: "observation-new", category: "observation", content: "下午更适合整理材料", updated_at: "2026-08-11T12:00:00Z" },
    { id: "habit-1", category: "habit", content: "每天晚上阅读", updated_at: "2026-08-12T12:00:00Z" },
    { id: "goal-1", category: "goal", content: "完成自己的个人作品", updated_at: "2026-08-10T12:00:00Z" },
    { id: "goal-2", category: "goal", content: "保持规律运动", updated_at: "2026-08-12T12:00:00Z" },
    { id: "goal-3", category: "goal", content: "学习新的表达方式", updated_at: "2026-08-11T12:00:00Z" },
    { id: "habit-2", category: "habit", content: "周末整理一周记录", updated_at: "2026-08-11T12:00:00Z" },
    { id: "deleted", category: "goal", content: "已经删除", updated_at: "2026-08-12T12:00:00Z", deleted_at: "2026-08-12T13:00:00Z" },
    { id: "invalid", category: "unknown", content: "非法类别", updated_at: "2026-08-12T12:00:00Z" },
  ];

  const selected = selectRelevantMemories(records);
  assert.equal(selected.length, 8);
  assert.deepEqual(selected.map((item) => item.id), [
    "goal-2", "goal-3", "goal-1", "habit-1", "habit-2", "observation-new", "observation-old", "experience-1",
  ]);
  assert.deepEqual(selected[0], { id: "goal-2", type: "goal", content: "保持规律运动" });
});

test("resolves only referenced ids that were actually offered to the model", () => {
  const selected = [
    { id: "one", type: "goal", content: "完成个人作品" },
    { id: "two", type: "habit", content: "晚上阅读" },
  ];
  assert.deepEqual(resolveReferencedMemories(["two", "invented", "two", "one"], selected), [selected[1], selected[0]]);
});

test("validates a candidate using only the existing five categories", () => {
  assert.deepEqual(validateMemoryCandidate({
    type: "habit",
    content: " 项目投入较多时，容易把运动往后放。 ",
    reason: "近期记录出现了相似情况。",
  }), {
    type: "habit",
    content: "项目投入较多时，容易把运动往后放。",
    reason: "近期记录出现了相似情况。",
  });
  assert.equal(validateMemoryCandidate({ type: "diagnosis", content: "内容", reason: "原因" }), null);
  assert.equal(validateMemoryCandidate({ type: "habit", content: "", reason: "原因" }), null);
  assert.equal(validateMemoryCandidate(null), null);
});

test("detects exact and contained duplicate memories without vector search", () => {
  const existing = [
    { content: "项目投入较多时，比较容易把运动安排往后推。" },
    { content: "我希望完成自己的个人作品。" },
  ];
  assert.equal(isDuplicateMemory({ content: "项目投入较多时比较容易把运动安排往后推" }, existing), true);
  assert.equal(isDuplicateMemory({ content: "希望完成自己的个人作品" }, existing), true);
  assert.equal(isDuplicateMemory({ content: "晚上散步后更容易放松" }, existing), false);
});

test("reconstructs trusted references and removes a duplicate candidate", () => {
  const selected = [{ id: "goal-1", type: "goal", content: "完成自己的个人作品" }];
  const finalized = finalizeMemoryAwareInsight({
    summary: "今天推进了一点。",
    observation: "这和长期目标有一些联系。",
    tomorrow_suggestion: "明天可以留下一小步。",
    referenced_memory_ids: ["goal-1", "invented"],
    memory_candidate: { type: "goal", content: "完成自己的个人作品", reason: "今天仍在推进" },
  }, selected);

  assert.deepEqual(finalized.referenced_memories, selected);
  assert.equal(finalized.memory_candidate, null);
});

test("checks a memory candidate against every active memory, not only the selected context", () => {
  const selected = [{ id: "goal-1", type: "goal", content: "完成自己的个人作品" }];
  const allExisting = [
    ...selected,
    { id: "habit-hidden", category: "habit", content: "晚上阅读半小时" },
  ];
  const finalized = finalizeMemoryAwareInsight({
    summary: "今天做了一些整理。",
    observation: "节奏比较平稳。",
    tomorrow_suggestion: "明天继续一点点。",
    referenced_memory_ids: ["goal-1"],
    memory_candidate: { type: "habit", content: "晚上阅读半小时", reason: "今天再次提到了阅读" },
  }, selected, allExisting);

  assert.equal(finalized.memory_candidate, null);
});

test("restores safe memory metadata from the cached source snapshot", () => {
  assert.deepEqual(readInsightMemoryMeta({ ai_result_meta: {
    referenced_memories: [{ id: "habit-1", type: "habit", content: "晚上阅读" }],
    memory_candidate: { type: "observation", content: "下午更适合整理", reason: "多次记录相似" },
  } }), {
    referenced_memories: [{ id: "habit-1", type: "habit", content: "晚上阅读" }],
    memory_candidate: { type: "observation", content: "下午更适合整理", reason: "多次记录相似" },
  });
  assert.deepEqual(readInsightMemoryMeta(null), { referenced_memories: [], memory_candidate: null });
});
