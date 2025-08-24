
self.addEventListener("install", (event) => {
  console.log("Service Worker installed");
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || "Reminder", {
      body: data.body || "It's time for your medication.",
      icon: "/icons/icon-192x192.png"
    })
  );
});
