// =================== GESTOR DE ESTADO CENTRALIZADO ===================

class TuGuiaStateManager {
    constructor() {
        this.state = {
            user: {
                currentLocation: null,
                isTrackingLocation: false
            },
            route: {
                start: null,
                end: null,
                startMode: 'ubicacion', // 'ubicacion', 'direccion', 'paradero'
                endMode: 'direccion',   // 'direccion', 'paradero'
                currentRoute: null,
                isActive: false
            },
            transport: {
                nearbyStops: [],
                selectedStop: null,
                availableRoutes: []
            },
            ui: {
                mapCenter: [10.42312, -75.54802],
                mapZoom: 13,
                isMapSelectionMode: false
            }
        };
        
        this.subscribers = new Set();
        this.loadFromStorage();
    }
    
    // Suscribirse a cambios de estado
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }
    
    // Notificar cambios
    notify(path, value) {
        this.subscribers.forEach(callback => {
            callback(path, value, this.state);
        });
    }
    
    // Actualizar estado
    setState(path, value) {
        const keys = path.split('.');
        let current = this.state;
        
        // Navegar hasta el penúltimo nivel
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
        }
        
        // Actualizar valor
        const lastKey = keys[keys.length - 1];
        const oldValue = current[lastKey];
        current[lastKey] = value;
        
        // Persistir cambios importantes
        this.saveToStorage();
        
        // Notificar cambio
        this.notify(path, value);
        
        console.log(`🔄 Estado actualizado: ${path}`, { oldValue, newValue: value });
    }
    
    // Obtener estado
    getState(path) {
        if (!path) return this.state;
        
        const keys = path.split('.');
        let current = this.state;
        
        for (const key of keys) {
            if (current[key] === undefined) return undefined;
            current = current[key];
        }
        
        return current;
    }
    
    // Validar coordenadas
    validateCoordinates(coords) {
        if (!coords || !Array.isArray(coords) || coords.length !== 2) return false;
        const [lat, lng] = coords;
        return typeof lat === 'number' && typeof lng === 'number' &&
               lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }
    
    // Establecer punto de inicio
    setStartPoint(point, mode = 'direccion') {
        const validated = this.validateAndFormatPoint(point);
        if (validated) {
            this.setState('route.start', validated);
            this.setState('route.startMode', mode);
        }
    }
    
    // Establecer punto de destino
    setEndPoint(point, mode = 'direccion') {
        const validated = this.validateAndFormatPoint(point);
        if (validated) {
            this.setState('route.end', validated);
            this.setState('route.endMode', mode);
        }
    }
    
    // Validar y formatear punto
    validateAndFormatPoint(point) {
        if (!point) return null;
        
        // Si es string, intentar parsear
        if (typeof point === 'string') {
            try {
                point = JSON.parse(point);
            } catch (e) {
                console.warn('⚠️ No se pudo parsear punto:', point);
                return null;
            }
        }
        
        // Validar estructura
        if (point.coords && this.validateCoordinates(point.coords)) {
            return {
                coords: point.coords,
                nombre: point.nombre || point.name || 'Punto seleccionado',
                timestamp: Date.now()
            };
        }
        
        return null;
    }
    
    // Obtener ruta completa
    getRoute() {
        return {
            start: this.getState('route.start'),
            end: this.getState('route.end'),
            startMode: this.getState('route.startMode'),
            endMode: this.getState('route.endMode'),
            isComplete: this.isRouteComplete()
        };
    }
    
    // Verificar si la ruta está completa
    isRouteComplete() {
        const start = this.getState('route.start');
        const end = this.getState('route.end');
        return start && end && 
               this.validateCoordinates(start.coords) && 
               this.validateCoordinates(end.coords);
    }
    
    // Limpiar ruta
    clearRoute() {
        this.setState('route.start', null);
        this.setState('route.end', null);
        this.setState('route.currentRoute', null);
        this.setState('route.isActive', false);
        this.clearStorage();
    }
    
    // Guardar en localStorage
    saveToStorage() {
        try {
            const dataToSave = {
                route: this.getState('route'),
                timestamp: Date.now()
            };
            localStorage.setItem('tuguia_state', JSON.stringify(dataToSave));
        } catch (e) {
            console.error('❌ Error guardando estado:', e);
        }
    }
    
    // Cargar desde localStorage
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('tuguia_state');
            if (saved) {
                const data = JSON.parse(saved);
                
                // Verificar que no sea muy viejo (24 horas)
                const age = Date.now() - (data.timestamp || 0);
                if (age < 24 * 60 * 60 * 1000) {
                    if (data.route) {
                        Object.assign(this.state.route, data.route);
                    }
                    console.log('✅ Estado cargado desde localStorage');
                } else {
                    this.clearStorage();
                }
            }
        } catch (e) {
            console.error('❌ Error cargando estado:', e);
            this.clearStorage();
        }
    }
    
    // Limpiar localStorage
    clearStorage() {
        try {
            localStorage.removeItem('tuguia_state');
            // Limpiar también claves legacy
            localStorage.removeItem('tuguia_start');
            localStorage.removeItem('tuguia_end');
            localStorage.removeItem('tuguia_start_mode');
            localStorage.removeItem('tuguia_end_mode');
        } catch (e) {
            console.error('❌ Error limpiando localStorage:', e);
        }
    }
    
    // Migrar datos legacy
    migrateLegacyData() {
        try {
            const legacyStart = localStorage.getItem('tuguia_start');
            const legacyEnd = localStorage.getItem('tuguia_end');
            const legacyStartMode = localStorage.getItem('tuguia_start_mode');
            const legacyEndMode = localStorage.getItem('tuguia_end_mode');
            
            if (legacyStart) {
                this.setStartPoint(legacyStart, legacyStartMode || 'direccion');
            }
            
            if (legacyEnd) {
                this.setEndPoint(legacyEnd, legacyEndMode || 'direccion');
            }
            
            // Limpiar datos legacy después de migrar
            if (legacyStart || legacyEnd) {
                this.clearStorage();
                this.saveToStorage();
                console.log('✅ Datos legacy migrados');
            }
        } catch (e) {
            console.error('❌ Error migrando datos legacy:', e);
        }
    }
}

// Crear instancia global
const stateManager = new TuGuiaStateManager();

// Exportar
if (typeof window !== 'undefined') {
    window.TuGuiaState = stateManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TuGuiaStateManager;
} 