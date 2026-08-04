const STORAGE_KEY = "mingri-tasks-v2";
const LEGACY_KEY = "xuri-tasks-v1";
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const config = window.APP_CONFIG || {};

const state = {
  tasks: loadLocalTasks(),
  selectedDay: todayKey(),
  user: null,
  supabase: null,
  authMode: "login",
  cloudReady: false,
};

async function init() {
  rolloverToToday();
  bindEvents();
  render();
  if (config.supabaseUrl && config.supabasePublishableKey) await initCloud();
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
  } else {
    state.tasks = loadLocalTasks();
    render();
  }
}

function todayKey() { return toKey(new Date()); }
function toKey(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
function fromKey(key) { const [y,m,d] = key.split("-").map(Number); return new Date(y,m-1,d); }
function shiftDay(key, amount) { const d = fromKey(key); d.setDate(d.getDate()+amount); return toKey(d); }
function daysBetween(a,b) { return Math.max(1, Math.round((fromKey(b)-fromKey(a))/86400000)); }
function formatLong(key) { return new Intl.DateTimeFormat("zh-CN",{month:"long",day:"numeric",weekday:"long"}).format(fromKey(key)); }
function formatShort(key) { return new Intl.DateTimeFormat("zh-CN",{month:"numeric",day:"numeric"}).format(fromKey(key)); }

function loadLocalTasks() {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (current) return current;
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY)) || [];
    const migrated = legacy.map(t => normalizeTask(t));
    if (migrated.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch { return []; }
}
function normalizeTask(task) {
  return { id: task.id || crypto.randomUUID(), text: task.text, day: task.day, originalDay: task.originalDay || task.carriedFrom || task.day, createdAt: task.createdAt || Date.now(), updatedAt: task.updatedAt || Date.now(), completedAt: task.completedAt || null, done: Boolean(task.done), carryCount: task.carryCount || 0, history: task.history || [] };
}
function saveLocal() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks)); }

function rolloverToToday() {
  const today = todayKey(); let changed = false;
  state.tasks.forEach(task => {
    if (!task.done && task.day < today) {
      const from = task.day;
      task.history ||= []; task.history.push({type:"carried",from,to:today,at:new Date().toISOString()});
      task.carryCount += daysBetween(from,today); task.day = today; task.updatedAt = Date.now(); changed = true;
    }
  });
  if (changed) saveLocal();
}

function render() {
  const today = todayKey();
  const offset = Math.round((fromKey(state.selectedDay)-fromKey(today))/86400000);
  $("#relativeDay").textContent = offset===0?"今天":offset===1?"明天":offset===-1?"昨天":offset>1?`${offset} 天后`:`${Math.abs(offset)} 天前`;
  $("#dayTitle").textContent = formatLong(state.selectedDay).replace("星期","周");
  $("#dayWhisper").textContent = offset<0?"已经走过的日子，也值得轻轻回看。":offset>0?"先放在这里，到时候再慢慢做。":"不用一次做好所有事。";
  const tasks = state.tasks.filter(t=>t.day===state.selectedDay && !t.deletedAt).sort((a,b)=>Number(a.done)-Number(b.done)||a.createdAt-b.createdAt);
  $("#taskList").innerHTML="";
  tasks.forEach(task=>$("#taskList").append(createTaskNode(task)));
  $("#emptyState").hidden=tasks.length>0;
  const done=tasks.filter(t=>t.done).length;
  $("#progressText").textContent=tasks.length?`今天已经完成 ${done} 件，还有 ${tasks.length-done} 件可以慢慢来`:"今天还没有安排";
  $("#progressBar").style.width=tasks.length?`${done/tasks.length*100}%`:"0%";
  $("#taskForm button").textContent=offset===0?"放进今天":offset===1?"放进明天":"放进这天";
}

function createTaskNode(task) {
  const node=$("#taskTemplate").content.firstElementChild.cloneNode(true); node.dataset.id=task.id; node.classList.toggle("done",task.done);
  node.querySelector(".task-text").textContent=task.text;
  const meta=node.querySelector(".task-meta");
  meta.textContent=task.carryCount?`从 ${formatShort(task.originalDay)} 一起走来 · 已继续 ${task.carryCount} 天`:task.done?"今天已经做到这里":"刚刚写下";
  const check=node.querySelector(".check-button"); check.setAttribute("aria-label",task.done?"恢复为未完成":"标记完成");
  check.addEventListener("click",()=>toggleTask(task.id));
  node.querySelector(".edit-button").addEventListener("click",()=>editTask(node,task));
  node.querySelector(".delete-button").addEventListener("click",()=>deleteTask(task.id));
  node.querySelector(".task-text").addEventListener("dblclick",()=>editTask(node,task));
  return node;
}

function editTask(node,task) {
  if(node.classList.contains("editing")) return; node.classList.add("editing");
  const copy=node.querySelector(".task-copy"); const input=document.createElement("input"); input.value=task.text; input.maxLength=120; copy.innerHTML=""; copy.append(input); input.focus();
  const finish=async()=>{const value=input.value.trim(); if(value&&value!==task.text){task.text=value;task.updatedAt=Date.now();await persistTask(task);} render();};
  input.addEventListener("blur",finish,{once:true}); input.addEventListener("keydown",e=>{if(e.key==="Enter")input.blur();if(e.key==="Escape"){input.value=task.text;input.blur();}});
}

async function addTask(text) {
  const task=normalizeTask({id:crypto.randomUUID(),text,day:state.selectedDay,originalDay:state.selectedDay,createdAt:Date.now()}); state.tasks.push(task); saveLocal(); render(); await persistTask(task);
}
async function toggleTask(id) { const task=state.tasks.find(t=>t.id===id); task.done=!task.done; task.completedAt=task.done?new Date().toISOString():null; task.updatedAt=Date.now(); saveLocal(); render(); await persistTask(task); }
async function deleteTask(id) { const task=state.tasks.find(t=>t.id===id); task.deletedAt=new Date().toISOString(); task.updatedAt=Date.now(); saveLocal(); render(); await persistTask(task); showToast("这件事已经移走"); }

async function advanceDay() {
  const from=state.selectedDay, next=shiftDay(from,1); const moved=[];
  state.tasks.forEach(task=>{if(task.day===from&&!task.done&&!task.deletedAt){task.history.push({type:"carried",from,to:next,at:new Date().toISOString()});task.day=next;task.carryCount++;task.updatedAt=Date.now();moved.push(task);}});
  state.selectedDay=next; saveLocal(); render(); await Promise.all(moved.map(persistTask)); showToast(moved.length?`${moved.length} 件事陪你来到明天`:"今天已经轻轻收好");
}

async function persistTask(task) {
  if(!state.cloudReady) return;
  const row={id:task.id,user_id:state.user.id,text:task.text,scheduled_day:task.day,original_day:task.originalDay,completed_at:task.completedAt,carry_count:task.carryCount,history:task.history,deleted_at:task.deletedAt||null,created_at:new Date(task.createdAt).toISOString(),updated_at:new Date(task.updatedAt).toISOString()};
  const {error}=await state.supabase.from("tasks").upsert(row); if(error){console.error(error);showToast("云端同步稍后会重试");}
}
async function loadCloudTasks() {
  const {data,error}=await state.supabase.from("tasks").select("*").is("deleted_at",null).order("created_at");
  if(error){showToast("暂时无法读取云端任务");return;}
  state.tasks=data.map(row=>normalizeTask({id:row.id,text:row.text,day:row.scheduled_day,originalDay:row.original_day,createdAt:new Date(row.created_at).getTime(),updatedAt:new Date(row.updated_at).getTime(),completedAt:row.completed_at,done:Boolean(row.completed_at),carryCount:row.carry_count,history:row.history||[]})); saveLocal(); render();
}
async function importLocalTasks() {
  const pending=loadLocalTasks().filter(t=>!t.syncedUserId&&!t.deletedAt); if(!pending.length)return;
  for(const task of pending){await persistTask(task);task.syncedUserId=state.user.id;} saveLocal();
}

function updateAccountUI() {
  const signed=Boolean(state.user); $("#accountButton").classList.toggle("signed-in",signed); $("#accountLabel").textContent=signed?(state.user.email?.split("@")[0]||"我的账号"):"登录";
  $("#syncNote").classList.toggle("synced",signed); $("#syncText").textContent=signed?"已经保存到你的账号":"任务只保存在这台设备"; $("#syncAction").textContent=signed?"已同步":"登录后同步";
  $("#feedbackHint").textContent=signed?"反馈不会附带你的待办内容。":"登录后可以发送反馈。";
  if(state.user?.app_metadata?.role==="developer"&&!$("[data-view-link='feedback-admin']")){const b=document.createElement("button");b.className="nav-link";b.dataset.viewLink="feedback-admin";b.textContent="查看反馈";b.addEventListener("click",()=>switchView("feedback-admin"));$(".main-nav").append(b);}
}

async function handleAuth(event) {
  event.preventDefault(); $("#authError").textContent="";
  if(!state.supabase){$("#authError").textContent="云端尚未配置，请先完成 Supabase 设置。";return;}
  const email=$("#authEmail").value.trim(),password=$("#authPassword").value;
  const result=state.authMode==="register"?await state.supabase.auth.signUp({email,password}):await state.supabase.auth.signInWithPassword({email,password});
  if(result.error){$("#authError").textContent=translateAuthError(result.error.message);return;}
  if(state.authMode==="register"&&!result.data.session){$("#authError").textContent="确认邮件已经发出，请打开邮箱完成注册。";return;}
  $("#authDialog").close(); showToast(state.authMode==="register"?"账号创建好了":"欢迎回来");
}
function translateAuthError(message){if(message.includes("Invalid login"))return "邮箱或密码不正确。";if(message.includes("already registered"))return "这个邮箱已经注册过。";if(message.includes("Password"))return "密码至少需要 8 位。";return message;}
async function resetPassword(){const email=$("#authEmail").value.trim();if(!email){$("#authError").textContent="先填写注册邮箱。";return;}if(!state.supabase){$("#authError").textContent="云端尚未配置。";return;}const {error}=await state.supabase.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});$("#authError").textContent=error?error.message:"重置邮件已经发出，请检查邮箱。";}

async function submitFeedback(event) {
  event.preventDefault(); if(!state.user){openAuth();showToast("登录后就可以把反馈送过来");return;}
  const row={user_id:state.user.id,type:new FormData(event.currentTarget).get("feedbackType"),message:$("#feedbackMessage").value.trim(),contact_email:$("#feedbackEmail").value.trim()||null,page_url:location.href,app_version:"2.0.0"};
  const {error}=await state.supabase.from("feedback").insert(row); if(error){showToast("反馈没有送达，请稍后再试");return;} event.currentTarget.reset(); showToast("收到了，谢谢你认真说这些");
}
async function loadFeedback(){if(state.user?.app_metadata?.role!=="developer")return;const {data}=await state.supabase.from("feedback").select("*").order("created_at",{ascending:false});$("#feedbackList").innerHTML=(data||[]).map(f=>`<article class="feedback-card"><small>${escapeHTML(f.type)} · ${new Date(f.created_at).toLocaleString("zh-CN")}</small><p>${escapeHTML(f.message)}</p>${f.contact_email?`<small>${escapeHTML(f.contact_email)}</small>`:""}</article>`).join("")||"<p>暂时还没有反馈。</p>";}
function escapeHTML(value){const d=document.createElement("div");d.textContent=value||"";return d.innerHTML;}

function switchView(name){$$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===name));$$('[data-view-link]').forEach(b=>b.classList.toggle('active',b.dataset.viewLink===name));if(name==="feedback-admin")loadFeedback();location.hash=name;}
function openAuth(){state.authMode="login";updateAuthMode();$("#authDialog").showModal();}
function updateAuthMode(){const reg=state.authMode==="register";$("#authTitle").textContent=reg?"从今天开始":"欢迎回来";$("#authSubtitle").textContent=reg?"创建账号后，这台设备上的任务也会一起保存。":"登录后，任务会在你的设备之间同步。";$("#authSubmit").textContent=reg?"创建账号":"登录";$("#authModeSwitch").textContent=reg?"已经有账号？登录":"还没有账号？注册";$("#authPassword").autocomplete=reg?"new-password":"current-password";}
function exportData(){const blob=new Blob([JSON.stringify(state.tasks.filter(t=>!t.deletedAt),null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`明日复明日-${todayKey()}.json`;a.click();URL.revokeObjectURL(a.href);}
async function requestDeletion(){if(!confirm("提交后，开发者会删除你的账号和关联数据。确定继续吗？"))return;const {error}=await state.supabase.from("account_deletion_requests").insert({user_id:state.user.id,email:state.user.email});if(error){showToast("申请没有提交成功");return;}await state.supabase.auth.signOut();$("#accountDialog").close();showToast("删除申请已经收到");}

function bindEvents(){
  $("#taskForm").addEventListener("submit",e=>{e.preventDefault();const input=$("#taskInput"),text=input.value.trim();if(!text)return;addTask(text);input.value="";input.focus();});
  $("#prevDay").addEventListener("click",()=>{state.selectedDay=shiftDay(state.selectedDay,-1);render();}); $("#nextDay").addEventListener("click",()=>{state.selectedDay=shiftDay(state.selectedDay,1);render();}); $("#todayButton").addEventListener("click",()=>{state.selectedDay=todayKey();render();}); $("#advanceDay").addEventListener("click",advanceDay);
  $$('[data-view-link]').forEach(b=>b.addEventListener("click",e=>{e.preventDefault();switchView(b.dataset.viewLink);}));
  $("#accountButton").addEventListener("click",()=>{if(state.user){$("#accountEmail").textContent=state.user.email;$("#accountDialog").showModal();}else openAuth();}); $("#syncAction").addEventListener("click",()=>{if(!state.user)openAuth();});
  $$('[data-close-dialog]').forEach(b=>b.addEventListener("click",()=>$("#"+b.dataset.closeDialog).close()));
  $("#authForm").addEventListener("submit",handleAuth); $("#authModeSwitch").addEventListener("click",()=>{state.authMode=state.authMode==="login"?"register":"login";updateAuthMode();}); $("#resetPassword").addEventListener("click",resetPassword);
  $("#feedbackForm").addEventListener("submit",submitFeedback); $("#signOut").addEventListener("click",async()=>{await state.supabase.auth.signOut();$("#accountDialog").close();showToast("已经安全退出");}); $("#exportData").addEventListener("click",exportData); $("#openPrivacy").addEventListener("click",()=>{$("#accountDialog").close();$("#privacyDialog").showModal();}); $("#requestDeletion").addEventListener("click",requestDeletion);
}
let toastTimer; function showToast(message){const t=$("#toast");t.textContent=message;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2400);}

init();
