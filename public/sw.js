/**
 * Service Worker — Offline cache (stale-while-revalidate สำหรับหน้าและ asset)
 * API จะไม่ถูก cache เพื่อให้ต้นไม้เป็นข้อมูลล่าสุดเสมอ
 */
const CACHE = 'ethics-tree-v1';
const PRECACHE = ['/', '/manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.pathname.startsWith('/api/')) return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request)
        .then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
          return res.clone();
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});

/** Push Notification — แสดงแจ้งเตือนที่ส่งมาจาก server (ถ้าตั้งค่า Web Push) */
self.addEventListener('push', (e) => {
  const data = e.data?.json() ?? { title: 'ต้นไม้จริยธรรม', body: 'มีการอัปเดตใหม่' };
  e.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: '/icons/icon-192.png' }));
});
