self.addEventListener('push', (event) => {
  const raw = event.data ? event.data.text() : '';
  let data = { title: 'Solaris CET', body: 'Notificare', url: '/app' };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const title = typeof parsed.title === 'string' ? parsed.title : data.title;
      const body = typeof parsed.body === 'string' ? parsed.body : data.body;
      const url = typeof parsed.url === 'string' ? parsed.url : data.url;
      data = { title, body, url };
    }
  } catch {
    void 0;
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      data: { url: data.url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification?.data?.url;
  if (typeof url !== 'string') return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
      return undefined;
    }),
  );
});

