// Vibeverse Arcade - Service Worker
const CACHE_NAME = 'vibeverse-arcade-v1';

// Assets to cache on install
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './main.js',
  './game.js',
  './entity.js',
  './player.js',
  './input.js',
  './utils.js',
  './assetLoader.js',
  './camera.js',
  './pathResolver.js',
  './spellbookEntity.js',
  './spellbookEntity2.js',
  './spellbookManager.js',
  './spellbookManager2.js',
  './signManager9.js',
  './vibePortalManager.js',
  './visitorCounterEntity.js',
  './visitorCounterManager.js',
  './assets/background.png',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// Install event - cache assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  
  // Skip waiting forces the waiting service worker to become the active service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .catch(error => {
        console.error('[Service Worker] Pre-cache error:', error);
      })
  );
});

// Activate event - clean up old caches and take control immediately
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  
  // Delete all caches that aren't named in CACHE_NAME
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] Claiming clients...');
      return self.clients.claim(); // Take control of all clients
    })
  );
});

// Fetch event - network first strategy for JS files, cache for others
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  const requestUrl = event.request.url;
  
  // For JS files, especially arcadeEntity12.js, always go to network first
  if (requestUrl.endsWith('.js') || requestUrl.includes('arcadeEntity12.js')) {
    console.log('[Service Worker] Network-first fetch for JS file:', requestUrl);
    
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response to store in cache
          const responseToCache = response.clone();
          
          // Open the cache and update it
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
              console.log('[Service Worker] Updated cache for:', requestUrl);
            });
          
          return response;
        })
        .catch(err => {
          console.log('[Service Worker] Network request failed, trying cache for:', requestUrl);
          return caches.match(event.request);
        })
    );
  } else {
    // For other resources, check cache first, then network
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then(response => {
              // Don't cache if response is not valid
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clone the response to store in cache
              const responseToCache = response.clone();
              
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            });
        })
    );
  }
});

// Original activate event - kept for compatibility
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  
  // Claim immediately on activation
  event.waitUntil(self.clients.claim());
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log('[Service Worker] Clearing old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise try to fetch from network
        return fetch(event.request)
          .then(response => {
            // Don't cache if not a success response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response as it can only be consumed once
            const responseToCache = response.clone();
            
            // Cache the network response
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
            console.error('[Service Worker] Fetch error:', error);
            // Return a custom offline page here if needed
          });
      })
  );
});
