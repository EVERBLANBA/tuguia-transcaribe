// =================== SERVICE WORKER PARA SEGUNDO PLANO ===================

const CACHE_NAME = 'tuguia-v2';
const CACHE_VERSION = '2.0.0';

// Archivos críticos para funcionalidad offline
const STATIC_CACHE_FILES = [
    '/',
    '/index.html',
    '/yotellevo.html',
    '/utils.js',
    '/state-manager.js', 
    '/error-handler.js',
    '/logoagapai-ok2.png',
    '/pin-morado.png',
    '/pin-verde-destino.png',
    '/BUS.jpeg',
    '/bus-station.png'
];

// Archivos de datos que se pueden cachear
const DATA_CACHE_FILES = [
    '/rutas_transcaribe.geojson',
    '/paraderos.json',
    '/manuales.geojson'
];

// URLs de APIs externas para cache
const API_CACHE_PATTERNS = [
    /^https:\/\/nominatim\.openstreetmap\.org/,
    /^https:\/\/api\.openrouteservice\.org/,
    /^https:\/\/overpass-api\.de/
];

// =================== INSTALACIÓN DEL SERVICE WORKER ===================
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Instalando...');
    
    event.waitUntil(
        Promise.all([
            // Cache de archivos estáticos
            caches.open(CACHE_NAME + '-static').then((cache) => {
                console.log('📦 Cacheando archivos estáticos...');
                return cache.addAll(STATIC_CACHE_FILES);
            }),
            // Cache de datos
            caches.open(CACHE_NAME + '-data').then((cache) => {
                console.log('📊 Cacheando archivos de datos...');
                return cache.addAll(DATA_CACHE_FILES);
            })
        ]).then(() => {
            console.log('✅ Service Worker instalado correctamente');
            // Forzar activación inmediata
            return self.skipWaiting();
        })
    );
});

// =================== ACTIVACIÓN DEL SERVICE WORKER ===================
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker: Activando...');
    
    event.waitUntil(
        Promise.all([
            // Limpiar caches antiguos
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName.startsWith('tuguia-') && 
                            !cacheName.includes(CACHE_VERSION)) {
                            console.log('🗑️ Eliminando cache antiguo:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Tomar control inmediato
            self.clients.claim()
        ]).then(() => {
            console.log('✅ Service Worker activado y en control');
        })
    );
});

// =================== INTERCEPTAR REQUESTS ===================
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Estrategia por tipo de recurso
    if (STATIC_CACHE_FILES.includes(url.pathname)) {
        // Cache First para archivos estáticos
        event.respondWith(cacheFirst(event.request, CACHE_NAME + '-static'));
    } else if (DATA_CACHE_FILES.includes(url.pathname)) {
        // Stale While Revalidate para datos
        event.respondWith(staleWhileRevalidate(event.request, CACHE_NAME + '-data'));
    } else if (API_CACHE_PATTERNS.some(pattern => pattern.test(event.request.url))) {
        // Network First con cache fallback para APIs
        event.respondWith(networkFirstWithCache(event.request, CACHE_NAME + '-api'));
    } else if (event.request.destination === 'image') {
        // Cache First para imágenes
        event.respondWith(cacheFirst(event.request, CACHE_NAME + '-images'));
    }
});

// =================== ESTRATEGIAS DE CACHE ===================

// Cache First: Prioriza cache, fallback a red
async function cacheFirst(request, cacheName) {
    try {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error('Error en cacheFirst:', error);
        return new Response('Recurso no disponible offline', { status: 503 });
    }
}

// Network First: Prioriza red, fallback a cache
async function networkFirstWithCache(request, cacheName) {
    try {
        const cache = await caches.open(cacheName);
        
        try {
            const networkResponse = await fetch(request);
            if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        } catch (networkError) {
            console.log('Red no disponible, usando cache para:', request.url);
            const cachedResponse = await cache.match(request);
            if (cachedResponse) {
                return cachedResponse;
            }
            throw networkError;
        }
    } catch (error) {
        console.error('Error en networkFirst:', error);
        return new Response('Servicio no disponible', { status: 503 });
    }
}

// Stale While Revalidate: Devuelve cache inmediatamente, actualiza en segundo plano
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    // Actualizar en segundo plano
    const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(() => {
        // Silencioso si falla la actualización
    });
    
    // Devolver cache inmediatamente si existe
    return cachedResponse || fetchPromise;
}

// =================== MENSAJES DESDE LA APP ===================
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_VERSION':
            event.ports[0].postMessage({
                version: CACHE_VERSION,
                caches: Object.keys(caches)
            });
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({ success: true });
            });
            break;
            
        case 'CACHE_ROUTE_DATA':
            // Cachear datos de ruta específicos
            cacheRouteData(data).then(() => {
                event.ports[0].postMessage({ success: true });
            });
            break;
    }
});

// =================== FUNCIONES DE UTILIDAD ===================

// Limpiar todos los caches
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
    );
}

// Cachear datos específicos de ruta
async function cacheRouteData(routeData) {
    const cache = await caches.open(CACHE_NAME + '-routes');
    const response = new Response(JSON.stringify(routeData), {
        headers: { 'Content-Type': 'application/json' }
    });
    await cache.put('/current-route', response);
}

// =================== SYNC EN SEGUNDO PLANO ===================
self.addEventListener('sync', (event) => {
    console.log('🔄 Background Sync:', event.tag);
    
    if (event.tag === 'background-location-sync') {
        event.waitUntil(syncLocationData());
    } else if (event.tag === 'route-analytics') {
        event.waitUntil(syncRouteAnalytics());
    }
});

// Sincronizar datos de ubicación en segundo plano
async function syncLocationData() {
    try {
        // Obtener datos pendientes de sincronizar
        const pendingData = await getStoredData('pending-location-data');
        
        if (pendingData && pendingData.length > 0) {
            // Enviar datos al servidor (cuando esté disponible)
            console.log('📍 Sincronizando', pendingData.length, 'puntos de ubicación');
            
            // Limpiar datos después de sincronizar
            await clearStoredData('pending-location-data');
        }
    } catch (error) {
        console.error('Error en sync de ubicación:', error);
    }
}

// Sincronizar analíticas de rutas
async function syncRouteAnalytics() {
    try {
        const analyticsData = await getStoredData('route-analytics');
        if (analyticsData) {
            console.log('📊 Sincronizando datos de analíticas');
            await clearStoredData('route-analytics');
        }
    } catch (error) {
        console.error('Error en sync de analíticas:', error);
    }
}

// =================== UTILIDADES DE STORAGE ===================
async function getStoredData(key) {
    return new Promise((resolve) => {
        // Simular storage local (en implementación real usar IndexedDB)
        resolve(self.pendingData?.[key] || null);
    });
}

async function clearStoredData(key) {
    if (self.pendingData) {
        delete self.pendingData[key];
    }
}

// =================== NOTIFICACIONES PUSH ===================
self.addEventListener('push', (event) => {
    const options = {
        body: 'Tu ruta ha sido actualizada',
        icon: '/logoagapai-ok2.png',
        badge: '/logoagapai-ok2.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'view',
                title: 'Ver ruta',
                icon: '/pin-verde-destino.png'
            },
            {
                action: 'close',
                title: 'Cerrar',
                icon: '/pin-morado.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Tu Guía Cartagena', options)
    );
});

// =================== CLICK EN NOTIFICACIONES ===================
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/yotellevo.html')
        );
    }
});

console.log('🎯 Service Worker TuGuía cargado - Versión:', CACHE_VERSION); 