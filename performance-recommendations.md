# 🚀 Recomendaciones de Optimización - Tu Guía Cartagena

## 1. 📊 **Carga de datos GeoJSON**

### Problema actual:
```javascript
// Se carga en cada página
fetch('rutas_transcaribe.geojson')
    .then(response => response.json())
    .then(data => {
        window.rutasTranscaribe = data.features;
    });
```

### ✅ Solución optimizada:
```javascript
class DataManager {
    constructor() {
        this.cache = new Map();
        this.loading = new Map();
    }
    
    async loadGeoJSON(filename) {
        if (this.cache.has(filename)) {
            return this.cache.get(filename);
        }
        
        if (this.loading.has(filename)) {
            return this.loading.get(filename);
        }
        
        const promise = fetch(filename)
            .then(response => response.json())
            .then(data => {
                this.cache.set(filename, data);
                this.loading.delete(filename);
                return data;
            });
        
        this.loading.set(filename, promise);
        return promise;
    }
}
```

## 2. 🗺️ **Optimización de mapas**

### Problema: Múltiples instancias de mapas
- `index.html`: 1 mapa principal
- `yotellevo.html`: 2 mapas adicionales

### ✅ Solución:
- Lazy loading de mapas
- Reutilizar instancias
- Destruir mapas al cambiar de página

```javascript
class MapManager {
    constructor() {
        this.maps = new Map();
    }
    
    createMap(containerId, options = {}) {
        if (this.maps.has(containerId)) {
            return this.maps.get(containerId);
        }
        
        const map = L.map(containerId, {
            center: options.center || [10.42312, -75.54802],
            zoom: options.zoom || 13,
            zoomControl: true,
            ...options
        });
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        this.maps.set(containerId, map);
        return map;
    }
    
    destroyMap(containerId) {
        const map = this.maps.get(containerId);
        if (map) {
            map.remove();
            this.maps.delete(containerId);
        }
    }
}
```

## 3. 🔍 **Optimización de búsquedas**

### Problema: Búsquedas sin debounce
```javascript
input.addEventListener('input', function() {
    // Se ejecuta en cada tecla
    buscarDirecciones(this.value);
});
```

### ✅ Solución con debounce:
```javascript
const debouncedSearch = debounce(async (query) => {
    if (query.length < 3) return;
    
    const results = await searchAddresses(query);
    displaySuggestions(results);
}, 300);

input.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
});
```

## 4. 📱 **Optimización móvil**

### CSS optimizado:
```css
/* Usar will-change para animaciones suaves */
.vehicle-marker {
    will-change: transform;
    transform: translateZ(0); /* Forzar aceleración hardware */
}

/* Optimizar transiciones */
.search-input {
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

/* Reducir repaints */
.suggestions {
    contain: layout style paint;
}
```

## 5. 🔄 **Gestión de memoria**

### Limpiar event listeners:
```javascript
class ComponentManager {
    constructor() {
        this.cleanup = [];
    }
    
    addListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.cleanup.push(() => element.removeEventListener(event, handler));
    }
    
    destroy() {
        this.cleanup.forEach(fn => fn());
        this.cleanup = [];
    }
}
```

## 6. 📊 **Métricas de rendimiento**

### Implementar monitoreo:
```javascript
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            pageLoad: 0,
            apiCalls: [],
            userInteractions: []
        };
    }
    
    startTimer(name) {
        return performance.now();
    }
    
    endTimer(startTime, name) {
        const duration = performance.now() - startTime;
        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
        return duration;
    }
    
    trackApiCall(url, duration, success) {
        this.metrics.apiCalls.push({
            url,
            duration,
            success,
            timestamp: Date.now()
        });
    }
}
```

## 7. 🗃️ **Cache strategies**

### Service Worker para cache offline:
```javascript
// sw.js
const CACHE_NAME = 'tuguia-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/yotellevo.html',
    '/rutas_transcaribe.geojson',
    '/paraderos.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});
```

## 8. 📡 **Optimización de APIs**

### Batch requests para múltiples geocodificaciones:
```javascript
class BatchGeocoder {
    constructor(batchSize = 5, delay = 1000) {
        this.queue = [];
        this.batchSize = batchSize;
        this.delay = delay;
        this.processing = false;
    }
    
    async geocode(address) {
        return new Promise((resolve, reject) => {
            this.queue.push({ address, resolve, reject });
            this.processBatch();
        });
    }
    
    async processBatch() {
        if (this.processing || this.queue.length === 0) return;
        
        this.processing = true;
        const batch = this.queue.splice(0, this.batchSize);
        
        try {
            const results = await Promise.allSettled(
                batch.map(item => this.singleGeocode(item.address))
            );
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    batch[index].resolve(result.value);
                } else {
                    batch[index].reject(result.reason);
                }
            });
        } catch (error) {
            batch.forEach(item => item.reject(error));
        }
        
        this.processing = false;
        
        // Procesar siguiente batch con delay
        if (this.queue.length > 0) {
            setTimeout(() => this.processBatch(), this.delay);
        }
    }
}
```

## 9. 🎯 **Métricas objetivo**

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **First Input Delay**: < 100ms
- **Cumulative Layout Shift**: < 0.1

## 10. 🔧 **Herramientas de monitoreo**

```javascript
// Implementar Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
``` 