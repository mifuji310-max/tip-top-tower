// Tip Top Tower のサービスワーカー（オフラインでも起動できるようにする仕組み）
// 方針：ネット優先。つながるときは毎回最新のファイルを取りに行き（更新がすぐ反映される）、
//       取れたファイルを保存しておく。つながらないときだけ、保存しておいたファイルを使う。
// バージョンを上げたら CACHE の名前もそろえて変える（古い保存データを消すため）。
const CACHE = 'tip-top-tower-v0.19.0';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })
      // ?v=0.19.0 のような付け足しは無視して、保存しておいたファイルを探す
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
