// =================== GESTOR DE SEGUNDO PLANO PARA MÓVILES ===================
// VERSIÓN INTELIGENTE - SOLUCIÓN SISTEMÁTICA

class BackgroundManager {
    constructor() {
        // Verificar si ya existe una instancia para evitar duplicados
        if (window.backgroundManager) {
            console.log('⚠️ BackgroundManager ya existe, retornando instancia existente');
            return window.backgroundManager;
        }
        
        this.isSupported = this.checkSupport();
        this.registration = null;
        this.wakeLock = null;
        this.backgroundSyncEnabled = false;
        this.locationWatchId = null;
        this.heartbeatInterval = null;
        this.notificationPermission = 'default';
        this.isInitialized = false;
        this.alerted300m = false;
        this.alerted50m = false;
        this.autoMode = false;
        this.maxRetries = 3;
        this.retryCount = 0;
        
        // Registrar esta instancia globalmente
        window.backgroundManager = this;
        
        console.log('🚀 Background Manager creado (modo inteligente)');
    }
    
    // =================== VERIFICAR SOPORTE INTELIGENTE ===================
    checkSupport() {
        const support = {
            serviceWorker: 'serviceWorker' in navigator,
            backgroundSync: 'sync' in window.ServiceWorkerRegistration?.prototype || false,
            wakeLock: 'wakeLock' in navigator,
            notification: 'Notification' in window,
            vibration: 'vibrate' in navigator,
            permissions: 'permissions' in navigator,
            geolocation: this.checkGeolocationSupport()
        };
        
        console.log('📱 Soporte de segundo plano:', support);
        return support;
    }
    
    // =================== INICIALIZACIÓN INTELIGENTE ===================
    async init() {
        if (this.isInitialized) {
            console.log('✅ Background Manager ya inicializado');
            return true;
        }
        
        console.log('🚀 Inicializando Background Manager (modo inteligente)...');
        
        // Verificar soporte crítico
        if (!this.isSupported.serviceWorker) {
            console.warn('⚠️ Service Workers no soportados - continuando sin SW');
            // Continuar sin Service Worker
        }
        
        try {
            // Registrar Service Worker solo si está soportado
            if (this.isSupported.serviceWorker) {
                this.registration = await this.registerServiceWorker();
                if (this.registration) {
                    console.log('✅ Service Worker registrado correctamente');
                    this.setupServiceWorkerEvents();
                } else {
                    console.warn('⚠️ Service Worker no registrado - continuando sin SW');
                }
            }
            
            // Solicitar permisos necesarios
            await this.requestPermissions();
            
            // Configurar listeners de visibilidad
            this.setupVisibilityListeners();
            
            this.isInitialized = true;
            console.log('✅ Background Manager inicializado correctamente');
            
            // Emitir evento de inicialización
            window.dispatchEvent(new CustomEvent('backgroundManagerReady', {
                detail: { manager: this }
            }));
            
            return true;
            
        } catch (error) {
            console.error('❌ Error en inicialización del Background Manager:', error);
            return false;
        }
    }
    
    // =================== REGISTRO DE SERVICE WORKER INTELIGENTE ===================
    async registerServiceWorker() {
        try {
            // Verificar si ya hay un Service Worker registrado
            const existingRegistration = await navigator.serviceWorker.getRegistration();
            if (existingRegistration) {
                console.log('✅ Service Worker ya registrado');
                return existingRegistration;
            }
            
            // Verificar si el archivo sw.js existe
            const swResponse = await fetch('./sw.js', { method: 'HEAD' });
            if (!swResponse.ok) {
                console.warn('⚠️ sw.js no encontrado - continuando sin Service Worker');
                return null;
            }
            
            const registration = await navigator.serviceWorker.register('./sw.js', {
                scope: './',
                updateViaCache: 'none'
            });
            
            // Esperar a que el Service Worker esté listo
            await navigator.serviceWorker.ready;
            
            return registration;
            
        } catch (error) {
            console.error('❌ Error registrando Service Worker:', error);
            return null;
        }
    }
    
    // =================== PERMISOS INTELIGENTES ===================
    async requestPermissions() {
        // Permiso para notificaciones
        if (this.isSupported.notification) {
            this.notificationPermission = Notification.permission;
            
            if (this.notificationPermission === 'default') {
                try {
                    this.notificationPermission = await Notification.requestPermission();
                    console.log('🔔 Permiso de notificaciones:', this.notificationPermission);
                } catch (error) {
                    console.error('❌ Error solicitando permisos de notificación:', error);
                }
            }
        }
        
        // Permiso para ubicación
        if (this.isSupported.permissions) {
            try {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                console.log('📍 Permiso de ubicación:', result.state);
            } catch (e) {
                console.log('📍 No se pudo verificar permiso de ubicación');
            }
        }
    }
    
    // =================== LISTENERS DE VISIBILIDAD ===================
    setupVisibilityListeners() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('📱 App en segundo plano (modo inteligente)');
            } else {
                console.log('📱 App en primer plano (modo inteligente)');
            }
        });
        
        window.addEventListener('beforeunload', () => {
            this.handleAppClosing();
        });
    }
    
    // =================== MANEJO DE CIERRE DE APP ===================
    handleAppClosing() {
        console.log('🚪 App cerrando, guardando estado...');
        
        if (this.locationWatchId) {
            this.stopBackgroundTracking();
        }
        
        this.releaseWakeLock();
    }
    
    // =================== WAKE LOCK ===================
    async requestWakeLock() {
        if (!this.isSupported.wakeLock) {
            console.warn('⚠️ Wake Lock no soportado');
            return false;
        }
        
        try {
            this.wakeLock = await navigator.wakeLock.request('screen');
            console.log('🔆 Wake Lock activado');
            return true;
        } catch (error) {
            console.error('❌ Error activando Wake Lock:', error);
            return false;
        }
    }
    
    async releaseWakeLock() {
        if (this.wakeLock) {
            await this.wakeLock.release();
            this.wakeLock = null;
            console.log('🔅 Wake Lock liberado');
        }
    }
    
    // =================== TRACKING DE UBICACIÓN ===================
    async startBackgroundLocationTracking() {
        console.log('🎯 Iniciando tracking de ubicación...');
        
        if (this.locationWatchId) {
            console.log('⚠️ Tracking ya activo');
            return true;
        }
        
        if (!this.isInitialized) {
            console.log('⚠️ Background Manager no inicializado. Inicializando...');
            const initialized = await this.init();
            if (!initialized) {
                console.error('❌ No se pudo inicializar Background Manager');
                return false;
            }
        }
        
        await this.requestWakeLock();
        
        if (!navigator.geolocation) {
            console.error('❌ Geolocalización no disponible');
            return false;
        }
        
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 2000
        };
        
        this.locationWatchId = navigator.geolocation.watchPosition(
            (position) => this.handleLocationUpdate(position),
            (error) => this.handleLocationError(error),
            options
        );
        
        if (!this.heartbeatInterval) {
            this.startHeartbeat();
        }
        
        console.log('✅ Tracking de ubicación iniciado correctamente');
        return true;
    }
    
    handleLocationUpdate(position) {
        const locationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
        };
        
        this.storeLocationData(locationData);
        this.notifyLocationUpdate(locationData);
        this.checkDestinationProximity(locationData);
    }
    
    handleLocationError(error) {
        console.error('❌ Error de geolocalización:', error);
    }
    
    storeLocationData(locationData) {
        try {
            const stored = localStorage.getItem('pending-location-data');
            const pendingData = stored ? JSON.parse(stored) : [];
            pendingData.push(locationData);
            
            if (pendingData.length > 50) {
                pendingData.splice(0, pendingData.length - 50);
            }
            
            localStorage.setItem('pending-location-data', JSON.stringify(pendingData));
        } catch (error) {
            console.error('Error almacenando datos de ubicación:', error);
        }
    }
    
    // =================== HEARTBEAT INTELIGENTE ===================
    startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        
        this.heartbeatInterval = setInterval(() => {
            const now = Date.now();
            console.log(`💓 Heartbeat: ${new Date(now).toLocaleTimeString()}`);
            
            if (this.locationWatchId === null) {
                // Intento de auto-recuperación del tracking
                if (this.retryCount < this.maxRetries) {
                    console.warn('⚠️ Tracking perdido - reintentando iniciar tracking (auto)');
                    this.startBackgroundLocationTracking()
                        .then((ok) => {
                            if (ok) {
                                console.log('✅ Tracking reestablecido automáticamente');
                                this.retryCount = 0;
                            } else {
                                this.retryCount++;
                                console.warn(`⚠️ Reintento de tracking fallido (${this.retryCount}/${this.maxRetries})`);
                            }
                        })
                        .catch(() => {
                            this.retryCount++;
                            console.warn(`⚠️ Reintento de tracking lanzó error (${this.retryCount}/${this.maxRetries})`);
                        });
                } else {
                    console.warn('⚠️ Tracking perdido - se alcanzó el máximo de reintentos automáticos');
                }
            }
            
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'HEARTBEAT',
                    timestamp: now,
                    tracking: this.isTracking()
                });
            }
        }, 30000);
        
        console.log('💓 Heartbeat iniciado - cada 30 segundos');
    }
    
    // =================== NOTIFICACIONES ===================
    showNotification(title, body, options = {}) {
        if (!this.isSupported.notification || this.notificationPermission !== 'granted') {
            console.log('📢 Notificación (sin permiso):', title, body);
            return;
        }

        const commonOptions = {
            body,
            icon: options.icon || './logoagapai-ok2.png',
            badge: options.badge || './pin-verde-destino.png',
            vibrate: options.vibrate || (options.urgent ? [200, 100, 200, 100, 200] : [100, 50, 100]),
            silent: options.silent ?? !options.urgent,
            requireInteraction: !!options.urgent,
            tag: options.tag || (options.urgent ? 'urgent' : 'info'),
            data: options.data || {}
        };

        // Si hay Service Worker y es una notificación urgente, preferir SW
        if (options.urgent && this.registration && typeof this.registration.showNotification === 'function') {
            const swOptions = { ...commonOptions };
            if (options.actions) swOptions.actions = options.actions;
            else {
                swOptions.actions = [
                    { action: 'open', title: 'Abrir', icon: './pin-verde-destino.png' },
                    { action: 'stop_tracking', title: 'Detener seguimiento', icon: './pin-morado.png' }
                ];
            }
            this.registration.showNotification(title, swOptions).catch((e) => {
                console.warn('⚠️ Fallback a Notification API por error en SW:', e);
                const n = new Notification(title, commonOptions);
                if (!options.urgent) setTimeout(() => n.close(), 5000);
                n.onclick = () => { window.focus(); n.close(); };
            });
            return;
        }

        // Fallback: API de notificaciones en la página
        const notification = new Notification(title, commonOptions);
        if (!options.urgent) {
            setTimeout(() => notification.close(), 5000);
        }
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
    
    // =================== VERIFICAR PROXIMIDAD ===================
    checkDestinationProximity(currentLocation) {
        const destination = this.getDestinationFromState();
        if (!destination) return;
        
        const distance = this.calculateDistance(
            currentLocation.lat, currentLocation.lng,
            destination.lat, destination.lng
        );
        
        console.log(`📏 Distancia al destino: ${distance.toFixed(0)}m`);
        
        if (distance <= 300 && !this.alerted300m) {
            this.alerted300m = true;
            console.log('🚨 ¡ALERTA DE PROXIMIDAD! Faltan menos de 300 metros');
            
            this.showNotification(
                '¡Casi llegas!',
                `Faltan ${distance.toFixed(0)} metros para tu destino`,
                { urgent: true }
            );
            
            if (this.isSupported.vibration) {
                navigator.vibrate([1000, 200, 1000, 200, 1000]);
            }
        }
        
        if (distance <= 50 && !this.alerted50m) {
            this.alerted50m = true;
            console.log('🎉 ¡HAS LLEGADO! Ya estás en tu destino');
            
            this.showNotification(
                '¡Has llegado!',
                'Ya estás en tu destino',
                { urgent: true }
            );
            
            if (this.isSupported.vibration) {
                navigator.vibrate([1500, 300, 1500, 300, 1500]);
            }
            
            setTimeout(() => {
                this.stopBackgroundTracking();
            }, 10000);
        }
    }
    
    // =================== CONFIGURAR DESTINO ===================
    setDestination(lat, lng, description = '') {
        try {
            localStorage.setItem('destino_lat', lat.toString());
            localStorage.setItem('destino_lng', lng.toString());
            localStorage.setItem('destino_descripcion', description);
            
            window.destinoCoords = [lat, lng];
            window.destinoDescripcion = description;
            
            this.alerted300m = false;
            this.alerted50m = false;
            
            console.log('📍 Destino configurado:', { lat, lng, description });
            
            const state = {
                route: {
                    end: {
                        coords: [lat, lng],
                        description: description
                    }
                },
                timestamp: Date.now()
            };
            localStorage.setItem('tuguia_state', JSON.stringify(state));
            
            return true;
        } catch (error) {
            console.error('❌ Error configurando destino:', error);
            return false;
        }
    }
    
    // =================== UTILIDADES ===================
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371000;
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
                if (data.route?.end?.coords) {
                    return {
                        lat: data.route.end.coords[0],
                        lng: data.route.end.coords[1]
                    };
                }
            }
            
            if (window.endMarker) {
                const latLng = window.endMarker.getLatLng();
                return {
                    lat: latLng.lat,
                    lng: latLng.lng
                };
            }
            
            if (window.destinoCoords && window.destinoCoords.length === 2) {
                return {
                    lat: window.destinoCoords[0],
                    lng: window.destinoCoords[1]
                };
            }
            
            const destinoLat = localStorage.getItem('destino_lat');
            const destinoLng = localStorage.getItem('destino_lng');
            if (destinoLat && destinoLng) {
                return {
                    lat: parseFloat(destinoLat),
                    lng: parseFloat(destinoLng)
                };
            }
            
            return null;
        } catch (error) {
            console.error('❌ Error obteniendo destino del estado:', error);
            return null;
        }
    }
    
    notifyLocationUpdate(locationData) {
        window.dispatchEvent(new CustomEvent('backgroundLocationUpdate', {
            detail: locationData
        }));
    }
    
    // =================== DETENER TRACKING ===================
    async stopBackgroundTracking() {
        console.log('🛑 Deteniendo tracking...');
        
        if (this.locationWatchId) {
            navigator.geolocation.clearWatch(this.locationWatchId);
            this.locationWatchId = null;
        }
        
        await this.releaseWakeLock();
        
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        
        this.alerted300m = false;
        this.alerted50m = false;
        
        console.log('✅ Tracking detenido');
    }
    
    // =================== CONFIGURAR EVENTOS DEL SERVICE WORKER ===================
    setupServiceWorkerEvents() {
        if (!this.registration) return;
        
        navigator.serviceWorker.addEventListener('message', (event) => {
            const { type, data } = event.data;
            
            switch (type) {
                case 'BACKGROUND_SYNC_SUCCESS':
                    console.log('✅ Sync en segundo plano exitoso');
                    break;
                case 'BACKGROUND_SYNC_FAILED':
                    console.warn('⚠️ Falló sync en segundo plano:', data);
                    break;
                case 'NOTIFICATION_CLICKED':
                    console.log('👆 Notificación clickeada:', data);
                    break;
                case 'STOP_TRACKING':
                    console.log('🛑 Solicitud de detener tracking recibida desde SW');
                    this.stopBackgroundTracking();
                    break;
            }
        });
    }
    
    // =================== MÉTODOS PÚBLICOS ===================
    async startTracking() {
        console.log('🎯 Iniciando tracking manual...');
        
        const destination = this.getDestinationFromState();
        if (!destination) {
            console.warn('⚠️ No hay destino configurado');
            return false;
        }
        
        return await this.startBackgroundLocationTracking();
    }
    
    async stopTracking() {
        console.log('🛑 Deteniendo tracking manual...');
        await this.stopBackgroundTracking();
    }
    
    isTracking() {
        return this.locationWatchId !== null;
    }
    
    getPermissionStatus() {
        return {
            notification: this.notificationPermission,
            geolocation: this.isSupported.geolocation ? 'supported' : 'not_supported',
            serviceWorker: this.registration ? 'registered' : 'not_registered',
            wakeLock: this.isSupported.wakeLock ? 'supported' : 'not_supported',
            vibration: this.isSupported.vibration ? 'supported' : 'not_supported'
        };
    }
    
    checkGeolocationSupport() {
        if (!navigator.geolocation) return false;
        
        const hasGetCurrentPosition = typeof navigator.geolocation.getCurrentPosition === 'function';
        const hasWatchPosition = typeof navigator.geolocation.watchPosition === 'function';
        const hasClearWatch = typeof navigator.geolocation.clearWatch === 'function';
        
        return hasGetCurrentPosition && hasWatchPosition && hasClearWatch;
    }
    
    async testNotification() {
        if (this.notificationPermission === 'granted') {
            this.showNotification(
                'Tu Guía Cartagena',
                'Esta es una notificación de prueba',
                {
                    icon: './logoagapai-ok2.png',
                    badge: './pin-verde-destino.png',
                    tag: 'test'
                }
            );
            return true;
        } else {
            console.warn('⚠️ Permisos de notificación no otorgados');
            return false;
        }
    }
    
    async testProximityNotification() {
        console.log('🧪 Probando notificación de proximidad...');
        
        const currentLocation = {
            lat: 10.397562,
            lng: -75.559672
        };
        
        const testDestination = {
            lat: 10.400000,
            lng: -75.560000
        };
        
        this.setDestination(testDestination.lat, testDestination.lng, 'Destino de Prueba');
        this.checkDestinationProximity(currentLocation);
        
        console.log('✅ Prueba de proximidad completada');
    }
    
    async testArrivalNotification() {
        console.log('🧪 Probando notificación de llegada...');
        
        const currentLocation = {
            lat: 10.400001,
            lng: -75.560001
        };
        
        const testDestination = {
            lat: 10.400000,
            lng: -75.560000
        };
        
        this.setDestination(testDestination.lat, testDestination.lng, 'Destino de Prueba');
        this.checkDestinationProximity(currentLocation);
        
        console.log('✅ Prueba de llegada completada');
    }
    
    debugDestination() {
        const destination = this.getDestinationFromState();
        console.log('📍 Destino actual:', destination);
        return destination;
    }
    
    debugLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log('📍 Ubicación actual:', {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    console.error('❌ Error obteniendo ubicación:', error);
                },
                { timeout: 10000 }
            );
        } else {
            console.log('❌ Geolocalización no soportada');
        }
    }
}

// =================== INICIALIZACIÓN GLOBAL INTELIGENTE ===================

// Crear instancia global solo si no existe
if (typeof window !== 'undefined' && !window.backgroundManager) {
    window.backgroundManager = new BackgroundManager();
    
    // Exponer métodos útiles globalmente
    window.startBackgroundTracking = () => window.backgroundManager.startTracking();
    window.stopBackgroundTracking = () => window.backgroundManager.stopTracking();
    window.isBackgroundTracking = () => window.backgroundManager.isTracking();
    window.testNotification = () => window.backgroundManager.testNotification();
    window.getPermissionStatus = () => window.backgroundManager.getPermissionStatus();
    window.testProximityNotification = () => window.backgroundManager.testProximityNotification();
    window.testArrivalNotification = () => window.backgroundManager.testArrivalNotification();
    window.debugDestination = () => window.backgroundManager.debugDestination();
    window.debugLocation = () => window.backgroundManager.debugLocation();
    window.setDestination = (lat, lng, desc) => window.backgroundManager.setDestination(lat, lng, desc);
    
    window.getCompleteStatus = () => {
        if (!window.backgroundManager) return null;
        
        const bm = window.backgroundManager;
        const status = bm.getPermissionStatus();
        const isTracking = bm.isTracking();
        
        return {
            notification: status.notification,
            geolocation: status.geolocation,
            serviceWorker: status.serviceWorker,
            wakeLock: status.wakeLock,
            vibration: status.vibration,
            tracking: isTracking,
            browserSupport: bm.isSupported,
            watchId: bm.locationWatchId,
            registration: bm.registration ? 'Registrado' : 'No registrado',
            heartbeatInterval: bm.heartbeatInterval ? 'Activo' : 'Inactivo'
        };
    };
}

console.log('🚀 Background Manager inicializado (modo inteligente)'); 