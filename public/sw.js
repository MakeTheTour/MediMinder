
// This is a basic service worker that allows the app to be installable.
// For more advanced caching strategies, you might want to use a more complex setup.

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  // You can pre-cache assets here if needed.
});

self.addEventListener('fetch', (event) => {
  // This simple service worker doesn't intercept fetch requests.
  // It's just here to make the app a PWA.
  // More complex strategies could be implemented here for offline capabilities.
  event.respondWith(fetch(event.request));
});

self.addEventListener('push', (event) => {
  const data = event.data.json();
  const title = data.title || 'MediMinder';
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
