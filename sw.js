// Cambiamos a v3 para forzar la limpieza total de cualquier rastro anterior
const CACHE_NAME = 'clockintime-v3'; 

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/CSS/index.css',
  '/CSS/app-style.css',
  '/js/theme.js',
  '/js/cooky.js',
  'https://iili.io/fzg2rNt.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css'
];

// INSTALACIÓN: Cacheamos los recursos esenciales
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Obliga al nuevo SW a tomar el control inmediatamente
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Cacheando archivos de v3');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// ACTIVACIÓN: Limpiamos TODAS las cachés viejas (v1, v2, etc.)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Borrando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Toma el control de las pestañas abiertas
  );
});

// FETCH: Estrategia "Network First" (Prioridad a la Red)
// Esto asegura que el SEO (FAQs) y los botones funcionen con el código más reciente
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si hay red, actualizamos la caché con la respuesta fresca
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => {
        // Si no hay red (offline), servimos lo que haya en caché
        return caches.match(event.request);
      })
  );
});