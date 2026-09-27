// merchant/public/sw.js
// Runs in the background, separate from the page — this is what lets a
// notification show up even if the distributor doesn't have the app open.

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'New order', body: event.data.text() };
  }

  const { title = 'Loal Vegetable', body = '', url = '/' } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: { url },
      tag: 'order-notification', // reuses one notification slot instead of stacking duplicates
    })
  );
});

// Tapping the notification focuses an existing tab if one's open,
// otherwise opens a new one at the target URL.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});