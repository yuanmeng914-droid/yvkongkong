import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDailyInsightRequest,
  validateDailyInsight,
  validateInsightDate,
} from "./daily-insight.js";

test("accepts a calendar day in YYYY-MM-DD format", () => {
  assert.equal(validateInsightDate("2026-08-11"), "2026-08-11");
});

test("rejects malformed calendar days", () => {
  assert.equal(validateInsightDate("2026/08/11"), null);
  assert.equal(validateInsightDate("2026-02-30"), null);
});

test("builds a model request without task titles or long-term memories", () => {
  const request = buildDailyInsightRequest({
    day: "2026-08-11",
    tasks: { total: 3, completed: 1, unfinished: 2, carried: 1 },
    mood: { mood: "平静", note: "午后散步" },
    review: { highlight: "完成了报告", unfinished: "整理材料", next: "明天先列提纲" },
    hiddenTaskTitle: "不应该上传的任务标题",
    hiddenMemory: "不应该上传的长期记忆",
  });

  const serialized = JSON.stringify(request);
  assert.match(request.input, /温和/);
  assert.doesNotMatch(serialized, /不应该上传/);
  assert.deepEqual(request.context.tasks, { total: 3, completed: 1, unfinished: 2, carried: 1 });
});

test("accepts the exact three user-visible insight fields", () => {
  assert.deepEqual(validateDailyInsight({
    summary: "今天留下了一点真实的记录。",
    observation: "你在慢慢把注意力放回眼前的事。",
    tomorrow_suggestion: "明天可以先从最轻的一步开始。",
  }), {
    summary: "今天留下了一点真实的记录。",
    observation: "你在慢慢把注意力放回眼前的事。",
    tomorrow_suggestion: "明天可以先从最轻的一步开始。",
  });
});

test("rejects incomplete or overlong insight fields", () => {
  assert.equal(validateDailyInsight({ summary: "有", observation: "有" }), null);
  assert.equal(validateDailyInsight({
    summary: "a".repeat(301),
    observation: "观察",
    tomorrow_suggestion: "建议",
  }), null);
});
