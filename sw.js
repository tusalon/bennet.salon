// sw.js - Service Worker con mejor detección de actualizaciones

const CACHE_NAME = 'bennet-salon-v2'; // ⬅️ CAMBIAR EN CADA ACTUALIZACIÓN

const urlsToCache = [
  '/bennet.salon/',
  '/bennet.salon/index.html',
  '/bennet.salon/admin.html',
  '/bennet.salon/admin-login.html',
  '/bennet.salon/app.js',
  '/bennet.salon/admin-app.js',
  '/bennet.salon/manifest.json',
  '/bennet.salon/utils/api.js',
  '/bennet.salon/utils/timeLogic.js',
  '/bennet.salon/utils/auth-clients.js',
  '/bennet.salon/utils/config.js',
  '/bennet.salon/utils/servicios.js',
  '/bennet.salon/utils/trabajadoras.js',
  '/bennet.salon/components/Header.js',
  '/bennet.salon/components/WelcomeScreen.js',
  '/bennet.salon/components/ServiceSelection.js',
  '/bennet.salon/components/Calendar.js',
  '/bennet.salon/components/TimeSlots.js',
  '/bennet.salon/components/BookingForm.js',
  '/bennet.salon/components/Confirmation.js',
  '/bennet.salon/components/WhatsAppButton.js',
  '/bennet.salon/components/ClientAuthScreen.js',
  '/bennet.salon/components/admin/ConfigPanel.js',
  '/bennet.salon/components/admin/ServiciosPanel.js',
  '/bennet.salon/components/admin/TrabajadorasPanel.js'
];

// Escuchar mensajes para SKIP_WAITING
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Instalación
self.addEventListener('install', event => {
  console.log('Service Worker instalando...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Archivos cacheados');
        return cache.addAll(urlsToCache).catch(error => {
          console.error('Error cacheando:', error);
        });
      })
  );
});

// Activación
self.addEventListener('activate', event => {
  console.log('Service Worker activando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Cache viejo eliminado:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Enviar mensaje a TODAS las pestañas
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'NEW_VERSION_AVAILABLE'
          });
        });
      });
      return self.clients.claim();
    })
  );
});

// Estrategia de cache: Network First para HTML, Cache First para assets
self.addEventListener('fetch', event => {
  // No cachear peticiones a Supabase
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  // Para archivos HTML, siempre buscar en red primero
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Para el resto, cache first con actualización en background
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Devolver cache mientras se actualiza en segundo plano
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, networkResponse.clone()));
            }
            return networkResponse;
          })
          .catch(() => {});

        return cachedResponse || fetchPromise;
      })
  );
});