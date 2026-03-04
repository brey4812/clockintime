const CACHE_NAME = 'clockintime-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/CSS/index.css',
  '/CSS/app-style.css',
  '/js/theme.js',
  'https://iili.io/fzg2rNt.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});