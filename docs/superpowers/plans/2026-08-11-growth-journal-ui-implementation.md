# Growth Journal UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把现有“明日复明日”界面升级为成长日记型视觉，同时完整保留日期、星期、农历、每日句子、日期切换、任务、天气、心情、重要日子、反馈、登录、同步、AI 与 PWA 功能。

**Architecture:** 复用现有 DOM 节点、ID 和 `data-view-link` 事件机制，仅增加布局容器并重新排列已有区域。首页继续以任务为主，成长记录页用“索引栏 + 日记正文”双栏表达；移动端回落为单栏。业务逻辑文件 `app.js` 不做功能性修改。

**Tech Stack:** 原生 HTML、CSS、JavaScript，Node.js 内置测试运行器，现有 Service Worker。

## Global Constraints

- 日期格式保持数字形式，例如“8月11日 周二”，并继续显示原有农历。
- 原有页面元素、ID、表单字段、按钮和页面入口不得删除。
- “重要日子”保留主导航；反馈入口改为右上角“写给开发者”。
- 不修改 Supabase 数据结构、Edge Function、认证、同步、任务顺延和 AI 业务逻辑。
- 不引入第三方 UI 框架或字体依赖。
- 当前工作区已有未提交修改；实施时不自动提交包含这些修改的 `index.html`、`styles.css`、`app.js` 或 `sw.js`。

---

### Task 1: 建立页面结构回归测试

**Files:**
- Create: `tests/ui-structure.test.mjs`
- Test: `tests/ui-structure.test.mjs`

**Interfaces:**
- Consumes: `index.html`、`styles.css`、`sw.js` 的文本内容。
- Produces: 对必需 ID、导航入口、新布局容器和缓存版本的静态回归保护。

- [ ] **Step 1: 写入会先失败的结构测试**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");

const count = (source, value) => source.split(value).length - 1;

test("保留首页日期、农历、句子、天气、心情、任务和重要提醒节点", () => {
  for (const id of [
    "relativeDay", "dayTitle", "calendarInfo", "dayWhisper", "quoteSource",
    "quoteRefresh", "prevDay", "todayButton", "nextDay", "weatherCard",
    "moodSelect", "taskForm", "taskList", "gentleReminders"
  ]) assert.equal(count(html, `id="${id}"`), 1, `${id} 必须且只能存在一次`);
});

test("四个主导航保留，反馈入口位于右侧操作区", () => {
  for (const view of ["today", "growth", "memories", "important-days", "feedback"])
    assert.equal(count(html, `data-view-link="${view}"`), view === "today" ? 2 : 1);
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
```

- [ ] **Step 2: 运行测试并确认失败原因来自尚未存在的新结构**

Run: `node --test tests/ui-structure.test.mjs`

Expected: FAIL，至少报告缺少 `topbar-actions`、`day-context`、`growth-journal` 或 `3.1.0` 缓存版本。

---

### Task 2: 重排导航与首页上下文区域

**Files:**
- Modify: `index.html:14-137`
- Modify: `styles.css:1-124`
- Test: `tests/ui-structure.test.mjs`

**Interfaces:**
- Consumes: 现有 `data-view-link` 自动绑定、所有已有首页元素 ID。
- Produces: 四项主导航、右上角反馈入口、任务优先的首页布局。

- [ ] **Step 1: 将反馈按钮移入右侧操作区**

在 `.main-nav` 中保留 `today`、`growth`、`memories`、`important-days` 四个按钮，并把原反馈按钮与账号按钮放进：

```html
<div class="topbar-actions">
  <button class="feedback-entry" data-view-link="feedback" type="button">
    <span class="feedback-entry-long">写给开发者</span>
    <span class="feedback-entry-short">反馈</span>
  </button>
  <button class="account-button" id="accountButton" type="button">…</button>
</div>
```

不修改 `data-view-link="feedback"`，使 `app.js` 继续自动绑定页面切换。

- [ ] **Step 2: 用 `day-context` 包裹已有天气、心情和重要提醒**

```html
<div class="day-context">
  <section class="weather-card" id="weatherCard">…</section>
  <section class="mood-card">…</section>
  <aside class="gentle-reminders" id="gentleReminders" hidden aria-live="polite">…</aside>
</div>
```

将 `gentleReminders` 从任务表单下方移动到该容器内，但保留其 ID、内容和 `hidden` 状态。日期标题 `dayTitle`、农历 `calendarInfo`、句子和三个日期按钮保持原位。

- [ ] **Step 3: 建立首页层级与顶部导航样式**

```css
.topbar-actions { justify-self: end; display: flex; align-items: center; gap: 12px; }
.feedback-entry { border: 0; padding: 7px 0; background: transparent; color: var(--leaf); cursor: pointer; font-size: 12px; font-weight: 800; }
.feedback-entry-short { display: none; }
.day-context { display: grid; grid-template-columns: minmax(0, 1.12fr) minmax(0, .88fr); gap: 10px; margin-top: 16px; }
.day-context .weather-card, .day-context .mood-card { margin: 0; }
.day-context .gentle-reminders { grid-column: 1 / -1; margin: 0; }
```

同时把任务输入区顶部间距收紧，使任务区紧随今日环境区域；不覆盖日期、任务完成、夜间天气主题和表单控件现有状态样式。

- [ ] **Step 4: 运行结构测试**

Run: `node --test tests/ui-structure.test.mjs`

Expected: 日期与导航相关断言 PASS；成长布局和缓存版本断言仍 FAIL。

---

### Task 3: 将成长记录页重排为成长日记

**Files:**
- Modify: `index.html:138-188`
- Modify: `styles.css:125-145`
- Test: `tests/ui-structure.test.mjs`

**Interfaces:**
- Consumes: `growthDateLabel`、`reviewForm`、三个复盘字段、`aiInsightCard` 及其所有子节点。
- Produces: `.growth-journal` 两栏容器、`.growth-index` 日记索引和 `.growth-entry` 正文区域。

- [ ] **Step 1: 用新容器重排现有成长记录节点**

```html
<div class="growth-layout">
  <div class="growth-journal">
    <aside class="growth-index">
      <p class="eyebrow">成长日记</p>
      <div class="growth-date" id="growthDateLabel">今天</div>
      <ol class="growth-index-list">
        <li><span>01</span>今天做过的事</li>
        <li><span>02</span>尚未完成的事</li>
        <li><span>03</span>想带给明天</li>
      </ol>
    </aside>
    <main class="growth-entry">
      <header class="growth-header">…</header>
      <form class="review-card" id="reviewForm">…</form>
      <section class="ai-insight-card" id="aiInsightCard">…</section>
    </main>
  </div>
</div>
```

已有表单字段、按钮、ID 和文案全部保留，只移动 `growthDateLabel` 到索引栏。

- [ ] **Step 2: 写入桌面端日记布局样式**

```css
.growth-layout { padding: 0; overflow: hidden; }
.growth-journal { display: grid; grid-template-columns: 210px minmax(0, 1fr); min-height: 680px; }
.growth-index { padding: 58px 28px; background: rgba(234,242,239,.88); border-right: 1px solid var(--line); }
.growth-index-list { list-style: none; margin: 34px 0 0; padding: 0; }
.growth-index-list li { display: grid; grid-template-columns: 25px 1fr; gap: 8px; padding: 12px 0; border-top: 1px solid rgba(77,128,111,.16); color: var(--muted); font-size: 11px; }
.growth-entry { min-width: 0; padding: 58px 52px; }
.growth-entry .review-card, .growth-entry .ai-insight-card { max-width: none; }
```

- [ ] **Step 3: 写入移动端回落样式**

在现有 `@media (max-width: 720px)` 中加入：

```css
.growth-journal { grid-template-columns: 1fr; }
.growth-index { padding: 22px; border-right: 0; border-bottom: 1px solid var(--line); }
.growth-index-list { display: flex; gap: 8px; margin-top: 16px; overflow-x: auto; }
.growth-index-list li { flex: 0 0 auto; min-width: 130px; }
.growth-entry { padding: 34px 22px; }
```

- [ ] **Step 4: 运行结构测试**

Run: `node --test tests/ui-structure.test.mjs`

Expected: 除缓存版本外其余断言 PASS。

---

### Task 4: 完成视觉令牌、响应式细节和 PWA 缓存更新

**Files:**
- Modify: `styles.css`
- Modify: `index.html:9`
- Modify: `sw.js:1-2`
- Test: `tests/ui-structure.test.mjs`

**Interfaces:**
- Consumes: 现有 CSS 变量、天气主题和 Service Worker 安装流程。
- Produces: 一致的成长日记视觉、320px 可用布局、可立即刷新的 `3.1.0` 资源版本。

- [ ] **Step 1: 调整设计令牌与成长线细节**

保留变量名，更新值为：

```css
:root {
  --ink: #263c34;
  --muted: #6f7f79;
  --paper: #fbfcfb;
  --mist: #eaf2ef;
  --line: #d7e3de;
  --leaf: #5f8f7b;
  --leaf-soft: #e3f0ea;
  --dawn: #e9ad5f;
  --dawn-soft: #fff1df;
  --rose: #ad675f;
  --shadow: 0 24px 70px rgba(45,72,63,.11);
}
```

继续使用 `.day-stage::before` 与 `.day-stage::after` 作为成长线，不删除或遮挡日期区域。

- [ ] **Step 2: 完成 720px 与 430px 响应式规则**

```css
@media (max-width: 720px) {
  .feedback-entry-long { display: none; }
  .feedback-entry-short { display: inline; }
  .day-context { grid-template-columns: 1fr; }
  .day-context .gentle-reminders { grid-column: auto; }
}
@media (max-width: 430px) {
  .topbar-actions { gap: 8px; }
  .main-nav { scrollbar-width: none; }
}
```

检查所有输入框、任务操作和导航在 320px 宽度不重叠。

- [ ] **Step 3: 更新页面与缓存版本**

将 `index.html` 的样式引用改为 `styles.css?v=3.1.0`，将 `sw.js` 的缓存名改为 `mingri-shell-4.1`，并同步其 `APP_SHELL` 中的样式 URL。

- [ ] **Step 4: 运行全部静态测试**

Run: `node --test tests/ui-structure.test.mjs`

Expected: 4 tests PASS。

Run: `node --check app.js`

Expected: 无输出且退出码 0。

Run: `node --check sw.js`

Expected: 无输出且退出码 0。

Run: `node --test supabase/functions/growth-agent/request-validation.test.mjs supabase/functions/growth-agent/daily-insight.test.mjs`

Expected: 现有 Growth Agent 测试全部 PASS。

---

### Task 5: 浏览器回归与视觉检查

**Files:**
- Verify: `index.html`
- Verify: `styles.css`
- Verify: `app.js`
- Verify: `sw.js`

**Interfaces:**
- Consumes: 本地静态站点和浏览器运行时。
- Produces: 桌面端与移动端验证证据，不改业务数据。

- [ ] **Step 1: 启动本地静态服务并打开首页**

Run: `python -m http.server 5500`

Expected: `http://127.0.0.1:5500/index.html` 可访问，无 HTML/CSS 资源 404。

- [ ] **Step 2: 桌面端检查 1280px 页面**

确认数字日期、星期、农历、每日句子、日期切换按钮、天气、心情、重要日子提醒、任务列表和“剩下的，明天继续”均可见；点击四个主导航和“写给开发者”均进入正确页面。

- [ ] **Step 3: 检查成长记录页**

确认索引栏、当前日期、三个复盘字段、保存按钮、AI 按钮和 AI 结果容器均存在；保存复盘与调用 AI 的事件仍正常。

- [ ] **Step 4: 检查 390px 与 320px 页面**

确认无横向溢出、导航可访问全部入口、反馈按钮可见、日期与农历不被裁切、任务输入和成长记录变为单栏。

- [ ] **Step 5: 检查控制台与网络面板**

确认没有由本次改版新增的 JavaScript 错误、重复 ID、资源 404 或样式缓存旧版本问题。
