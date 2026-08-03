const STORAGE_KEY = "xuri-tasks-v1";
const $ = (selector) => document.querySelector(selector);
const state = { tasks: loadTasks(), selectedDay: todayKey() };

function todayKey() {
  const d = new Date();
  return toKey(d);
}

function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fromKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function shiftDay(key, amount) {
  const date = fromKey(key);
  date.setDate(date.getDate() + amount);
  return toKey(date);
}

function loadTasks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function rolloverToToday() {
  const today = todayKey();
  let changed = false;
  state.tasks.forEach((task) => {
    if (!task.done && task.day < today) {
      task.carriedFrom ||= task.day;
      task.carryCount = (task.carryCount || 0) + daysBetween(task.day, today);
      task.day = today;
      changed = true;
    }
  });
  if (changed) saveTasks();
}

function daysBetween(a, b) {
  return Math.max(1, Math.round((fromKey(b) - fromKey(a)) / 86400000));
}

function formatLong(key) {
  return new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(fromKey(key));
}

function formatShort(key) {
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(fromKey(key));
}

function render() {
  const today = todayKey();
  const dayOffset = Math.round((fromKey(state.selectedDay) - fromKey(today)) / 86400000);
  $("#relativeDay").textContent = dayOffset === 0 ? "今天" : dayOffset === 1 ? "明天" : dayOffset === -1 ? "昨天" : dayOffset > 1 ? `${dayOffset} 天后` : `${Math.abs(dayOffset)} 天前`;
  $("#dayTitle").textContent = formatLong(state.selectedDay).replace("星期", "周");
  $("#dateContext").textContent = `${fromKey(today).getFullYear()} · 第 ${weekNumber(fromKey(today))} 周`;

  const tasks = state.tasks.filter((task) => task.day === state.selectedDay).sort((a, b) => Number(a.done) - Number(b.done) || a.createdAt - b.createdAt);
  const list = $("#taskList");
  list.innerHTML = "";
  tasks.forEach((task) => list.append(createTaskNode(task)));
  $("#emptyState").hidden = tasks.length > 0;

  const completed = tasks.filter((task) => task.done).length;
  $("#progressText").textContent = tasks.length ? `完成 ${completed} / ${tasks.length}` : "还没有任务";
  $("#progressBar").style.width = tasks.length ? `${completed / tasks.length * 100}%` : "0%";
  $("#taskForm").querySelector("button").textContent = dayOffset === 0 ? "加入今天" : dayOffset === 1 ? "加入明天" : "加入这天";
}

function createTaskNode(task) {
  const node = $("#taskTemplate").content.firstElementChild.cloneNode(true);
  node.dataset.id = task.id;
  node.classList.toggle("done", task.done);
  node.querySelector(".task-text").textContent = task.text;
  const meta = node.querySelector(".task-meta");
  if (task.carriedFrom) meta.textContent = `↗ 从 ${formatShort(task.carriedFrom)} 顺延 · 已继续 ${task.carryCount} 天`;
  else if (task.done) meta.textContent = "已完成";
  else meta.textContent = "今天加入";
  node.querySelector(".check-button").setAttribute("aria-label", task.done ? "恢复为未完成" : "标记完成");
  node.querySelector(".check-button").addEventListener("click", () => toggleTask(task.id));
  node.querySelector(".delete-button").addEventListener("click", () => deleteTask(task.id));
  return node;
}

function addTask(text) {
  state.tasks.push({ id: crypto.randomUUID(), text, day: state.selectedDay, createdAt: Date.now(), done: false, carryCount: 0, carriedFrom: null });
  saveTasks();
  render();
}

function toggleTask(id) {
  const task = state.tasks.find((item) => item.id === id);
  task.done = !task.done;
  task.completedAt = task.done ? Date.now() : null;
  saveTasks();
  render();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter((item) => item.id !== id);
  saveTasks();
  render();
  showToast("任务已删除");
}

function advanceDay() {
  const next = shiftDay(state.selectedDay, 1);
  let moved = 0;
  state.tasks.forEach((task) => {
    if (task.day === state.selectedDay && !task.done) {
      task.carriedFrom ||= task.day;
      task.day = next;
      task.carryCount = (task.carryCount || 0) + 1;
      moved++;
    }
  });
  state.selectedDay = next;
  saveTasks();
  render();
  showToast(moved ? `${moved} 件未完成已带到下一天` : "这一天已经收好");
}

function weekNumber(date) {
  const first = new Date(date.getFullYear(), 0, 1);
  return Math.ceil((((date - first) / 86400000) + first.getDay() + 1) / 7);
}

let toastTimer;
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

$("#taskForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("#taskInput");
  const text = input.value.trim();
  if (!text) return;
  addTask(text);
  input.value = "";
  input.focus();
});
$("#prevDay").addEventListener("click", () => { state.selectedDay = shiftDay(state.selectedDay, -1); render(); });
$("#nextDay").addEventListener("click", () => { state.selectedDay = shiftDay(state.selectedDay, 1); render(); });
$("#todayButton").addEventListener("click", () => { state.selectedDay = todayKey(); render(); });
$("#advanceDay").addEventListener("click", advanceDay);

rolloverToToday();
render();
