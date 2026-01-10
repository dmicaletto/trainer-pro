const CACHE_NAME = 'gym-app-v2';

// File statici fondamentali da cachare subito
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Installazione: Cacha gli asset statici
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Attivazione: Pulisce vecchie cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('SW: Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Strategia "Stale-While-Revalidate" per file statici, "Network First" per API
self.addEventListener('fetch', (event) => {
  // Ignora richieste non GET o verso estensioni browser
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Se c'è in cache, restituiscilo (velocità)
      // MA lancia anche una fetch di rete per aggiornare la cache per la prossima volta
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Se la risposta di rete è valida, aggiorna la cache
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Se siamo offline e la fetch fallisce, non fare nulla (abbiamo già restituito la cache se c'era)
      });

      // Restituisci la versione cache se c'è, altrimenti aspetta la rete
      return cachedResponse || fetchPromise;
    })
  );
});
