/*
 * VITA service worker
 * 1. Offline app shell (the app works with no signal at the gym).
 * 2. Serves ./vita.ics?d=<payload> as a real text/calendar response, built on the
 *    device from the schedule in the URL. A real .ics URL is what iPhone Safari
 *    hands to Calendar most reliably; blob: links are flaky there.
 */
importScripts('./ics.js');

const VERSION = 'vita-v2.0.0';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './ics.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith('/vita.ics')) {
    event.respondWith(calendarResponse(url));
    return;
  }
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    // Network first so updates land; fall back to the cached shell offline.
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          if (res.ok) caches.open(VERSION).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Static assets: cache first, refresh in the background.
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      const network = fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(event.request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

function calendarResponse(url) {
  try {
    const payload = self.VitaICS.decode(url.searchParams.get('d'));
    const body = self.VitaICS.build(payload, new Date());
    const name = payload && payload.test ? 'vita-test.ics' : 'vita-reminders.ics';
    return new Response(body, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `inline; filename="${name}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return new Response('VITA could not build this calendar file: ' + err.message, {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
