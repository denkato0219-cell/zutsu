// 頭痛メモ service worker: アプリ本体はキャッシュして電波なしでも起動、気象データは常に最新を取りにいく
const VERSION = 'zutsu-v1';
const SHELL = ['./', './index.html', './manifest.json', './apple-touch-icon.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.hostname === 'api.open-meteo.com') return; // 気象データはアプリ側で扱う
  if (url.origin === location.origin) {
    // 自分のファイル: ネット優先（更新を反映）、だめならキャッシュ
    e.respondWith(fetch(e.request).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
    return;
  }
  if (url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return res;
    })));
  }
});
