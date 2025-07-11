self.addEventListener('install', () => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  console.log('Service Worker activated');
});
self.addEventListener('push', event => {
  const data = event.data?.json() ?? {};
  console.log('📨 푸시 메시지 수신:', data);

  event.waitUntil(
    self.registration.showNotification(data.title || '알림', {
      body: data.body || '푸시 내용이 도착했습니다.',
      icon: '/icon.png',
      data: data.url || '/'
    })
  );
});