import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");

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

test("AI memory references and candidate actions exist", () => {
  for (const id of [
    "aiInsightMemories",
    "aiInsightMemoryCount",
    "aiInsightMemoryList",
    "aiMemoryCandidate",
    "aiMemoryCandidateContent",
    "aiMemoryCandidateReason",
    "rememberCandidate",
    "editCandidate",
    "dismissCandidate",
  ]) assert.equal(count(html, `id="${id}"`), 1, `${id} must exist exactly once`);
  assert.match(css, /\.ai-memory-candidate\s*\{/);
});

test("PWA 缓存引用新的 3.2.0 页面资源", () => {
  assert.match(html, /styles\.css\?v=3\.2\.0/);
  assert.match(html, /app\.js\?v=3\.0\.2/);
  assert.match(sw, /styles\.css\?v=3\.2\.0/);
  assert.match(sw, /app\.js\?v=3\.0\.2/);
  assert.match(sw, /task-sync\.mjs\?v=1\.0\.0/);
  assert.match(sw, /mingri-shell-4\.3/);
});

test("夜间不会自动切换为深色页面", () => {
  assert.doesNotMatch(css, /body\[data-weather="night"\]/);
  assert.doesNotMatch(app, /hour\s*<\s*6\s*\|\|\s*hour\s*>=\s*19\s*\?\s*"night"/);
  assert.doesNotMatch(app, /night:\s*"#273649"/);
});

test("日期箭头中间明确表示返回真实今天", () => {
  assert.match(html, /<button id="todayButton" type="button">回到今天<\/button>/);
  assert.match(app, /state\.selectedDay\s*=\s*todayKey\(\)/);
});

test("首页次要功能默认收起并保留原有控件", () => {
  for (const id of ["dailyContextDetails", "dailyContextSummary", "taskOptionsDetails", "taskOptionsSummary", "dayFooter"]) {
    assert.equal(count(html, `id="${id}"`), 1);
  }
  assert.match(html, /<details class="daily-context-disclosure" id="dailyContextDetails">/);
  assert.match(html, /<details class="task-options" id="taskOptionsDetails">/);
  assert.doesNotMatch(html, /<details[^>]+(?:dailyContextDetails|taskOptionsDetails)[^>]+open/);
  for (const id of ["weatherCity", "moodSelect", "moodNote", "taskTime", "taskRepeat"]) {
    assert.equal(count(html, `id="${id}"`), 1);
  }
});

test("首页辅助状态采用安静且按需出现的样式", () => {
  assert.match(css, /\.sync-note\.synced\s+#syncText\s*\{[^}]*display:\s*none/);
  assert.match(css, /\.sync-note\.synced\s+#syncAction\s*\{[^}]*display:\s*none/);
  assert.match(app, /\$\("#dayFooter"\)\.hidden\s*=\s*unfinished\s*===\s*0/);
  assert.match(css, /\.day-footer\[hidden\]\s*\{[^}]*display:\s*none/);
  assert.match(app, /dailyContextSummary/);
  assert.match(app, /taskOptionsSummary/);
});
