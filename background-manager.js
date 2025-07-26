// =================== GESTOR DE SEGUNDO PLANO PARA MÓVILES ===================

class BackgroundManager {
    constructor() {
        this.isSupported = this.checkSupport();
        this.registration = null;
        this.wakeLock = null;
        this.backgroundSyncEnabled = false;
        this.locationWatchId = null;
        this.heartbeatInterval = null;
        
        this.init();
    }
    
    // =================== VERIFICAR SOPORTE ===================
    checkSupport() {
        const support = {
            serviceWorker: 'serviceWorker' in navigator,
            backgroundSync: 'sync' in window.ServiceWorkerRegistration.prototype,
            wakeLock: 'wakeLock' in navigator,
            notification: 'Notification' in window,
            vibration: 'vibrate' in navigator
        };
        
        console.log('📱 Soporte de segundo plano:', support);
        return support;
    }
    
    // =================== INICIALIZACIÓN ===================
    async init() {
        if (!this.isSupported.serviceWorker) {
            console.warn('⚠️ Service Workers no soportados');
            return;
        }
        
        try {
            // Registrar Service Worker
            this.registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ Service Worker registrado');
            
            // Configurar eventos
            this.setupServiceWorkerEvents();
            
            // Solicitar permisos necesarios
            await this.requestPermissions();
            
        } catch (error) {
            console.error('❌ Error registrando Service Worker:', error);
        }
    }
    
    // =================== PERMISOS ===================
    async requestPermissions() {
        // Permiso para notificaciones
        if (this.isSupported.notification && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            console.log('🔔 Permiso de notificaciones:', permission);
        }
        
        // Permiso para ubicación persistente
        if ('permissions' in navigator) {
            try {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                console.log('📍 Permiso de ubicación:', result.state);
            } catch (e) {
                console.log('📍 No se pudo verificar permiso de ubicación');
            }
        }
    }
    
    // =================== WAKE LOCK (MANTENER PANTALLA) ===================
    async requestWakeLock() {
        if (!this.isSupported.wakeLock) {
            console.warn('⚠️ Wake Lock no soportado');
            return false;
        }
        
        try {
            this.wakeLock = await navigator.wakeLock.request('screen');
            console.log('🔆 Wake Lock activado');
            
            // Escuchar cuando se libere
            this.wakeLock.addEventListener('release', () => {
                console.log('🔅 Wake Lock liberado');
                this.wakeLock = null;
            });
            
            return true;
        } catch (error) {
            console.error('❌ Error activando Wake Lock:', error);
            return false;
        }
    }
    
    // Liberar Wake Lock
    async releaseWakeLock() {
        if (this.wakeLock) {
            await this.wakeLock.release();
            this.wakeLock = null;
            console.log('🔅 Wake Lock liberado manualmente');
        }
    }
    
    // =================== TRACKING DE UBICACIÓN EN SEGUNDO PLANO ===================
    async startBackgroundLocationTracking() {
        console.log('🎯 Iniciando tracking de ubicación en segundo plano...');
        
        // Activar Wake Lock para mantener la app activa
        await this.requestWakeLock();
        
        // Configurar geolocalización con alta frecuencia
        if (!navigator.geolocation) {
            console.error('❌ Geolocalización no disponible');
            return false;
        }
        
        const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 1000 // Cache muy corto para datos frescos
        };
        
        this.locationWatchId = navigator.geolocation.watchPosition(
            (position) => this.handleLocationUpdate(position),
            (error) => this.handleLocationError(error),
            options
        );
        
        // Heartbeat para mantener vivo el tracking
        this.startHeartbeat();
        
        // Registrar para background sync
        if (this.isSupported.backgroundSync && this.registration) {
            try {
                await this.registration.sync.register('background-location-sync');
                this.backgroundSyncEnabled = true;
                console.log('✅ Background Sync registrado');
            } catch (error) {
                console.warn('⚠️ Background Sync no disponible:', error);
            }
        }
        
        return true;
    }
    
    // Manejar actualización de ubicación
    handleLocationUpdate(position) {
        const locationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
            speed: position.coords.speed,
            heading: position.coords.heading
        };
        
        // Almacenar para sync posterior
        this.storeLocationData(locationData);
        
        // Notificar a la app principal
        this.notifyLocationUpdate(locationData);
        
        // Verificar si llegó al destino
        this.checkDestinationProximity(locationData);
    }
    
    // Manejar errores de ubicación
    handleLocationError(error) {
        console.error('❌ Error de geolocalización:', error);
        
        // Enviar notificación de error si es crítico
        if (error.code === error.PERMISSION_DENIED) {
            this.showNotification(
                'Error de ubicación',
                'Se necesita permiso de ubicación para la navegación',
                { urgent: true }
            );
        }
    }
    
    // =================== ALMACENAMIENTO PARA SYNC ===================
    storeLocationData(locationData) {
        try {
            // Obtener datos existentes
            const stored = localStorage.getItem('pending-location-data');
            const pendingData = stored ? JSON.parse(stored) : [];
            
            // Agregar nuevo punto
            pendingData.push(locationData);
            
            // Mantener solo últimos 50 puntos para evitar overflow
            if (pendingData.length > 50) {
                pendingData.splice(0, pendingData.length - 50);
            }
            
            // Guardar
            localStorage.setItem('pending-location-data', JSON.stringify(pendingData));
        } catch (error) {
            console.error('Error almacenando datos de ubicación:', error);
        }
    }
    
    // =================== HEARTBEAT PARA MANTENER VIVO ===================
    startHeartbeat() {
        // Heartbeat cada 30 segundos para mantener la app viva
        this.heartbeatInterval = setInterval(() => {
            console.log('💓 Heartbeat - App activa en segundo plano');
            
            // Verificar si el Wake Lock sigue activo
            if (!this.wakeLock) {
                this.requestWakeLock();
            }
            
            // Enviar estadísticas a Service Worker
            if (this.registration && this.registration.active) {
                this.registration.active.postMessage({
                    type: 'HEARTBEAT',
                    timestamp: Date.now(),
                    data: {
                        isTracking: !!this.locationWatchId,
                        hasWakeLock: !!this.wakeLock
                    }
                });
            }
        }, 30000);
    }
    
    // =================== NOTIFICACIONES ===================
    showNotification(title, body, options = {}) {
        if (!this.isSupported.notification || Notification.permission !== 'granted') {
            console.log('📢 Notificación (sin permiso):', title, body);
            return;
        }
        
        const notification = new Notification(title, {
            body,
            icon: '/logoagapai-ok2.png',
            badge: '/logoagapai-ok2.png',
            vibrate: options.urgent ? [200, 100, 200, 100, 200] : [100, 50, 100],
            silent: !options.urgent,
            requireInteraction: options.urgent,
            data: {
                timestamp: Date.now(),
                ...options.data
            }
        });
        
        // Auto-cerrar después de tiempo determinado
        if (!options.urgent) {
            setTimeout(() => notification.close(), 5000);
        }
        
        notification.onclick = () => {
            window.focus();
            notification.close();
            if (options.onClick) options.onClick();
        };
    }
    
    // =================== VERIFICAR PROXIMIDAD AL DESTINO ===================
    checkDestinationProximity(currentLocation) {
        // Obtener destino del estado
        const destination = this.getDestinationFromState();
        if (!destination) return;
        
        // Calcular distancia
        const distance = this.calculateDistance(
            currentLocation.lat, currentLocation.lng,
            destination.lat, destination.lng
        );
        
        console.log(`📏 Distancia al destino: ${distance.toFixed(0)}m`);
        
        // Alertas por proximidad
        if (distance <= 300 && !this.alerted300m) {
            this.alerted300m = true;
            this.showNotification(
                '¡Casi llegas!',
                'Faltan menos de 300 metros para tu destino',
                { urgent: true }
            );
            
            // Vibración fuerte
            if (this.isSupported.vibration) {
                navigator.vibrate([1000, 200, 1000, 200, 1000]);
            }
        }
        
        if (distance <= 50 && !this.alerted50m) {
            this.alerted50m = true;
            this.showNotification(
                '¡Has llegado!',
                'Ya estás en tu destino',
                { 
                    urgent: true,
                    onClick: () => this.stopBackgroundTracking()
                }
            );
            
            // Vibración muy fuerte
            if (this.isSupported.vibration) {
                navigator.vibrate([1500, 300, 1500, 300, 1500]);
            }
        }
    }
    
    // =================== UTILIDADES ===================
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371000; // Radio de la Tierra en metros
        const toRad = (x) => x * Math.PI / 180;
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    getDestinationFromState() {
        try {
            const state = localStorage.getItem('tuguia_state');
            if (state) {
                const data = JSON.parse(state);
                return data.route?.end?.coords ? {
                    lat: data.route.end.coords[0],
                    lng: data.route.end.coords[1]
                } : null;
            }
        } catch (e) {
            console.error('Error obteniendo destino:', e);
        }
        return null;
    }
    
    notifyLocationUpdate(locationData) {
        // Enviar evento a la aplicación principal
        window.dispatchEvent(new CustomEvent('backgroundLocationUpdate', {
            detail: locationData
        }));
    }
    
    // =================== DETENER TRACKING ===================
    async stopBackgroundTracking() {
        console.log('🛑 Deteniendo tracking en segundo plano...');
        
        // Detener geolocalización
        if (this.locationWatchId) {
            navigator.geolocation.clearWatch(this.locationWatchId);
            this.locationWatchId = null;
        }
        
        // Liberar Wake Lock
        await this.releaseWakeLock();
        
        // Detener heartbeat
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        
        // Limpiar flags de alerta
        this.alerted300m = false;
        this.alerted50m = false;
        
        console.log('✅ Tracking detenido');
    }
    
    // =================== CONFIGURAR EVENTOS DEL SERVICE WORKER ===================
    setupServiceWorkerEvents() {
        if (!this.registration) return;
        
        // Escuchar mensajes del Service Worker
        navigator.serviceWorker.addEventListener('message', (event) => {
            const { type, data } = event.data;
            
            switch (type) {
                case 'BACKGROUND_SYNC_SUCCESS':
                    console.log('✅ Sync en segundo plano exitoso');
                    break;
                    
                case 'BACKGROUND_SYNC_FAILED':
                    console.warn('⚠️ Falló sync en segundo plano:', data);
                    break;
            }
        });
        
        // Detectar cuando la app va a segundo plano
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('📱 App enviada a segundo plano');
                this.handleAppBackgrounded();
            } else {
                console.log('📱 App volvió a primer plano');
                this.handleAppForegrounded();
            }
        });
    }
    
    // Manejar cuando la app va a segundo plano
    handleAppBackgrounded() {
        // Asegurar que el tracking siga funcionando
        if (this.locationWatchId) {
            console.log('🎯 Manteniendo tracking activo en segundo plano');
            
            // Enviar mensaje al Service Worker
            if (this.registration && this.registration.active) {
                this.registration.active.postMessage({
                    type: 'APP_BACKGROUNDED',
                    timestamp: Date.now()
                });
            }
        }
    }
    
    // Manejar cuando la app vuelve a primer plano
    handleAppForegrounded() {
        console.log('📱 App volvió a primer plano');
        
        // Notificar al Service Worker
        if (this.registration && this.registration.active) {
            this.registration.active.postMessage({
                type: 'APP_FOREGROUNDED',
                timestamp: Date.now()
            });
        }
        
        // Verificar si hay datos pendientes de sincronizar
        this.syncPendingData();
    }
    
    // Sincronizar datos pendientes
    async syncPendingData() {
        try {
            const pendingData = localStorage.getItem('pending-location-data');
            if (pendingData) {
                const data = JSON.parse(pendingData);
                console.log(`🔄 Sincronizando ${data.length} puntos de ubicación pendientes`);
                
                // Aquí enviarías los datos al servidor
                // Por ahora solo los limpiamos
                localStorage.removeItem('pending-location-data');
            }
        } catch (error) {
            console.error('Error sincronizando datos pendientes:', error);
        }
    }
}

// =================== EXPORTAR Y AUTOREGISTRAR ===================

// Crear instancia global
const backgroundManager = new BackgroundManager();

// Exportar para uso manual
if (typeof window !== 'undefined') {
    window.BackgroundManager = backgroundManager;
}

// Exponer métodos principales globalmente para fácil acceso
window.startBackgroundTracking = () => backgroundManager.startBackgroundLocationTracking();
window.stopBackgroundTracking = () => backgroundManager.stopBackgroundTracking();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackgroundManager;
}

console.log('🚀 Background Manager inicializado'); 