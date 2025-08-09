// =================== SERVICE WORKER - TU GUÍA CARTAGENA ===================

const CACHE_NAME = 'tuguia-v3.0.0';
const STATIC_CACHE = 'tuguia-static-v3';
const DYNAMIC_CACHE = 'tuguia-dynamic-v3';

// Archivos críticos para cache
const STATIC_FILES = [
    './',
    './index.html',
    './yotellevo.html',
    './manifest.json',
    './logoagapai-ok2.png',
    './pin-verde-destino.png',
    './pin-morado.png',
    './background-manager.js',
    './state-manager.js',
    './error-handler.js',
    './utils.js',
    './mobile-optimization.js'
];

// =================== EVENTO DE INSTALACIÓN ===================
self.addEventListener('install', (event) => {
    console.log('🔧 [SW] Instalando Service Worker...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('📦 [SW] Cacheando archivos estáticos...');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('✅ [SW] Instalación completada');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ [SW] Error en instalación:', error);
            })
    );
});

// =================== EVENTO DE ACTIVACIÓN ===================
self.addEventListener('activate', (event) => {
    console.log('🚀 [SW] Activando Service Worker...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Limpiar caches antiguos
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('🗑️ [SW] Eliminando cache antiguo:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ [SW] Activación completada');
                return self.clients.claim();
            })
            .catch((error) => {
                console.error('❌ [SW] Error en activación:', error);
            })
    );
});

// =================== EVENTO DE FETCH ===================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Solo manejar requests del mismo origen
    if (url.origin !== location.origin) {
        return;
    }
    
    // Estrategia: Cache First para archivos estáticos
    if (STATIC_FILES.some(file => request.url.includes(file))) {
        event.respondWith(
            caches.match(request)
                .then((response) => {
                    if (response) {
                        console.log('📦 [SW] Sirviendo desde cache:', request.url);
                        return response;
                    }
                    return fetch(request)
                        .then((fetchResponse) => {
                            // Cachear respuesta exitosa
                            if (fetchResponse && fetchResponse.status === 200) {
                                const responseClone = fetchResponse.clone();
                                caches.open(STATIC_CACHE)
                                    .then((cache) => cache.put(request, responseClone));
                            }
                            return fetchResponse;
                        });
                })
        );
        return;
    }
    
    // Estrategia: Network First para datos dinámicos
    if (request.url.includes('.json') || request.url.includes('api')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cachear respuesta exitosa
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE)
                            .then((cache) => cache.put(request, responseClone));
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback a cache si la red falla
                    return caches.match(request);
                })
        );
        return;
    }
    
    // Estrategia por defecto: Network First
    event.respondWith(
        fetch(request)
            .catch(() => {
                return caches.match(request);
            })
    );
});

// =================== EVENTO DE SYNC ===================
self.addEventListener('sync', (event) => {
    console.log('🔄 [SW] Sincronización en segundo plano:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Aquí se pueden agregar tareas de sincronización
            console.log('📱 [SW] Ejecutando sincronización en segundo plano...')
        );
    }
});

// =================== EVENTO DE PUSH ===================
self.addEventListener('push', (event) => {
    console.log('📲 [SW] Notificación push recibida');
    
    const options = {
        body: event.data ? event.data.text() : 'Nueva notificación de Tu Guía',
        icon: './logoagapai-ok2.png',
        badge: './pin-verde-destino.png',
        vibrate: [200, 100, 200],
        data: {
            url: './index.html'
        },
        actions: [
            {
                action: 'open',
                title: 'Abrir',
                icon: './pin-verde-destino.png'
            },
            {
                action: 'close',
                title: 'Cerrar',
                icon: './pin-morado.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Tu Guía Cartagena', options)
    );
});

// =================== EVENTO DE NOTIFICATION CLICK ===================
self.addEventListener('notificationclick', (event) => {
    console.log('👆 [SW] Notificación clickeada:', event.action);
    
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then((clientList) => {
                    // Si ya hay una ventana abierta, enfocarla
                    for (const client of clientList) {
                        if (client.url.includes('index.html') || client.url.includes('yotellevo.html')) {
                            return client.focus();
                        }
                    }
                    // Si no hay ventana abierta, abrir una nueva
                    return clients.openWindow('./index.html');
                })
        );
    }

    if (event.action === 'stop_tracking') {
        // Notificar a clientes para detener el tracking
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    clientList.forEach((client) => {
                        client.postMessage({ type: 'STOP_TRACKING' });
                    });
                })
        );
    }
});

// =================== MANEJO DE MENSAJES ===================
self.addEventListener('message', (event) => {
    console.log('💬 [SW] Mensaje recibido:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: '3.0.0' });
    }
});

console.log('🚀 [SW] Service Worker cargado correctamente'); 