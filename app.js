import {
  createTaskSyncQueue,
  markTaskPending,
  markTaskSynced,
  mergeTaskRecords,
  needsTaskSync,
} from "./task-sync.mjs?v=1.0.0";

const STORAGE_KEY = "mingri-tasks-v2";
const LEGACY_KEY = "xuri-tasks-v1";
const IMPORTANT_KEY = "mingri-important-days-v1";
const FEEDBACK_GUARD_KEY = "mingri-last-feedback-v1";
const CARRY_UNDO_KEY = "mingri-last-carry-v1";
const QUOTE_KEY = "mingri-quote-choice-v1";
const WEATHER_CITY_KEY = "mingri-weather-city-v1";
const MOOD_KEY = "mingri-mood-v1";
const REVIEW_KEY = "mingri-daily-review-v1";
const MEMORY_KEY = "mingri-memories-v1";
const REDUCE_MOTION_KEY = "mingri-reduce-motion-v1";
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const config = window.APP_CONFIG || {};
const taskSyncQueue = createTaskSyncQueue();

const literaryQuotes = [
  { text: "且将新火试新茶，诗酒趁年华。", source: "苏轼《望江南·超然台作》" },
  { text: "山中何事？松花酿酒，春水煎茶。", source: "张可久《人月圆·山中书事》" },
  { text: "行到水穷处，坐看云起时。", source: "王维《终南别业》" },
  { text: "采菊东篱下，悠然见南山。", source: "陶渊明《饮酒·其五》" },
  { text: "晚来天欲雪，能饮一杯无？", source: "白居易《问刘十九》" },
  { text: "绿蚁新醅酒，红泥小火炉。", source: "白居易《问刘十九》" },
  { text: "沾衣欲湿杏花雨，吹面不寒杨柳风。", source: "志南《绝句》" },
  { text: "春水碧于天，画船听雨眠。", source: "韦庄《菩萨蛮·人人尽说江南好》" },
  { text: "日长睡起无情思，闲看儿童捉柳花。", source: "杨万里《闲居初夏午睡起》" },
  { text: "荷风送香气，竹露滴清响。", source: "孟浩然《夏日南亭怀辛大》" },
  { text: "蝉噪林逾静，鸟鸣山更幽。", source: "王籍《入若耶溪》" },
  { text: "明月松间照，清泉石上流。", source: "王维《山居秋暝》" },
  { text: "停车坐爱枫林晚，霜叶红于二月花。", source: "杜牧《山行》" },
  { text: "湖光秋月两相和，潭面无风镜未磨。", source: "刘禹锡《望洞庭》" },
  { text: "孤舟蓑笠翁，独钓寒江雪。", source: "柳宗元《江雪》" },
  { text: "柴门闻犬吠，风雪夜归人。", source: "刘长卿《逢雪宿芙蓉山主人》" },
  { text: "海内存知己，天涯若比邻。", source: "王勃《送杜少府之任蜀州》" },
  { text: "莫愁前路无知己，天下谁人不识君。", source: "高适《别董大》" },
  { text: "沉舟侧畔千帆过，病树前头万木春。", source: "刘禹锡《酬乐天扬州初逢席上见赠》" },
  { text: "山重水复疑无路，柳暗花明又一村。", source: "陆游《游山西村》" },
  { text: "不畏浮云遮望眼，自缘身在最高层。", source: "王安石《登飞来峰》" },
  { text: "天生我材必有用，千金散尽还复来。", source: "李白《将进酒》" },
  { text: "长风破浪会有时，直挂云帆济沧海。", source: "李白《行路难·其一》" },
  { text: "会当凌绝顶，一览众山小。", source: "杜甫《望岳》" },
  { text: "路漫漫其修远兮，吾将上下而求索。", source: "屈原《离骚》" },
  { text: "不积跬步，无以至千里。", source: "《荀子·劝学》" },
  { text: "凡事预则立，不预则废。", source: "《礼记·中庸》" },
  { text: "知者乐水，仁者乐山。", source: "《论语·雍也》" },
  { text: "岁寒，然后知松柏之后凋也。", source: "《论语·子罕》" },
  { text: "人间有味是清欢。", source: "苏轼《浣溪沙·细雨斜风作晓寒》" },
  { text: "此心安处是吾乡。", source: "苏轼《定风波·南海归赠王定国侍人寓娘》" },
  { text: "归去，也无风雨也无晴。", source: "苏轼《定风波·莫听穿林打叶声》" },
  { text: "一蓑烟雨任平生。", source: "苏轼《定风波·莫听穿林打叶声》" },
  { text: "海上生明月，天涯共此时。", source: "张九龄《望月怀远》" },
  { text: "青青子衿，悠悠我心。", source: "《诗经·郑风·子衿》" },
  { text: "桃李不言，下自成蹊。", source: "《史记·李将军列传》" },
  { text: "清风徐来，水波不兴。", source: "苏轼《前赤壁赋》" },
  { text: "寄蜉蝣于天地，渺沧海之一粟。", source: "苏轼《前赤壁赋》" },
  { text: "且放白鹿青崖间，须行即骑访名山。", source: "李白《梦游天姥吟留别》" },
  { text: "小舟从此逝，江海寄余生。", source: "苏轼《临江仙·夜归临皋》" },
];

const completionWords = [
  "又轻轻放下了一件事。",
  "这一件，已经好好完成了。",
  "今天又向前走了一小步。",
  "做到了，剩下的继续慢慢来。",
  "这份认真，已经被今天记住了。",
];

const state = {
  tasks: loadLocalTasks(),
  importantDays: loadImportantDays(),
  memories: loadLocalMemories(),
  selectedDay: todayKey(),
  user: null,
  supabase: null,
  authMode: "login",
  cloudReady: false,
  reminderSeen: new Set(),
  toastAction: null,
  weather: { city: localStorage.getItem(WEATHER_CITY_KEY) || "", reading: "", hint: "天气只负责路过，不负责安排你。", symbol: "☼", loaded: false },
  push: { supported: false, subscribed: false },
  aiInsights: {},
  aiInsightLoading: false,
  pendingMemorySource: "user",
  aiInsightEmptyDay: "",
  aiInsightError: "",
};

async function init() {
  bindEvents();
  renderAll();
  applyReduceMotion(localStorage.getItem(REDUCE_MOTION_KEY) === "1");
  registerServiceWorker();
  offerPendingCarryUndo();
  const initialView = location.hash.slice(1);
  if (["today", "growth", "memories", "important-days", "feedback"].includes(initialView)) switchView(initialView);
  if (config.supabaseUrl && config.supabasePublishableKey) await initCloud();
  else {
    rolloverToToday();
    renderAll();
  }
  if (state.weather.city && config.weatherEndpoint) await loadWeather(state.weather.city);
  if (state.weather.city && config.weatherEndpoint) setInterval(() => loadWeather(state.weather.city), 30 * 60 * 1000);
  checkReminders();
  setInterval(checkReminders, 30000);
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try { await navigator.serviceWorker.register("sw.js", { scope: "./" }); }
  catch (error) { console.info("离线能力暂时不可用", error); }
}

async function initCloud() {
  try {
    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
    state.supabase = createClient(config.supabaseUrl, config.supabasePublishableKey);
    const { data } = await state.supabase.auth.getSession();
    await applySession(data.session);
    state.supabase.auth.onAuthStateChange((_event, session) => setTimeout(() => applySession(session), 0));
  } catch (error) {
    console.error(error);
    showToast("云端暂时没有连上，本地记录不受影响");
  }
}

async function applySession(session) {
  state.user = session?.user || null;
  state.cloudReady = Boolean(state.user);
  state.aiInsights = {};
  state.aiInsightEmptyDay = "";
  state.aiInsightError = "";
  updateAccountUI();
  renderDailyInsight();
  if (state.user) {
    await loadCloudTasks();
    await flushPendingTaskSync();
    const cloudCarriedTasks = rolloverToToday();
    if (cloudCarriedTasks.length) {
      renderAll();
      await Promise.all(cloudCarriedTasks.map(persistTask));
    }
    await importLocalImportantDays();
    await loadCloudImportantDays();
    await loadCloudMoods();
    await loadCloudReviews();
    await importLocalMemories();
    await loadCloudMemories();
    await syncPushSubscription();
    void loadDailyInsightForSelectedDay();
  } else {
    state.tasks = loadLocalTasks();
    rolloverToToday();
    state.importantDays = loadImportantDays();
    state.memories = loadLocalMemories();
    renderAll();
  }
}

function todayKey() { return toKey(new Date()); }
function toKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function fromKey(key) { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d); }
function shiftDay(key, amount) { const date = fromKey(key); date.setDate(date.getDate() + amount); return toKey(date); }
function daysBetween(a, b) { return Math.round((fromKey(b) - fromKey(a)) / 86400000); }
function formatLong(key) {
  const date = fromKey(key);
  if (Number.isNaN(date.getTime())) return "";
  const weekday = ["日", "一", "二", "三", "四", "五", "六"][date.getDay()];
  return `${date.getMonth() + 1}月${date.getDate()}日周${weekday}`;
}
function formatShort(key) { return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(fromKey(key)); }
function dateSeed(key) { return [...key].reduce((sum, char) => sum + char.charCodeAt(0), 0); }
function nowTime() { return new Date().toTimeString().slice(0, 5); }

function loadLocalTasks() {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (current) return current.map(normalizeTask);
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY)) || [];
    const migrated = legacy.map(normalizeTask);
    if (migrated.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch { return []; }
}

function normalizeTask(task) {
  return {
    id: task.id || crypto.randomUUID(),
    text: task.text,
    day: task.day,
    time: task.time || null,
    originalDay: task.originalDay || task.carriedFrom || task.day,
    createdAt: task.createdAt || Date.now(),
    updatedAt: task.updatedAt || Date.now(),
    completedAt: task.completedAt || null,
    done: Boolean(task.done || task.completedAt),
    carryCount: task.carryCount || 0,
    history: task.history || [],
    deletedAt: task.deletedAt || null,
    syncedUserId: task.syncedUserId || null,
    syncPending: Boolean(task.syncPending),
    repeatRule: task.repeatRule || null,
    recurrenceId: task.recurrenceId || null,
  };
}

function loadImportantDays() {
  try { return (JSON.parse(localStorage.getItem(IMPORTANT_KEY)) || []).map(normalizeImportantDay); }
  catch { return []; }
}

function normalizeImportantDay(item) {
  return {
    id: item.id || crypto.randomUUID(),
    name: item.name,
    date: item.date,
    type: item.type || "other",
    remindDays: Number(item.remindDays ?? 3),
    yearly: Boolean(item.yearly),
    note: item.note || "",
    createdAt: item.createdAt || Date.now(),
    updatedAt: item.updatedAt || Date.now(),
    deletedAt: item.deletedAt || null,
    syncedUserId: item.syncedUserId || null,
  };
}

function saveLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
  if ($("#syncNote")) updateAccountUI();
}
function saveImportantDays() { localStorage.setItem(IMPORTANT_KEY, JSON.stringify(state.importantDays)); }

function rolloverToToday() {
  const today = todayKey();
  const moved = [];
  state.tasks.forEach((task) => {
    if (!task.done && !task.deletedAt && task.day < today) {
      const from = task.day;
      task.history.push({ type: "carried", from, to: today, at: new Date().toISOString() });
      task.carryCount += Math.max(1, daysBetween(from, today));
      task.day = today;
      task.updatedAt = Date.now();
      markTaskPending(task);
      moved.push(task);
    }
  });
  if (moved.length) saveLocal();
  return moved;
}

function renderAll() {
  materializeRecurringTasks(state.selectedDay);
  renderTasks();
  renderImportantDays();
  renderReminders();
  renderWeather();
  renderCalendarInfo();
  renderMood();
  renderReview();
  renderDailyInsight();
  renderMemories();
  if (state.cloudReady) void loadDailyInsightForSelectedDay();
}

function materializeRecurringTasks(day) {
  const target = fromKey(day);
  const generated = [];
  state.tasks.filter((task) => task.repeatRule && !task.deletedAt && !task.recurrenceId).forEach((base) => {
    const start = fromKey(base.day);
    const rule = base.repeatRule;
    const matches = target > start && (rule.frequency === "daily" || (rule.frequency === "weekly" && target.getDay() === rule.weekday));
    if (!matches || state.tasks.some((task) => task.recurrenceId === base.id && task.day === day && !task.deletedAt)) return;
    generated.push(normalizeTask({
      id: crypto.randomUUID(), text: base.text, time: base.time, day, originalDay: day,
      createdAt: Date.now(), recurrenceId: base.id, syncPending: true,
    }));
  });
  if (!generated.length) return;
  state.tasks.push(...generated);
  saveLocal();
  generated.forEach((task) => { void persistTask(task); });
}

function renderCalendarInfo() {
  const date = fromKey(state.selectedDay);
  if (Number.isNaN(date.getTime())) return;
  let lunar = "";
  try {
    lunar = new Intl.DateTimeFormat("zh-CN-u-ca-chinese", { month: "long", day: "numeric" }).format(date);
  } catch { lunar = ""; }
  const term = solarTermFor(date);
  $("#calendarInfo").textContent = [lunar && `农历${lunar}`, term].filter(Boolean).join(" · ");
}

function solarTermFor(date) {
  const terms = [
    ["小寒", 1, 5.4055], ["大寒", 1, 20.12], ["立春", 2, 3.87], ["雨水", 2, 18.73],
    ["惊蛰", 3, 5.63], ["春分", 3, 20.646], ["清明", 4, 4.81], ["谷雨", 4, 20.1],
    ["立夏", 5, 5.52], ["小满", 5, 21.04], ["芒种", 6, 5.678], ["夏至", 6, 21.37],
    ["小暑", 7, 7.108], ["大暑", 7, 22.83], ["立秋", 8, 7.5], ["处暑", 8, 23.13],
    ["白露", 9, 7.646], ["秋分", 9, 23.042], ["寒露", 10, 8.318], ["霜降", 10, 23.438],
    ["立冬", 11, 7.438], ["小雪", 11, 22.36], ["大雪", 12, 7.18], ["冬至", 12, 21.94],
  ];
  const year = date.getFullYear();
  if (year < 2000 || year > 2099) return "";
  const y = year % 100;
  const match = terms.find(([, month, constant]) => {
    const day = Math.floor(y * 0.2422 + constant) - Math.floor((y - 1) / 4);
    return date.getMonth() + 1 === month && date.getDate() === day;
  });
  return match?.[0] || "";
}

function moodStorageKey(day) { return `${MOOD_KEY}:${day}`; }

function updateDailyContextSummary() {
  const target = $("#dailyContextSummary");
  if (!target) return;
  const saved = JSON.parse(localStorage.getItem(moodStorageKey(state.selectedDay)) || "null");
  const weather = state.weather.reading || state.weather.city || "天气未设置";
  const mood = saved?.mood || "心情未记录";
  target.textContent = `${weather} · ${mood}`;
}

function renderMood() {
  const saved = JSON.parse(localStorage.getItem(moodStorageKey(state.selectedDay)) || "null");
  $("#moodSelect").value = saved?.mood || "";
  $("#moodNote").value = saved?.note || "";
  updateDailyContextSummary();
}

function saveMood() {
  const mood = $("#moodSelect").value;
  const note = $("#moodNote").value.trim();
  if (!mood && !note) {
    localStorage.removeItem(moodStorageKey(state.selectedDay));
    void persistMood(state.selectedDay, null, null);
    renderMood();
    showToast("今天的心情已经留白");
    return;
  }
  localStorage.setItem(moodStorageKey(state.selectedDay), JSON.stringify({ mood, note, updatedAt: Date.now() }));
  void persistMood(state.selectedDay, mood, note);
  renderMood();
  showToast("今天的心情记下了");
}

async function persistMood(day, mood, note) {
  if (!state.cloudReady) return;
  if (!mood && !note) {
    await state.supabase.from("mood_entries").delete().eq("user_id", state.user.id).eq("mood_date", day);
    return;
  }
  await state.supabase.from("mood_entries").upsert({ user_id: state.user.id, mood_date: day, mood: mood || null, note: note || null, updated_at: new Date().toISOString() });
}

async function loadCloudMoods() {
  const { data, error } = await state.supabase.from("mood_entries").select("mood_date,mood,note");
  if (error) return;
  (data || []).forEach((entry) => localStorage.setItem(moodStorageKey(entry.mood_date), JSON.stringify({ mood: entry.mood || "", note: entry.note || "" })));
  renderMood();
}

function reviewStorageKey(day) { return `${REVIEW_KEY}:${day}`; }

function renderReview() {
  if (!$("#reviewForm")) return;
  const saved = JSON.parse(localStorage.getItem(reviewStorageKey(state.selectedDay)) || "null");
  $("#growthDateLabel").textContent = formatLong(state.selectedDay);
  $("#reviewHighlight").value = saved?.highlight || "";
  $("#reviewUnfinished").value = saved?.unfinished || "";
  $("#reviewNext").value = saved?.next || "";
}

async function saveReview(event) {
  event.preventDefault();
  const day = state.selectedDay;
  const review = {
    day,
    highlight: $("#reviewHighlight").value.trim(),
    unfinished: $("#reviewUnfinished").value.trim(),
    next: $("#reviewNext").value.trim(),
    updatedAt: Date.now(),
  };
  if (!review.highlight && !review.unfinished && !review.next) {
    localStorage.removeItem(reviewStorageKey(day));
    await persistReview(day, null);
    showToast("今天的记录已经留白");
    return;
  }
  localStorage.setItem(reviewStorageKey(day), JSON.stringify(review));
  await persistReview(day, review);
  showToast("今天的记录保存好了");
}

async function persistReview(day, review) {
  if (!state.cloudReady) return;
  if (!review) {
    await state.supabase.from("daily_reviews").delete().eq("user_id", state.user.id).eq("review_date", day);
    return;
  }
  await state.supabase.from("daily_reviews").upsert({
    user_id: state.user.id,
    review_date: day,
    highlight: review.highlight || null,
    unfinished: review.unfinished || null,
    next_step: review.next || null,
    updated_at: new Date().toISOString(),
  });
}

async function loadCloudReviews() {
  const { data, error } = await state.supabase.from("daily_reviews").select("review_date,highlight,unfinished,next_step");
  if (error) return;
  (data || []).forEach((entry) => localStorage.setItem(reviewStorageKey(entry.review_date), JSON.stringify({
    day: entry.review_date,
    highlight: entry.highlight || "",
    unfinished: entry.unfinished || "",
    next: entry.next_step || "",
  })));
  renderReview();
}

function insightForDay(day) {
  return Object.prototype.hasOwnProperty.call(state.aiInsights, day) ? state.aiInsights[day] : undefined;
}

function renderDailyInsight() {
  const button = $("#aiInsightAction");
  if (!button) return;
  const day = state.selectedDay;
  const insight = insightForDay(day);
  const signedIn = Boolean(state.user && state.cloudReady);
  const hasInsight = Boolean(insight?.summary && insight?.observation && insight?.tomorrow_suggestion);
  const result = $("#aiInsightResult");
  result.hidden = !hasInsight;
  $("#aiInsightSummary").textContent = hasInsight ? insight.summary : "";
  $("#aiInsightObservation").textContent = hasInsight ? insight.observation : "";
  $("#aiInsightSuggestion").textContent = hasInsight ? insight.tomorrow_suggestion : "";
  const references = hasInsight && Array.isArray(insight.referenced_memories) ? insight.referenced_memories : [];
  const memoryBox = $("#aiInsightMemories");
  memoryBox.hidden = references.length === 0;
  $("#aiInsightMemoryCount").textContent = `本次参考了 ${references.length} 条关于你的记录`;
  $("#aiInsightMemoryList").innerHTML = references.map((memory) => `<p><span>${escapeHTML(memoryCategoryLabels[memory.type] || "记忆")}</span>${escapeHTML(memory.content)}</p>`).join("");
  const candidate = hasInsight ? insight.memory_candidate : null;
  $("#aiMemoryCandidate").hidden = !candidate;
  $("#aiMemoryCandidateContent").textContent = candidate?.content || "";
  $("#aiMemoryCandidateReason").textContent = candidate?.reason || "";
  button.disabled = state.aiInsightLoading;
  button.textContent = state.aiInsightLoading ? "正在认真看看…" : hasInsight ? "重新看看今天" : signedIn ? "AI 看看今天" : "登录后使用";
  const status = $("#aiInsightStatus");
  if (!signedIn) status.textContent = "登录后，可以为今天留下一段 AI 小结。";
  else if (state.aiInsightLoading) status.textContent = "正在整理今天留下的内容…";
  else if (state.aiInsightError) status.textContent = state.aiInsightError;
  else if (state.aiInsightEmptyDay === day) status.textContent = "今天还不需要总结，也可以晚些再来。";
  else if (hasInsight) status.textContent = `这是 ${formatLong(day)} 留下的小结；重新生成会覆盖这一版。`;
  else status.textContent = "它会读取今天的任务统计、心情、复盘，以及少量由你确认保存的相关记忆。";
}

async function loadDailyInsightForSelectedDay() {
  const day = state.selectedDay;
  if (!state.cloudReady || insightForDay(day) !== undefined) return;
  const { data, error } = await state.supabase
    .from("ai_daily_insights")
    .select("insight_date,summary,observation,tomorrow_suggestion,model,updated_at,source_snapshot")
    .eq("insight_date", day)
    .maybeSingle();
  if (day !== state.selectedDay) return;
  const meta = data?.source_snapshot?.ai_result_meta || {};
  state.aiInsights[day] = error ? null : data ? {
    ...data,
    referenced_memories: Array.isArray(meta.referenced_memories) ? meta.referenced_memories : [],
    memory_candidate: meta.memory_candidate || null,
  } : null;
  renderDailyInsight();
}

async function requestDailyInsight(force) {
  if (!state.user || !state.cloudReady) return openAuth();
  if (!config.supabaseUrl || !config.supabasePublishableKey) {
    state.aiInsightError = "AI 暂时没有连上，稍后再试。";
    renderDailyInsight();
    return;
  }
  const day = state.selectedDay;
  state.aiInsightLoading = true;
  state.aiInsightEmptyDay = "";
  state.aiInsightError = "";
  renderDailyInsight();
  try {
    const { data } = await state.supabase.auth.getSession();
    if (!data.session?.access_token) throw new Error("missing_session");
    const response = await fetch(`${config.supabaseUrl}/functions/v1/growth-agent`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
        apikey: config.supabasePublishableKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "daily_analysis", context: { day, force: Boolean(force) } }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok) throw new Error(payload.error || "agent_failed");
    if (payload.result?.status === "no_daily_data") state.aiInsightEmptyDay = day;
    else state.aiInsights[day] = payload.result;
  } catch (error) {
    state.aiInsightError = dailyInsightErrorMessage(error?.message);
  } finally {
    state.aiInsightLoading = false;
    if (day === state.selectedDay) renderDailyInsight();
  }
}

function dailyInsightErrorMessage(code) {
  if (code === "missing_api_key") return "AI 正在准备中，请稍后再来。";
  if (code === "provider_request_failed" || code === "provider_invalid_response") return "AI 暂时没有回应，可以过一会儿再试。";
  if (code === "unauthorized") return "登录状态已过期，请重新登录后再试。";
  return "这次没有生成成功，但今天的记录都还在。";
}

function currentMemoryCandidate() {
  return insightForDay(state.selectedDay)?.memory_candidate || null;
}

function normalizeMemoryText(value) {
  return typeof value === "string" ? value.toLowerCase().replace(/[\s\p{P}\p{S}]/gu, "") : "";
}

function hasDuplicateMemory(content) {
  const candidate = normalizeMemoryText(content);
  if (!candidate) return false;
  return state.memories.some((memory) => {
    if (memory.deletedAt) return false;
    const existing = normalizeMemoryText(memory.content);
    if (existing === candidate) return true;
    const shorter = existing.length <= candidate.length ? existing : candidate;
    const longer = existing.length > candidate.length ? existing : candidate;
    return shorter.length >= 8 && longer.includes(shorter);
  });
}

function dismissMemoryCandidate() {
  const insight = insightForDay(state.selectedDay);
  if (!insight) return;
  insight.memory_candidate = null;
  renderDailyInsight();
}

async function rememberMemoryCandidate() {
  const candidate = currentMemoryCandidate();
  if (!candidate) return;
  if (hasDuplicateMemory(candidate.content)) {
    dismissMemoryCandidate();
    showToast("这件事已经在你的记忆里了");
    return;
  }
  const memory = {
    id: crypto.randomUUID(), category: candidate.type, content: candidate.content,
    source: "ai", createdAt: Date.now(), updatedAt: Date.now(), deletedAt: null, syncedUserId: null,
  };
  state.memories.push(memory);
  saveLocalMemories();
  renderMemories();
  dismissMemoryCandidate();
  await persistMemory(memory);
  showToast("只在你确认后，这件事才被记住");
}

function editMemoryCandidate() {
  const candidate = currentMemoryCandidate();
  if (!candidate) return;
  openMemoryDialog({ category: candidate.type, content: candidate.content, source: "ai" }, "ai");
}

const memoryCategoryLabels = { goal: "目标", preference: "偏好", habit: "习惯", experience: "经历", observation: "观察" };

function loadLocalMemories() {
  try {
    const value = JSON.parse(localStorage.getItem(MEMORY_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

function saveLocalMemories() { localStorage.setItem(MEMORY_KEY, JSON.stringify(state.memories)); }

function renderMemories() {
  if (!$("#memoryList")) return;
  const memories = state.memories.filter((memory) => !memory.deletedAt).sort((a, b) => b.updatedAt - a.updatedAt);
  $("#memoryList").innerHTML = "";
  memories.forEach((memory) => {
    const card = document.createElement("article");
    card.className = "memory-card";
    card.innerHTML = `<div class="memory-card-copy"><p class="memory-kind">${escapeHTML(memoryCategoryLabels[memory.category] || "记忆")}</p><p class="memory-content"></p><small>${new Date(memory.updatedAt).toLocaleDateString("zh-CN")}</small></div><div class="memory-actions"><button type="button" data-memory-edit>编辑</button><button type="button" data-memory-delete aria-label="删除这段记忆">×</button></div>`;
    card.querySelector(".memory-content").textContent = memory.content;
    card.querySelector("[data-memory-edit]").addEventListener("click", () => openMemoryDialog(memory));
    card.querySelector("[data-memory-delete]").addEventListener("click", () => deleteMemory(memory.id));
    $("#memoryList").append(card);
  });
  $("#memoryEmpty").hidden = memories.length > 0;
}

function openMemoryDialog(memory = null, source = "user") {
  state.pendingMemorySource = memory?.source || source;
  $("#memoryId").value = memory?.id || "";
  $("#memoryCategory").value = memory?.category || "goal";
  $("#memoryContent").value = memory?.content || "";
  $("#memoryDialogTitle").textContent = memory ? "修改这段记忆" : "记下一件事";
  $("#memorySubmit").textContent = memory ? "保存修改" : "保存这段记忆";
  $("#memoryDialog").showModal();
}

async function saveMemory(event) {
  event.preventDefault();
  const id = $("#memoryId").value;
  const existing = state.memories.find((memory) => memory.id === id);
  const memory = existing || { id: crypto.randomUUID(), createdAt: Date.now(), syncedUserId: null, source: state.pendingMemorySource || "user" };
  memory.category = $("#memoryCategory").value;
  memory.content = $("#memoryContent").value.trim();
  memory.updatedAt = Date.now();
  memory.deletedAt = null;
  memory.source = memory.source || "user";
  if (!memory.content) return;
  if (!existing && memory.source === "ai" && hasDuplicateMemory(memory.content)) {
    $("#memoryDialog").close();
    dismissMemoryCandidate();
    showToast("这件事已经在你的记忆里了");
    return;
  }
  if (!existing) state.memories.push(memory);
  saveLocalMemories();
  renderMemories();
  $("#memoryDialog").close();
  await persistMemory(memory);
  if (memory.source === "ai") dismissMemoryCandidate();
  showToast(existing ? "这段记忆已经更新" : "这段记忆已经保存");
}

async function deleteMemory(id) {
  const memory = state.memories.find((entry) => entry.id === id);
  if (!memory) return;
  memory.deletedAt = new Date().toISOString();
  memory.updatedAt = Date.now();
  saveLocalMemories();
  renderMemories();
  await persistMemory(memory);
  showToast("这段记忆已经删除");
}

async function persistMemory(memory) {
  if (!state.cloudReady) return;
  const row = {
    id: memory.id,
    user_id: state.user.id,
    category: memory.category,
    content: memory.content,
    source: memory.source || "user",
    created_at: new Date(memory.createdAt).toISOString(),
    updated_at: new Date(memory.updatedAt).toISOString(),
    deleted_at: memory.deletedAt || null,
  };
  const { error } = await state.supabase.from("user_memories").upsert(row);
  if (error) showToast("记忆已保存在本地，云端稍后重试");
}

async function importLocalMemories() {
  const pending = loadLocalMemories().filter((memory) => memory.syncedUserId !== state.user.id);
  for (const memory of pending) {
    memory.syncedUserId = state.user.id;
    await persistMemory(memory);
  }
  saveLocalMemories();
}

async function loadCloudMemories() {
  const { data, error } = await state.supabase.from("user_memories").select("id,category,content,source,created_at,updated_at,deleted_at");
  if (error) return;
  state.memories = (data || []).map((row) => ({
    id: row.id,
    category: row.category,
    content: row.content,
    source: row.source || "user",
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    deletedAt: row.deleted_at || null,
    syncedUserId: state.user.id,
  }));
  saveLocalMemories();
  renderMemories();
}

function renderWeather() {
  $("#weatherCity").value = state.weather.city;
  $("#weatherReading").textContent = state.weather.reading || (state.weather.city ? "正在等天气抵达" : "还没有选择城市");
  $("#weatherHint").textContent = state.weather.hint;
  $("#weatherSymbol").textContent = state.weather.symbol;
  updateDailyContextSummary();
}

function renderTaskOptionsSummary() {
  const target = $("#taskOptionsSummary");
  if (!target) return;
  const time = $("#taskTime").value;
  const repeat = $("#taskRepeat").value;
  const repeatLabel = repeat === "daily" ? "每天" : repeat === "weekly" ? "每周" : "";
  target.textContent = [time, repeatLabel].filter(Boolean).join(" · ") || "不设置";
}

function setWeatherMood(mood) {
  const allowed = ["clear", "cloudy", "rain", "snow", "unknown"];
  const value = allowed.includes(mood) ? mood : "unknown";
  document.body.dataset.weather = value;
  const colors = { clear: "#f6dca9", cloudy: "#c8d6df", rain: "#a8c5d1", snow: "#e8edf1", unknown: "#eaf1ee" };
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", colors[value]);
}

function weatherMood(icon, text = "") {
  const code = String(icon || "");
  const value = `${code} ${text || ""}`.toLowerCase();
  if (/^4\d\d/.test(code) || /(snow|ice|霜|雪|冻)/i.test(value)) return "snow";
  if (/^3\d\d/.test(code) || /(rain|shower|storm|雷|雨|阵)/i.test(value)) return "rain";
  if (/^1\d\d/.test(code) || /(cloud|overcast|阴|云)/i.test(value)) return "cloudy";
  return "clear";
}

async function loadWeather(city) {
  const cleanCity = city.trim();
  if (!cleanCity) {
    state.weather = { city: "", reading: "", hint: "天气只负责路过，不负责安排你。", symbol: "☼", loaded: false };
    localStorage.removeItem(WEATHER_CITY_KEY);
    setWeatherMood("unknown");
    renderWeather();
    return;
  }
  state.weather.city = cleanCity;
  localStorage.setItem(WEATHER_CITY_KEY, cleanCity);
  state.weather.reading = "正在等天气抵达";
  renderWeather();
  if (!config.weatherEndpoint) {
    setWeatherMood("unknown");
    state.weather.reading = "城市已经记下";
    state.weather.hint = "接入天气服务后，这里会显示真实天气。";
    renderWeather();
    return;
  }
  try {
    const url = new URL(config.weatherEndpoint, location.href);
    url.searchParams.set("city", cleanCity);
    const response = await fetch(url);
    if (!response.ok) throw new Error("weather request failed");
    const payload = await response.json();
    const now = payload.now || payload;
    state.weather.reading = [payload.city || cleanCity, now.text || now.description, now.temp ? `${now.temp}℃` : ""].filter(Boolean).join(" · ");
    state.weather.symbol = now.symbol || weatherSymbol(now.icon);
    state.weather.hint = payload.hint || "天气只负责路过，不负责安排你。";
    state.weather.loaded = true;
    setWeatherMood(weatherMood(now.icon, now.text));
  } catch {
    setWeatherMood("unknown");
    state.weather.reading = "天气暂时没有抵达";
    state.weather.hint = "可以先继续今天的事情，晚些时候再看看。";
  }
  renderWeather();
}

function weatherSymbol(icon) {
  const code = String(icon || "");
  if (/^3\d\d/.test(code)) return "☂";
  if (/^4\d\d/.test(code)) return "❄";
  if (/^1\d\d/.test(code) && code !== "100") return "☁";
  return "☼";
}

function renderTasks() {
  const today = todayKey();
  const offset = daysBetween(today, state.selectedDay);
  $("#relativeDay").textContent = offset === 0 ? "今天" : offset === 1 ? "明天" : offset === -1 ? "昨天" : offset > 1 ? `${offset} 天后` : `${Math.abs(offset)} 天前`;
  const formattedDay = formatLong(state.selectedDay);
  $("#dayTitle").textContent = formattedDay ? formattedDay.replace("星期", "周") : state.selectedDay;
  renderQuote();

  const tasks = state.tasks
    .filter((task) => task.day === state.selectedDay && !task.deletedAt)
    .sort((a, b) => Number(a.done) - Number(b.done) || (a.time || "99:99").localeCompare(b.time || "99:99") || a.createdAt - b.createdAt);
  $("#taskList").innerHTML = "";
  tasks.forEach((task) => $("#taskList").append(createTaskNode(task)));
  $("#emptyState").hidden = tasks.length > 0;
  const done = tasks.filter((task) => task.done).length;
  const unfinished = tasks.length - done;
  $("#dayFooter").hidden = unfinished === 0;
  $("#progressText").textContent = tasks.length ? `今天已经完成 ${done} 件，还有 ${tasks.length - done} 件可以慢慢来` : "今天还没有安排";
  $("#progressBar").style.width = tasks.length ? `${done / tasks.length * 100}%` : "0%";
  $("#taskForm button[type='submit']").textContent = offset === 0 ? "放进今天" : offset === 1 ? "放进明天" : "放进这天";
}

function getQuote(day) {
  let choice = 0;
  try {
    const choices = JSON.parse(localStorage.getItem(QUOTE_KEY) || "{}");
    choice = Number.isInteger(choices[day]) ? choices[day] : dateSeed(day) % literaryQuotes.length;
  } catch { choice = dateSeed(day) % literaryQuotes.length; }
  return literaryQuotes[choice % literaryQuotes.length];
}

function renderQuote() {
  const quote = getQuote(state.selectedDay);
  $("#dayWhisper").textContent = quote.text;
  $("#quoteSource").textContent = `——${quote.source}`;
  $("#quoteRefresh").hidden = false;
}

function refreshQuote() {
  try {
    const choices = JSON.parse(localStorage.getItem(QUOTE_KEY) || "{}");
    const current = Number.isInteger(choices[state.selectedDay]) ? choices[state.selectedDay] : dateSeed(state.selectedDay) % literaryQuotes.length;
    choices[state.selectedDay] = (current + 1) % literaryQuotes.length;
    localStorage.setItem(QUOTE_KEY, JSON.stringify(choices));
  } catch { /* localStorage unavailable: keep the deterministic quote */ }
  renderQuote();
}

function createTaskNode(task) {
  const node = $("#taskTemplate").content.firstElementChild.cloneNode(true);
  node.dataset.id = task.id;
  node.classList.toggle("done", task.done);
  node.querySelector(".task-text").textContent = task.text;
  const metaParts = [];
  if (task.time) metaParts.push(`<span class="task-time">${escapeHTML(task.time)}</span>`);
  if (task.carryCount) metaParts.push(`从 ${formatShort(task.originalDay)} 一起走来 · 已继续 ${task.carryCount} 天`);
  else metaParts.push(task.done ? "今天已经做到这里" : "写在这一天");
  node.querySelector(".task-meta").innerHTML = metaParts.join(" · ");
  const check = node.querySelector(".check-button");
  check.setAttribute("aria-label", task.done ? "恢复为未完成" : "标记完成");
  check.addEventListener("click", () => toggleTask(task.id));
  node.querySelector(".edit-button").addEventListener("click", () => editTask(node, task));
  node.querySelector(".delete-button").addEventListener("click", () => deleteTask(task.id));
  node.querySelector(".task-text").addEventListener("dblclick", () => editTask(node, task));
  return node;
}

function editTask(node, task) {
  $("#taskEditId").value = task.id;
  $("#taskEditText").value = task.text;
  $("#taskEditDate").value = task.day;
  $("#taskEditTime").value = task.time || "";
  $("#taskEditDialog").showModal();
}

async function saveTaskEdit(event) {
  event.preventDefault();
  const task = state.tasks.find((item) => item.id === $("#taskEditId").value);
  if (!task) return;
  const newDay = $("#taskEditDate").value;
  const lastHistory = task.history[task.history.length - 1];
  if (newDay !== task.day && lastHistory?.type === "carried" && lastHistory.to === task.day && lastHistory.from === newDay) {
    task.history.pop();
    task.carryCount = Math.max(0, task.carryCount - Math.max(1, daysBetween(newDay, task.day)));
  }
  task.text = $("#taskEditText").value.trim();
  task.day = newDay;
  task.time = $("#taskEditTime").value || null;
  task.updatedAt = Date.now();
  markTaskPending(task);
  saveLocal();
  renderAll();
  $("#taskEditDialog").close();
  await persistTask(task);
  showToast("这件事已经重新安排好");
}

async function addTask(text, time, repeatFrequency) {
  const task = normalizeTask({
    id: crypto.randomUUID(), text, time: time || null, day: state.selectedDay, originalDay: state.selectedDay,
    createdAt: Date.now(), syncPending: true, repeatRule: repeatFrequency ? { frequency: repeatFrequency, weekday: fromKey(state.selectedDay).getDay() } : null,
  });
  state.tasks.push(task);
  saveLocal();
  renderAll();
  await persistTask(task);
}

async function toggleTask(id) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;
  task.done = !task.done;
  task.completedAt = task.done ? new Date().toISOString() : null;
  task.updatedAt = Date.now();
  markTaskPending(task);
  saveLocal();
  renderAll();
  await persistTask(task);
  if (task.done) {
    const dayTasks = state.tasks.filter((item) => item.day === task.day && !item.deletedAt);
    const allDone = dayTasks.length && dayTasks.every((item) => item.done);
    showToast(allDone ? "今天的事情都轻轻收好了，辛苦了。" : completionWords[dateSeed(task.id) % completionWords.length]);
  }
}

async function deleteTask(id) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;
  task.deletedAt = new Date().toISOString();
  task.updatedAt = Date.now();
  markTaskPending(task);
  saveLocal();
  renderAll();
  await persistTask(task);
  showToast("这件事已经移走");
}

async function advanceDay() {
  const from = state.selectedDay;
  const next = shiftDay(from, 1);
  const moved = [];
  const snapshots = [];
  state.tasks.forEach((task) => {
    if (task.day === from && !task.done && !task.deletedAt) {
      snapshots.push({ id: task.id, day: task.day, carryCount: task.carryCount, historyLength: task.history.length });
      task.history.push({ type: "carried", from, to: next, at: new Date().toISOString() });
      task.day = next;
      task.carryCount += 1;
      task.updatedAt = Date.now();
      markTaskPending(task);
      moved.push(task);
    }
  });
  state.selectedDay = next;
  saveLocal();
  localStorage.setItem(CARRY_UNDO_KEY, JSON.stringify({ from, snapshots, createdAt: Date.now() }));
  renderAll();
  await Promise.all(moved.map(persistTask));
  if (!moved.length) return showToast("今天已经轻轻收好");
  showToast(`${moved.length} 件事陪你来到明天`, {
    label: "撤回",
    duration: 10000,
    action: () => undoCarry(snapshots, from),
  });
}

async function undoCarry(snapshots, from) {
  const restored = [];
  snapshots.forEach((snapshot) => {
    const task = state.tasks.find((item) => item.id === snapshot.id);
    if (!task) return;
    task.day = snapshot.day;
    task.carryCount = snapshot.carryCount;
    task.history = task.history.slice(0, snapshot.historyLength);
    task.updatedAt = Date.now();
    markTaskPending(task);
    restored.push(task);
  });
  localStorage.removeItem(CARRY_UNDO_KEY);
  state.selectedDay = from;
  saveLocal();
  renderAll();
  await Promise.all(restored.map(persistTask));
  showToast("已经撤回，事情回到原来的这一天");
}

function offerPendingCarryUndo() {
  try {
    const pending = JSON.parse(localStorage.getItem(CARRY_UNDO_KEY));
    if (!pending || Date.now() - pending.createdAt > 300000) {
      localStorage.removeItem(CARRY_UNDO_KEY);
      return;
    }
    showToast("刚才顺延的事情还可以撤回", { label: "撤回", duration: 10000, action: () => undoCarry(pending.snapshots, pending.from) });
  } catch { localStorage.removeItem(CARRY_UNDO_KEY); }
}

function nextOccurrence(item, referenceKey = todayKey()) {
  if (!item.yearly) return item.date;
  const source = fromKey(item.date);
  const reference = fromKey(referenceKey);
  let next = new Date(reference.getFullYear(), source.getMonth(), source.getDate());
  if (next < reference) next = new Date(reference.getFullYear() + 1, source.getMonth(), source.getDate());
  return toKey(next);
}

function importantTypeLabel(type) {
  return { deadline: "待完成", birthday: "生日", anniversary: "纪念日", other: "重要日子" }[type] || "重要日子";
}

function countdownText(days) {
  if (days < 0) return { number: Math.abs(days), unit: "天前" };
  if (days === 0) return { number: "今", unit: "天" };
  return { number: days, unit: "天后" };
}

function renderImportantDays() {
  const referenceDate = state.selectedDay;
  const visible = state.importantDays
    .filter((item) => !item.deletedAt)
    .map((item) => {
      const occurrence = nextOccurrence(item, referenceDate);
      return { item, occurrence, days: daysBetween(referenceDate, occurrence) };
    })
    .sort((a, b) => a.days - b.days || a.item.createdAt - b.item.createdAt);
  $("#importantDaysList").innerHTML = "";
  visible.forEach(({ item, occurrence, days }) => {
    const node = $("#importantDayTemplate").content.firstElementChild.cloneNode(true);
    const countdown = countdownText(days);
    node.dataset.id = item.id;
    node.classList.toggle("is-near", days >= 0 && days <= item.remindDays);
    node.querySelector(".countdown-number").textContent = countdown.number;
    node.querySelector(".countdown-unit").textContent = countdown.unit;
    node.querySelector(".important-kind").textContent = importantTypeLabel(item.type);
    node.querySelector(".important-name").textContent = item.name;
    node.querySelector(".important-meta").textContent = `${formatLong(occurrence).replace("星期", "周")} · ${item.yearly ? "每年重复" : "仅这一次"} · 提前 ${item.remindDays || 0} 天提醒`;
    node.querySelector(".important-note").textContent = item.note;
    node.querySelector(".important-note").hidden = !item.note;
    node.querySelector(".important-edit").addEventListener("click", () => openImportantDayDialog(item));
    node.querySelector(".important-delete").addEventListener("click", () => deleteImportantDay(item.id));
    $("#importantDaysList").append(node);
  });
  $("#importantDaysEmpty").hidden = visible.length > 0;
}

function openImportantDayDialog(item = null) {
  $("#importantDayForm").reset();
  $("#importantDayId").value = item?.id || "";
  $("#importantName").value = item?.name || "";
  $("#importantDate").value = item?.date || todayKey();
  $("#importantType").value = item?.type || "deadline";
  $("#importantRemindDays").value = String(item?.remindDays ?? 3);
  $("#importantYearly").checked = Boolean(item?.yearly);
  $("#importantNote").value = item?.note || "";
  $("#importantDialogTitle").textContent = item ? "修改这个重要日子" : "记下一个重要日子";
  $("#importantSubmit").textContent = item ? "保存修改" : "保存这个日子";
  $("#importantDayDialog").showModal();
}

async function saveImportantDay(event) {
  event.preventDefault();
  const id = $("#importantDayId").value;
  const existing = state.importantDays.find((item) => item.id === id);
  const item = normalizeImportantDay({
    ...(existing || {}),
    id: id || crypto.randomUUID(),
    name: $("#importantName").value.trim(),
    date: $("#importantDate").value,
    type: $("#importantType").value,
    remindDays: Number($("#importantRemindDays").value),
    yearly: $("#importantYearly").checked,
    note: $("#importantNote").value.trim(),
    updatedAt: Date.now(),
  });
  if (!item.name || !item.date) return;
  if (existing) Object.assign(existing, item);
  else state.importantDays.push(item);
  saveImportantDays();
  renderAll();
  $("#importantDayDialog").close();
  await persistImportantDay(item);
  showToast(existing ? "这个日子已经更新" : "这个日子已经记下");
}

async function deleteImportantDay(id) {
  const item = state.importantDays.find((entry) => entry.id === id);
  if (!item || !confirm(`确定移走“${item.name}”吗？`)) return;
  item.deletedAt = new Date().toISOString();
  item.updatedAt = Date.now();
  saveImportantDays();
  renderAll();
  await persistImportantDay(item);
  showToast("这个日子已经移走");
}

function getActiveReminders() {
  const today = todayKey();
  const referenceDate = state.selectedDay;
  const taskReminders = state.tasks
    .filter((task) => !task.done && !task.deletedAt && task.day === today && task.time && task.time <= nowTime())
    .map((task) => ({ id: `task-${task.id}-${today}`, html: `<strong>${escapeHTML(task.time)}</strong> · ${escapeHTML(task.text)}`, toast: `${task.time} 了，可以看看“${task.text}”` }));
  const dayReminders = state.importantDays
    .filter((item) => !item.deletedAt)
    .map((item) => ({ item, occurrence: nextOccurrence(item, referenceDate) }))
    .map(({ item, occurrence }) => ({ item, occurrence, days: daysBetween(referenceDate, occurrence) }))
    .filter(({ item, days }) => days >= 0 && days <= item.remindDays)
    .map(({ item, occurrence, days }) => ({
      id: `day-${item.id}-${occurrence}`,
      html: days === 0 ? `<strong>今天</strong> · ${escapeHTML(item.name)}` : `<strong>还有 ${days} 天</strong> · ${escapeHTML(item.name)}`,
      toast: days === 0 ? `今天是“${item.name}”` : `“${item.name}”还有 ${days} 天`,
    }));
  return [...taskReminders, ...dayReminders];
}

function renderReminders() {
  const reminders = getActiveReminders();
  $("#gentleReminders").hidden = reminders.length === 0;
  $("#reminderList").innerHTML = reminders.map((item) => `<p>${item.html}</p>`).join("");
}

function checkReminders() {
  renderReminders();
  const unseen = getActiveReminders().find((item) => !state.reminderSeen.has(item.id));
  if (!unseen) return;
  state.reminderSeen.add(unseen.id);
  if (document.hidden && "Notification" in window && Notification.permission === "granted") {
    try { new Notification("明日复明日", { body: unseen.toast, tag: unseen.id }); } catch { /* browser notification unavailable */ }
  }
  showToast(unseen.toast, { duration: 5000, passive: true });
}

function updateSettingsUI() {
  const permission = "Notification" in window ? Notification.permission : "unsupported";
  $("#notificationState").textContent = permission === "granted" ? "已经允许，打开网站时会按设置提醒" : permission === "denied" ? "已被浏览器拒绝，可在浏览器设置中恢复" : "尚未开启";
  $("#enableNotifications").textContent = permission === "granted" ? "已允许" : "允许提醒";
  $("#enableNotifications").disabled = permission === "granted" || permission === "unsupported";
  $("#reduceMotionToggle").checked = document.documentElement.classList.contains("reduce-motion");
}

async function requestNotifications() {
  if (!state.user) return showToast("登录后才能把提醒送到你的设备");
  if (!config.pushPublicKey) return showToast("推送服务还没有配置完成");
  if (!("Notification" in window)) return showToast("这个浏览器暂不支持系统提醒");
  const permission = await Notification.requestPermission();
  if (permission === "granted") await syncPushSubscription(true);
  updateSettingsUI();
  showToast(permission === "granted" ? "提醒权限已经打开" : "可以继续使用站内提醒");
}

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

async function syncPushSubscription(requested = false) {
  const supported = Boolean(state.user && config.pushPublicKey && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window);
  state.push.supported = supported;
  if (!supported || Notification.permission !== "granted") return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription && requested) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(config.pushPublicKey) });
    if (!subscription || !state.supabase) return false;
    const { error } = await state.supabase.from("push_subscriptions").upsert({ user_id: state.user.id, endpoint: subscription.endpoint, subscription: subscription.toJSON(), last_used_at: new Date().toISOString() }, { onConflict: "endpoint" });
    if (error) throw error;
    state.push.subscribed = true;
    return true;
  } catch (error) {
    console.warn("Push subscription unavailable", error);
    state.push.subscribed = false;
    return false;
  }
}

function applyReduceMotion(enabled) {
  document.documentElement.classList.toggle("reduce-motion", enabled);
  $("#reduceMotionToggle").checked = enabled;
}

async function persistTask(task) {
  if (!state.cloudReady) return false;
  const userId = state.user.id;
  const revision = Number(task.updatedAt);
  const row = {
    id: task.id,
    user_id: userId,
    text: task.text,
    scheduled_day: task.day,
    remind_time: task.time || null,
    original_day: task.originalDay,
    completed_at: task.completedAt,
    carry_count: task.carryCount,
    history: task.history,
    repeat_rule: task.repeatRule,
    recurrence_id: task.recurrenceId,
    deleted_at: task.deletedAt || null,
    created_at: new Date(task.createdAt).toISOString(),
    updated_at: new Date(task.updatedAt).toISOString(),
  };
  return taskSyncQueue.enqueue(task.id, async () => {
    if (!state.cloudReady || state.user?.id !== userId) return false;
    let { error } = await state.supabase.from("tasks").upsert(row);
    if (error && /remind_time|repeat_rule|recurrence_id|schema cache/i.test(error.message)) {
      const { remind_time, repeat_rule, recurrence_id, ...legacyRow } = row;
      ({ error } = await state.supabase.from("tasks").upsert(legacyRow));
    }
    if (error) {
      console.error(error);
      updateAccountUI();
      showToast("云端同步稍后会自动重试");
      return false;
    }
    const current = state.tasks.find((item) => item.id === task.id);
    if (current && markTaskSynced(current, userId, revision)) saveLocal();
    return true;
  }).catch((error) => {
    console.error(error);
    updateAccountUI();
    showToast("云端同步稍后会自动重试");
    return false;
  });
}

async function loadCloudTasks() {
  const localById = new Map(state.tasks.map((task) => [task.id, task]));
  const { data, error } = await state.supabase.from("tasks").select("*").is("deleted_at", null).order("created_at");
  if (error) { showToast("暂时无法读取云端任务"); return; }
  const cloudTasks = data.map((row) => normalizeTask({
    id: row.id,
    text: row.text,
    day: row.scheduled_day,
    time: row.remind_time?.slice(0, 5) || localById.get(row.id)?.time || null,
    originalDay: row.original_day,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    completedAt: row.completed_at,
    done: Boolean(row.completed_at),
    carryCount: row.carry_count,
    history: row.history || [],
    repeatRule: row.repeat_rule,
    recurrenceId: row.recurrence_id,
    syncedUserId: state.user.id,
  }));
  state.tasks = mergeTaskRecords(state.tasks, cloudTasks, state.user.id).map(normalizeTask);
  saveLocal();
  renderAll();
  await flushPendingTaskSync();
}

async function importLocalTasks() {
  state.tasks = loadLocalTasks();
  await flushPendingTaskSync();
}

let pendingTaskFlush = null;
async function flushPendingTaskSync() {
  if (!state.cloudReady || pendingTaskFlush) return pendingTaskFlush || false;
  const pending = state.tasks.filter((task) => needsTaskSync(task, state.user.id));
  if (!pending.length) {
    updateAccountUI();
    return true;
  }
  pendingTaskFlush = Promise.all(pending.map(persistTask)).then((results) => results.every(Boolean));
  try {
    return await pendingTaskFlush;
  } finally {
    pendingTaskFlush = null;
    updateAccountUI();
  }
}

async function persistImportantDay(item) {
  if (!state.cloudReady) return false;
  const row = {
    id: item.id,
    user_id: state.user.id,
    name: item.name,
    event_date: item.date,
    event_type: item.type,
    remind_days: item.remindDays,
    repeats_yearly: item.yearly,
    note: item.note || null,
    deleted_at: item.deletedAt || null,
    created_at: new Date(item.createdAt).toISOString(),
    updated_at: new Date(item.updatedAt).toISOString(),
  };
  const { error } = await state.supabase.from("important_days").upsert(row);
  if (error) { console.error(error); showToast("重要日子已保存在本机，运行数据库升级后即可同步"); return false; }
  item.syncedUserId = state.user.id;
  saveImportantDays();
  return true;
}

async function loadCloudImportantDays() {
  const { data, error } = await state.supabase.from("important_days").select("*").is("deleted_at", null).order("event_date");
  if (error) return;
  state.importantDays = data.map((row) => normalizeImportantDay({
    id: row.id,
    name: row.name,
    date: row.event_date,
    type: row.event_type,
    remindDays: row.remind_days,
    yearly: row.repeats_yearly,
    note: row.note,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    syncedUserId: state.user.id,
  }));
  saveImportantDays();
  renderAll();
}

async function importLocalImportantDays() {
  const pending = loadImportantDays().filter((item) => item.syncedUserId !== state.user.id);
  for (const item of pending) await persistImportantDay(item);
}

function updateAccountUI() {
  const signed = Boolean(state.user);
  const pending = signed && state.tasks.some((task) => needsTaskSync(task, state.user.id));
  $("#accountButton").classList.toggle("signed-in", signed);
  $("#accountLabel").textContent = signed ? (state.user.email?.split("@")[0] || "我的账号") : "登录";
  $("#syncNote").classList.toggle("synced", signed && !pending);
  $("#syncText").textContent = !signed ? "任务只保存在这台设备" : pending ? "本机已保存，正在等待云端同步" : "已经保存到你的账号";
  $("#syncAction").textContent = !signed ? "登录后同步" : pending ? "立即重试" : "已同步";
  $("#accountSyncState").textContent = !signed ? "登录后可同步" : pending ? "有任务等待同步" : "所有任务已安全同步";
  $("#feedbackHint").textContent = signed ? "反馈不会附带你的待办内容。" : "登录后可以发送反馈。";
  if (state.user?.app_metadata?.role === "developer" && !$("[data-view-link='feedback-admin']")) {
    const button = document.createElement("button");
    button.className = "nav-link";
    button.dataset.viewLink = "feedback-admin";
    button.textContent = "查看反馈";
    button.addEventListener("click", () => switchView("feedback-admin"));
    $(".main-nav").append(button);
  }
}

function clearAuthErrors() {
  ["#authEmail", "#authPassword"].forEach((selector) => $(selector).classList.remove("invalid"));
  ["#authEmailError", "#authPasswordError"].forEach((selector) => { $(selector).textContent = ""; $(selector).classList.remove("visible"); });
  $("#authError").textContent = "";
}

function showFieldError(field, message) {
  $(`#auth${field}`).classList.add("invalid");
  const error = $(`#auth${field}Error`);
  error.textContent = message;
  error.classList.add("visible");
}

async function handleAuth(event) {
  event.preventDefault();
  clearAuthErrors();
  if (!state.supabase) { $("#authError").textContent = "暂时无法连接账号服务，请稍后再试。"; return; }
  const email = $("#authEmail").value.trim();
  const password = $("#authPassword").value;
  let invalid = false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showFieldError("Email", "请检查邮箱格式。"); invalid = true; }
  if (password.length < 8) { showFieldError("Password", "密码至少需要 8 位。"); invalid = true; }
  if (invalid) return;
  const button = $("#authSubmit");
  const original = button.textContent;
  button.disabled = true;
  button.textContent = state.authMode === "register" ? "正在创建……" : "正在登录……";
  try {
    const result = state.authMode === "register"
      ? await state.supabase.auth.signUp({ email, password })
      : await state.supabase.auth.signInWithPassword({ email, password });
    if (result.error) {
      const translated = translateAuthError(result.error.message);
      if (translated.field) showFieldError(translated.field, translated.message);
      else $("#authError").textContent = translated.message;
      return;
    }
    if (state.authMode === "register" && !result.data.session) {
      $("#authError").textContent = "账号已创建，请按页面提示完成下一步。";
      return;
    }
    $("#authDialog").close();
    showToast(state.authMode === "register" ? "账号创建好了" : "欢迎回来");
  } catch {
    $("#authError").textContent = "网络没有连上，请检查网络后再试。";
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

function translateAuthError(message = "") {
  if (/Invalid login|invalid credentials/i.test(message)) return { field: null, message: "邮箱或密码不正确。" };
  if (/already registered|already been registered|user already exists/i.test(message)) return { field: "Email", message: "这个邮箱已经注册，可以直接登录。" };
  if (/email.*invalid|invalid.*email/i.test(message)) return { field: "Email", message: "请检查邮箱格式。" };
  if (/password/i.test(message)) return { field: "Password", message: "密码至少需要 8 位。" };
  if (/rate limit|too many/i.test(message)) return { field: null, message: "尝试次数有点多，请稍后再试。" };
  return { field: null, message: "暂时没有成功，请稍后再试。" };
}

async function resetPassword() {
  clearAuthErrors();
  const email = $("#authEmail").value.trim();
  if (!email) { showFieldError("Email", "先填写注册邮箱。"); return; }
  if (!state.supabase) { $("#authError").textContent = "暂时无法连接账号服务。"; return; }
  const { error } = await state.supabase.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
  $("#authError").textContent = error ? "重置邮件暂时没有发出，请稍后再试。" : "重置邮件已经发出，请检查邮箱。";
}

async function submitFeedback(event) {
  event.preventDefault();
  if (!state.user) { openAuth(); showToast("登录后就可以把反馈送过来"); return; }
  const form = event.currentTarget;
  const message = $("#feedbackMessage").value.trim();
  const last = JSON.parse(localStorage.getItem(FEEDBACK_GUARD_KEY) || "null");
  if (last?.message === message && Date.now() - last.at < 60000) {
    showToast("这条反馈已经收到，不用重复发送");
    return;
  }
  const button = form.querySelector("button[type='submit']");
  button.disabled = true;
  button.textContent = "正在送达……";
  const row = {
    user_id: state.user.id,
    type: new FormData(form).get("feedbackType"),
    message,
    contact_email: $("#feedbackEmail").value.trim() || null,
    page_url: location.href,
    app_version: "2.1.0",
  };
  try {
    const { error } = await state.supabase.from("feedback").insert(row);
    if (error) throw error;
    localStorage.setItem(FEEDBACK_GUARD_KEY, JSON.stringify({ message, at: Date.now() }));
    form.reset();
    $("#feedbackHint").textContent = "已经收到，谢谢你愿意告诉我们。";
    showToast("已经收到，谢谢你愿意告诉我们");
  } catch {
    $("#feedbackHint").textContent = "反馈没有送达，你写的内容还在，可以稍后再试。";
    showToast("反馈没有送达，请稍后再试");
  } finally {
    button.disabled = false;
    button.textContent = "把反馈送给开发者";
  }
}

async function loadFeedback() {
  if (state.user?.app_metadata?.role !== "developer") return;
  const { data } = await state.supabase.from("feedback").select("*").order("created_at", { ascending: false });
  $("#feedbackList").innerHTML = (data || []).map((feedback) => `<article class="feedback-card"><small>${escapeHTML(feedback.type)} · ${new Date(feedback.created_at).toLocaleString("zh-CN")}</small><p>${escapeHTML(feedback.message)}</p>${feedback.contact_email ? `<small>${escapeHTML(feedback.contact_email)}</small>` : ""}</article>`).join("") || "<p>暂时还没有反馈。</p>";
}

function escapeHTML(value) { const div = document.createElement("div"); div.textContent = value || ""; return div.innerHTML; }

function switchView(name) {
  $$(".view").forEach((view) => view.classList.toggle("active", view.dataset.view === name));
  $$('[data-view-link]').forEach((button) => button.classList.toggle("active", button.dataset.viewLink === name));
  if (name === "feedback-admin") loadFeedback();
  if (name === "growth") void loadDailyInsightForSelectedDay();
  location.hash = name;
}

function openAuth() { state.authMode = "login"; updateAuthMode(); clearAuthErrors(); $("#authDialog").showModal(); }
function updateAuthMode() {
  const register = state.authMode === "register";
  clearAuthErrors();
  $("#authTitle").textContent = register ? "从今天开始" : "欢迎回来";
  $("#authSubtitle").textContent = register ? "创建账号后，这台设备上的任务也会一起保存。" : "登录后，任务会在你的设备之间同步。";
  $("#authSubmit").textContent = register ? "创建账号" : "登录";
  $("#authModeSwitch").textContent = register ? "已经有账号？登录" : "还没有账号？注册";
  $("#authPassword").autocomplete = register ? "new-password" : "current-password";
}

function exportData() {
  const data = { tasks: state.tasks.filter((task) => !task.deletedAt), importantDays: state.importantDays.filter((item) => !item.deletedAt) };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `明日复明日-${todayKey()}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function requestDeletion() {
  if (!confirm("提交后，开发者会删除你的账号和关联数据。确定继续吗？")) return;
  const { error } = await state.supabase.from("account_deletion_requests").insert({ user_id: state.user.id, email: state.user.email });
  if (error) { showToast("申请没有提交成功"); return; }
  await state.supabase.auth.signOut();
  $("#accountDialog").close();
  showToast("删除申请已经收到");
}

function bindEvents() {
  $("#taskForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = $("#taskInput");
    const text = input.value.trim();
    if (!text) return;
    addTask(text, $("#taskTime").value, $("#taskRepeat").value);
    input.value = "";
    $("#taskTime").value = "";
    $("#taskRepeat").value = "";
    renderTaskOptionsSummary();
    input.focus();
  });
  $("#taskTime").addEventListener("input", renderTaskOptionsSummary);
  $("#taskRepeat").addEventListener("change", renderTaskOptionsSummary);
  renderTaskOptionsSummary();
  $("#prevDay").addEventListener("click", () => { state.selectedDay = shiftDay(state.selectedDay, -1); renderAll(); });
  $("#nextDay").addEventListener("click", () => { state.selectedDay = shiftDay(state.selectedDay, 1); renderAll(); });
  $("#todayButton").addEventListener("click", () => { state.selectedDay = todayKey(); renderAll(); });
  $("#advanceDay").addEventListener("click", advanceDay);
  $$('[data-view-link]').forEach((button) => button.addEventListener("click", (event) => { event.preventDefault(); switchView(button.dataset.viewLink); }));
  $("#openImportantDay").addEventListener("click", () => openImportantDayDialog());
  $("#openMemory").addEventListener("click", () => openMemoryDialog());
  $("#importantDayForm").addEventListener("submit", saveImportantDay);
  $("#memoryForm").addEventListener("submit", saveMemory);
  $("#rememberCandidate").addEventListener("click", rememberMemoryCandidate);
  $("#editCandidate").addEventListener("click", editMemoryCandidate);
  $("#dismissCandidate").addEventListener("click", dismissMemoryCandidate);
  $("#taskEditForm").addEventListener("submit", saveTaskEdit);
  $("#importantType").addEventListener("change", (event) => { if (["birthday", "anniversary"].includes(event.target.value)) $("#importantYearly").checked = true; });
  $("#accountButton").addEventListener("click", () => { if (state.user) { $("#accountEmail").textContent = state.user.email; $("#accountDialog").showModal(); } else openAuth(); });
  $("#syncAction").addEventListener("click", () => { if (!state.user) openAuth(); else void flushPendingTaskSync(); });
  $$('[data-close-dialog]').forEach((button) => button.addEventListener("click", () => $("#" + button.dataset.closeDialog).close()));
  $("#authForm").addEventListener("submit", handleAuth);
  ["#authEmail", "#authPassword"].forEach((selector) => $(selector).addEventListener("input", clearAuthErrors));
  $("#authModeSwitch").addEventListener("click", () => { state.authMode = state.authMode === "login" ? "register" : "login"; updateAuthMode(); });
  $("#resetPassword").addEventListener("click", resetPassword);
  $("#feedbackForm").addEventListener("submit", submitFeedback);
  $("#signOut").addEventListener("click", async () => { await state.supabase.auth.signOut(); $("#accountDialog").close(); showToast("已经安全退出"); });
  $("#exportData").addEventListener("click", exportData);
  $("#openPrivacy").addEventListener("click", () => { $("#accountDialog").close(); $("#privacyDialog").showModal(); });
  $("#openSettings").addEventListener("click", () => { $("#accountDialog").close(); updateSettingsUI(); $("#settingsDialog").showModal(); });
  $("#enableNotifications").addEventListener("click", requestNotifications);
  $("#reduceMotionToggle").addEventListener("change", (event) => { const enabled = event.target.checked; localStorage.setItem(REDUCE_MOTION_KEY, enabled ? "1" : "0"); applyReduceMotion(enabled); });
  $("#quoteRefresh").addEventListener("click", refreshQuote);
  $("#saveMood").addEventListener("click", saveMood);
  $("#reviewForm").addEventListener("submit", saveReview);
  $("#aiInsightAction").addEventListener("click", () => requestDailyInsight(Boolean(insightForDay(state.selectedDay))));
  $("#weatherForm").addEventListener("submit", (event) => { event.preventDefault(); loadWeather($("#weatherCity").value); });
  $("#requestDeletion").addEventListener("click", requestDeletion);
  window.addEventListener("online", () => { void flushPendingTaskSync(); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) void flushPendingTaskSync(); });
  $("#toastAction").addEventListener("click", async () => {
    const action = state.toastAction;
    if (!action) return;
    clearTimeout(toastTimer);
    toastHasAction = false;
    state.toastAction = null;
    $("#toast").classList.remove("show");
    await action();
  });
}

let toastTimer;
let toastHasAction = false;
function showToast(message, options = {}) {
  if (options.passive && toastHasAction) return;
  const toast = $("#toast");
  const actionButton = $("#toastAction");
  toastHasAction = Boolean(options.action);
  state.toastAction = options.action || null;
  $("#toastMessage").textContent = message;
  actionButton.hidden = !options.action;
  actionButton.textContent = options.label || "";
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastHasAction = false; state.toastAction = null; toast.classList.remove("show"); }, options.duration || 3000);
}

init();
