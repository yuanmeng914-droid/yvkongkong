const CACHE_NAME = "mingri-shell-4.0";
const APP_SHELL = ["./", "./index.html", "./styles.css?v=3.0.0", "./app.js?v=3.0.0", "./config.js?v=4.0.0", "./manifest.webmanifest", "./icon.svg", "./offline.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request).then((cached) => cached || caches.match("./offline.html"))));
});

self.addEventListener("push", (event) => {
  const data = event.data?.json?.() || { title: "明日复明日", body: "现在可以看看今天的事情了。", url: "./" };
  event.waitUntil(self.registration.showNotification(data.title || "明日复明日", {
    body: data.body,
    icon: "./icon.svg",
    badge: "./icon.svg",
    tag: data.tag || "mingri-reminder",
    data: { url: data.url || "./" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((tabs) => {
    const existing = tabs.find((tab) => "focus" in tab);
    return existing ? existing.focus() : clients.openWindow(event.notification.data?.url || "./");
  }));
});
