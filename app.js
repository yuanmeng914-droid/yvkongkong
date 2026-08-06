const STORAGE_KEY = "mingri-tasks-v2";
const LEGACY_KEY = "xuri-tasks-v1";
const IMPORTANT_KEY = "mingri-important-days-v1";
const FEEDBACK_GUARD_KEY = "mingri-last-feedback-v1";
const CARRY_UNDO_KEY = "mingri-last-carry-v1";
const QUOTE_KEY = "mingri-quote-choice-v1";
const WEATHER_CITY_KEY = "mingri-weather-city-v1";
const REDUCE_MOTION_KEY = "mingri-reduce-motion-v1";
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const config = window.APP_CONFIG || {};

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
  selectedDay: todayKey(),
  user: null,
  supabase: null,
  authMode: "login",
  cloudReady: false,
  reminderSeen: new Set(),
  toastAction: null,
  weather: { city: localStorage.getItem(WEATHER_CITY_KEY) || "", reading: "", hint: "天气只负责路过，不负责安排你。", symbol: "☼", loaded: false },
};

async function init() {
  rolloverToToday();
  bindEvents();
  renderAll();
  applyReduceMotion(localStorage.getItem(REDUCE_MOTION_KEY) === "1");
  registerServiceWorker();
  offerPendingCarryUndo();
  const initialView = location.hash.slice(1);
  if (["today", "important-days", "feedback"].includes(initialView)) switchView(initialView);
  if (config.supabaseUrl && config.supabasePublishableKey) await initCloud();
  if (state.weather.city && config.weatherEndpoint) await loadWeather(state.weather.city);
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
  updateAccountUI();
  if (state.user) {
    await importLocalTasks();
    await loadCloudTasks();
    await importLocalImportantDays();
    await loadCloudImportantDays();
  } else {
    state.tasks = loadLocalTasks();
    state.importantDays = loadImportantDays();
    renderAll();
  }
}

function todayKey() { return toKey(new Date()); }
function toKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function fromKey(key) { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d); }
function shiftDay(key, amount) { const date = fromKey(key); date.setDate(date.getDate() + amount); return toKey(date); }
function daysBetween(a, b) { return Math.round((fromKey(b) - fromKey(a)) / 86400000); }
function formatLong(key) { return new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(fromKey(key)); }
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

function saveLocal() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks)); }
function saveImportantDays() { localStorage.setItem(IMPORTANT_KEY, JSON.stringify(state.importantDays)); }

function rolloverToToday() {
  const today = todayKey();
  let changed = false;
  state.tasks.forEach((task) => {
    if (!task.done && !task.deletedAt && task.day < today) {
      const from = task.day;
      task.history.push({ type: "carried", from, to: today, at: new Date().toISOString() });
      task.carryCount += Math.max(1, daysBetween(from, today));
      task.day = today;
      task.updatedAt = Date.now();
      changed = true;
    }
  });
  if (changed) saveLocal();
}

function renderAll() {
  renderTasks();
  renderImportantDays();
  renderReminders();
  renderWeather();
}

function renderWeather() {
  $("#weatherCity").value = state.weather.city;
  $("#weatherReading").textContent = state.weather.reading || (state.weather.city ? "正在等天气抵达" : "还没有选择城市");
  $("#weatherHint").textContent = state.weather.hint;
  $("#weatherSymbol").textContent = state.weather.symbol;
}

async function loadWeather(city) {
  const cleanCity = city.trim();
  if (!cleanCity) {
    state.weather = { city: "", reading: "", hint: "天气只负责路过，不负责安排你。", symbol: "☼", loaded: false };
    localStorage.removeItem(WEATHER_CITY_KEY);
    renderWeather();
    return;
  }
  state.weather.city = cleanCity;
  localStorage.setItem(WEATHER_CITY_KEY, cleanCity);
  state.weather.reading = "正在等天气抵达";
  renderWeather();
  if (!config.weatherEndpoint) {
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
  } catch {
    state.weather.reading = "天气暂时没有抵达";
    state.weather.hint = "可以先继续今天的事情，晚些时候再看看。";
  }
  renderWeather();
}

function weatherSymbol(icon) {
  const code = String(icon || "");
  if (/rain|3[0-9]|4[0-9]/i.test(code)) return "☂";
  if (/cloud|1[01]/i.test(code)) return "☁";
  if (/snow|5[0-9]/i.test(code)) return "❄";
  return "☼";
}

function renderTasks() {
  const today = todayKey();
  const offset = daysBetween(today, state.selectedDay);
  $("#relativeDay").textContent = offset === 0 ? "今天" : offset === 1 ? "明天" : offset === -1 ? "昨天" : offset > 1 ? `${offset} 天后` : `${Math.abs(offset)} 天前`;
  $("#dayTitle").textContent = formatLong(state.selectedDay).replace("星期", "周");
  const quote = getQuote(state.selectedDay);
  $("#dayWhisper").textContent = offset < 0 ? "已经走过的日子，也值得轻轻回看。" : offset > 0 ? "先放在这里，到时候再慢慢做。" : quote.text;
  $("#quoteSource").textContent = offset === 0 ? `——${quote.source}` : "";
  $("#quoteRefresh").hidden = offset !== 0;

  const tasks = state.tasks
    .filter((task) => task.day === state.selectedDay && !task.deletedAt)
    .sort((a, b) => Number(a.done) - Number(b.done) || (a.time || "99:99").localeCompare(b.time || "99:99") || a.createdAt - b.createdAt);
  $("#taskList").innerHTML = "";
  tasks.forEach((task) => $("#taskList").append(createTaskNode(task)));
  $("#emptyState").hidden = tasks.length > 0;
  const done = tasks.filter((task) => task.done).length;
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

function refreshQuote() {
  try {
    const choices = JSON.parse(localStorage.getItem(QUOTE_KEY) || "{}");
    const current = Number.isInteger(choices[state.selectedDay]) ? choices[state.selectedDay] : dateSeed(state.selectedDay) % literaryQuotes.length;
    choices[state.selectedDay] = (current + 1) % literaryQuotes.length;
    localStorage.setItem(QUOTE_KEY, JSON.stringify(choices));
  } catch { /* localStorage unavailable: keep the deterministic quote */ }
  renderTasks();
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
  saveLocal();
  renderAll();
  $("#taskEditDialog").close();
  await persistTask(task);
  showToast("这件事已经重新安排好");
}

async function addTask(text, time) {
  const task = normalizeTask({ id: crypto.randomUUID(), text, time: time || null, day: state.selectedDay, originalDay: state.selectedDay, createdAt: Date.now() });
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
  if (!("Notification" in window)) return showToast("这个浏览器暂不支持系统提醒");
  const permission = await Notification.requestPermission();
  updateSettingsUI();
  showToast(permission === "granted" ? "提醒权限已经打开" : "可以继续使用站内提醒");
}

function applyReduceMotion(enabled) {
  document.documentElement.classList.toggle("reduce-motion", enabled);
  $("#reduceMotionToggle").checked = enabled;
}

async function persistTask(task) {
  if (!state.cloudReady) return false;
  const row = {
    id: task.id,
    user_id: state.user.id,
    text: task.text,
    scheduled_day: task.day,
    remind_time: task.time || null,
    original_day: task.originalDay,
    completed_at: task.completedAt,
    carry_count: task.carryCount,
    history: task.history,
    deleted_at: task.deletedAt || null,
    created_at: new Date(task.createdAt).toISOString(),
    updated_at: new Date(task.updatedAt).toISOString(),
  };
  let { error } = await state.supabase.from("tasks").upsert(row);
  if (error && /remind_time|schema cache/i.test(error.message)) {
    const { remind_time, ...legacyRow } = row;
    ({ error } = await state.supabase.from("tasks").upsert(legacyRow));
  }
  if (error) { console.error(error); showToast("云端同步稍后会重试"); return false; }
  task.syncedUserId = state.user.id;
  saveLocal();
  return true;
}

async function loadCloudTasks() {
  const localById = new Map(state.tasks.map((task) => [task.id, task]));
  const { data, error } = await state.supabase.from("tasks").select("*").is("deleted_at", null).order("created_at");
  if (error) { showToast("暂时无法读取云端任务"); return; }
  state.tasks = data.map((row) => normalizeTask({
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
    syncedUserId: state.user.id,
  }));
  saveLocal();
  renderAll();
}

async function importLocalTasks() {
  const pending = loadLocalTasks().filter((task) => task.syncedUserId !== state.user.id);
  for (const task of pending) await persistTask(task);
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
  $("#accountButton").classList.toggle("signed-in", signed);
  $("#accountLabel").textContent = signed ? (state.user.email?.split("@")[0] || "我的账号") : "登录";
  $("#syncNote").classList.toggle("synced", signed);
  $("#syncText").textContent = signed ? "已经保存到你的账号" : "任务只保存在这台设备";
  $("#syncAction").textContent = signed ? "已同步" : "登录后同步";
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
    addTask(text, $("#taskTime").value);
    input.value = "";
    $("#taskTime").value = "";
    input.focus();
  });
  $("#prevDay").addEventListener("click", () => { state.selectedDay = shiftDay(state.selectedDay, -1); renderAll(); });
  $("#nextDay").addEventListener("click", () => { state.selectedDay = shiftDay(state.selectedDay, 1); renderAll(); });
  $("#todayButton").addEventListener("click", () => { state.selectedDay = todayKey(); renderAll(); });
  $("#advanceDay").addEventListener("click", advanceDay);
  $$('[data-view-link]').forEach((button) => button.addEventListener("click", (event) => { event.preventDefault(); switchView(button.dataset.viewLink); }));
  $("#openImportantDay").addEventListener("click", () => openImportantDayDialog());
  $("#importantDayForm").addEventListener("submit", saveImportantDay);
  $("#taskEditForm").addEventListener("submit", saveTaskEdit);
  $("#importantType").addEventListener("change", (event) => { if (["birthday", "anniversary"].includes(event.target.value)) $("#importantYearly").checked = true; });
  $("#accountButton").addEventListener("click", () => { if (state.user) { $("#accountEmail").textContent = state.user.email; $("#accountDialog").showModal(); } else openAuth(); });
  $("#syncAction").addEventListener("click", () => { if (!state.user) openAuth(); });
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
  $("#weatherForm").addEventListener("submit", (event) => { event.preventDefault(); loadWeather($("#weatherCity").value); });
  $("#requestDeletion").addEventListener("click", requestDeletion);
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
