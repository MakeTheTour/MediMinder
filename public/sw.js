
// This is a basic service worker file.
// You can add more logic here for caching strategies, background sync, etc.

const CACHE_NAME = 'mediminder-cache-v1';
const urlsToCache = [
  '/',
  '/home',
  '/medicine',
  '/health',
  '/family',
  '/settings',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/notification.mp3',
  // Add other important assets here.
  // Be careful not to cache too much, especially large files.
];

self.addEventListener('install', (event) => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle push notifications (basic example)
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'MediMinder';
    const options = {
        body: data.body || 'You have a new notification.',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

// When the user clicks on the notification
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});
