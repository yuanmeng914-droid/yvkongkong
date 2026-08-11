import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");

const count = (source, value) => source.split(value).length - 1;

test("保留首页日期、农历、句子、天气、心情、任务和重要提醒节点", () => {
  for (const id of [
    "relativeDay",
    "dayTitle",
    "calendarInfo",
    "dayWhisper",
    "quoteSource",
    "quoteRefresh",
    "prevDay",
    "todayButton",
    "nextDay",
    "weatherCard",
    "moodSelect",
    "taskForm",
    "taskList",
    "gentleReminders",
  ]) {
    assert.equal(count(html, `id="${id}"`), 1, `${id} 必须且只能存在一次`);
  }
});

test("四个主导航保留，反馈入口位于右侧操作区", () => {
  for (const view of ["today", "growth", "memories", "important-days", "feedback"]) {
    assert.equal(count(html, `data-view-link="${view}"`), view === "today" ? 2 : 1);
  }
  assert.match(html, /class="topbar-actions"/);
  assert.match(html, /class="feedback-entry"[^>]*data-view-link="feedback"/);
});

test("首页上下文和成长日记布局存在", () => {
  assert.match(html, /class="day-context"/);
  assert.match(html, /class="growth-journal"/);
  assert.match(html, /class="growth-index"/);
  assert.match(css, /\.growth-journal\s*\{/);
  assert.match(css, /@media \(max-width: 720px\)/);
});

test("PWA 缓存引用新的 3.1.0 页面资源", () => {
  assert.match(html, /styles\.css\?v=3\.1\.0/);
  assert.match(sw, /styles\.css\?v=3\.1\.0/);
  assert.match(sw, /mingri-shell-4\.1/);
});
