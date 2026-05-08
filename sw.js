// Actualizamos el nombre de la caché para forzar la actualización en todos los navegadores
const CACHE_NAME = 'clockintime-v2'; 

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/CSS/index.css',
  '/CSS/app-style.css',
  '/js/theme.js',
  '/js/cooky.js', // Añadido para que la lógica de cookies sea consistente
  'https://iili.io/fzg2rNt.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css'
];

// Instalación: Guarda los archivos en la nueva caché
self.addEventListener('install', (event) => {
  // skipWaiting() obliga al nuevo service worker a activarse de inmediato
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caché v2 abierta');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activación: Limpia las versiones antiguas de la caché (v1, v0, etc.)
self.addEventListener('activate', (event) => {
  const cacheAllowlist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheAllowlist.indexOf(cacheName) === -1) {
            console.log('Borrando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estrategia: Network First (Red primero), si falla, usa la Caché
// Esto es mejor para evitar que el banner de cookies o el nombre del usuario se queden "congelados"
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la red funciona, devolvemos la respuesta fresca
        return response;
      })
      .catch(() => {
        // Si falla la red (offline), buscamos en la caché
        return caches.match(event.request);
      })
  );
});