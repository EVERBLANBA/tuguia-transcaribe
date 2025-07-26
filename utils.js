// =================== UTILIDADES COMPARTIDAS ===================

// Configuración global
const CONFIG = {
    ORS_API_KEY: '5b3ce3597851110001cf6248e92a24fdb4744773ab33cab2c808de44',
    GOOGLE_MAPS_KEY: 'AIzaSyBUadVPYtXGXPX1vWMR5nc3lgSrW-FzUls',
    CARTAGENA_BOUNDS: [10.35, -75.56, 10.48, -75.44],
    OVERPASS_URL: 'https://overpass-api.de/api/interpreter',
    NOMINATIM_URL: 'https://nominatim.openstreetmap.org'
};

// Función para calcular distancia entre dos puntos (Haversine)
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radio de la Tierra en metros
    const toRad = x => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Función para obtener ubicación GPS
function obtenerUbicacionGPS() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocalización no soportada'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                resolve({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy
                });
            },
            (error) => {
                reject(new Error(`Error de geolocalización: ${error.message}`));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    });
}

// Función para geocodificación
async function geocodificar(direccion, incluirCartagena = true) {
    try {
        const query = incluirCartagena ? 
            `${direccion}, Cartagena, Colombia` : 
            direccion;
            
        const response = await fetch(
            `${CONFIG.NOMINATIM_URL}/search?format=json&q=${encodeURIComponent(query)}&limit=1`
        );
        const data = await response.json();
        
        if (data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                address: data[0]
            };
        }
        return null;
    } catch (error) {
        console.error('Error en geocodificación:', error);
        return null;
    }
}

// Función para filtrar direcciones de Cartagena
function filtrarDireccionesCartagena(data) {
    const municipios = [
        'cartagena', 'turbaco', 'turbana', 'arjona', 'santa rosa', 
        'villanueva', 'clemencia', 'santa catalina', 'maría la baja', 
        'san estanislao', 'santa lucía', 'bolívar'
    ];
    
    return data.filter(item => {
        const displayName = (item.display_name || '').toLowerCase();
        const address = item.address || {};
        
        return municipios.some(mun =>
            displayName.includes(mun) ||
            (address.city && address.city.toLowerCase().includes(mun)) ||
            (address.town && address.town.toLowerCase().includes(mun)) ||
            (address.village && address.village.toLowerCase().includes(mun)) ||
            (address.state_district && address.state_district.toLowerCase().includes(mun)) ||
            (address.county && address.county.toLowerCase().includes(mun))
        );
    });
}

// Función para formatear direcciones
function formatearDireccionParaPopup(displayName) {
    if (!displayName) return 'Dirección no disponible';
    
    const irrelevantes = [
        'Cartagena de indias', 'Dique', 'Bolívar', 'Colombia',
        '130003', 'Provincia de Cartagena', 'Provincia'
    ];
    
    return displayName
        .split(',')
        .map(part => part.trim())
        .filter(part => !irrelevantes.includes(part))
        .slice(0, 3)
        .join(', ');
}

// Debounce para optimizar búsquedas
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Cache simple para geocodificación
class GeocodingCache {
    constructor(maxSize = 100) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }
    
    get(key) {
        if (this.cache.has(key)) {
            // Mover al final (LRU)
            const value = this.cache.get(key);
            this.cache.delete(key);
            this.cache.set(key, value);
            return value;
        }
        return null;
    }
    
    set(key, value) {
        if (this.cache.size >= this.maxSize) {
            // Eliminar el más antiguo
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }
}

// Instancia global del cache
const geocodingCache = new GeocodingCache();

// Función de geocodificación con cache
async function geocodificarConCache(direccion) {
    const cacheKey = direccion.toLowerCase().trim();
    
    // Buscar en cache
    const cached = geocodingCache.get(cacheKey);
    if (cached) {
        console.log('🗄️ Usando resultado cacheado para:', direccion);
        return cached;
    }
    
    // Geocodificar
    const result = await geocodificar(direccion);
    
    // Guardar en cache si es exitoso
    if (result) {
        geocodingCache.set(cacheKey, result);
    }
    
    return result;
}

// Exportar si se usa como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        haversine,
        obtenerUbicacionGPS,
        geocodificar,
        geocodificarConCache,
        filtrarDireccionesCartagena,
        formatearDireccionParaPopup,
        debounce,
        GeocodingCache
    };
} 