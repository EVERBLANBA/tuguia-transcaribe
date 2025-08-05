// =================== GESTOR DE SEGUNDO PLANO PARA MÓVILES ===================

class BackgroundManager {
    constructor() {
        this.isSupported = this.checkSupport();
        this.registration = null;
        this.wakeLock = null;
        this.backgroundSyncEnabled = false;
        this.locationWatchId = null;
        this.heartbeatInterval = null;
        this.notificationPermission = 'default';
        
        this.init();
    }
    
    // =================== VERIFICAR SOPORTE ===================
    checkSupport() {
        const support = {
            serviceWorker: 'serviceWorker' in navigator,
            backgroundSync: 'sync' in window.ServiceWorkerRegistration.prototype,
            wakeLock: 'wakeLock' in navigator,
            notification: 'Notification' in window,
            vibration: 'vibrate' in navigator,
            permissions: 'permissions' in navigator,
            geolocation: this.checkGeolocationSupport()
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
            // Registrar Service Worker con manejo de errores mejorado
            this.registration = await this.registerServiceWorker();
            
            if (this.registration) {
                console.log('✅ Service Worker registrado correctamente');
                
                // Configurar eventos
                this.setupServiceWorkerEvents();
                
                // Solicitar permisos necesarios
                await this.requestPermissions();
                
                // Configurar listeners de visibilidad
                this.setupVisibilityListeners();
                
            } else {
                console.error('❌ No se pudo registrar el Service Worker');
            }
            
        } catch (error) {
            console.error('❌ Error en inicialización del Background Manager:', error);
        }
    }
    
    // =================== REGISTRO DE SERVICE WORKER MEJORADO ===================
    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js', {
                scope: './',
                updateViaCache: 'none'
            });
            
            // Esperar a que el Service Worker esté listo
            await navigator.serviceWorker.ready;
            
            // Verificar si hay una nueva versión
            registration.addEventListener('updatefound', () => {
                console.log('🔄 Nueva versión del Service Worker disponible');
                const newWorker = registration.installing;
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('📱 Nueva versión instalada, actualizar para aplicar cambios');
                        // Aquí se podría mostrar un mensaje al usuario para actualizar
                    }
                });
            });
            
            return registration;
            
        } catch (error) {
            console.error('❌ Error registrando Service Worker:', error);
            return null;
        }
    }
    
    // =================== PERMISOS MEJORADOS ===================
    async requestPermissions() {
        // Permiso para notificaciones con manejo mejorado
        if (this.isSupported.notification) {
            this.notificationPermission = Notification.permission;
            
            if (this.notificationPermission === 'default') {
                try {
                    this.notificationPermission = await Notification.requestPermission();
                    console.log('🔔 Permiso de notificaciones:', this.notificationPermission);
                    
                    if (this.notificationPermission === 'granted') {
                        // Configurar notificaciones por defecto
                        this.setupDefaultNotifications();
                    }
                } catch (error) {
                    console.error('❌ Error solicitando permisos de notificación:', error);
                }
            }
        }
        
        // Permiso para ubicación persistente
        if (this.isSupported.permissions) {
            try {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                console.log('📍 Permiso de ubicación:', result.state);
                
                // Escuchar cambios en el permiso
                result.addEventListener('change', () => {
                    console.log('📍 Cambio en permiso de ubicación:', result.state);
                });
            } catch (e) {
                console.log('📍 No se pudo verificar permiso de ubicación');
            }
        }
    }
    
    // =================== CONFIGURACIÓN DE NOTIFICACIONES POR DEFECTO ===================
    setupDefaultNotifications() {
        // Notificación de bienvenida
        if (this.notificationPermission === 'granted') {
            this.showNotification(
                'Tu Guía Cartagena',
                '¡Bienvenido! Tu aplicación está lista para navegar',
                {
                    icon: './logoagapai-ok2.png',
                    badge: './pin-verde-destino.png',
                    tag: 'welcome'
                }
            );
        }
    }
    
    // =================== LISTENERS DE VISIBILIDAD ===================
    setupVisibilityListeners() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handleAppBackgrounded();
            } else {
                this.handleAppForegrounded();
            }
        });
        
        // Detectar cuando la app se cierra
        window.addEventListener('beforeunload', () => {
            this.handleAppClosing();
        });
    }
    
    // =================== MANEJO DE CIERRE DE APP ===================
    handleAppClosing() {
        console.log('🚪 App cerrando, guardando estado...');
        
        // Guardar estado actual
        if (window.TuGuiaState) {
            window.TuGuiaState.saveToStorage();
        }
        
        // Detener tracking si está activo
        if (this.locationWatchId) {
            this.stopBackgroundTracking();
        }
        
        // Liberar Wake Lock
        this.releaseWakeLock();
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
        if (!this.isSupported.notification || this.notificationPermission !== 'granted') {
            console.log('📢 Notificación (sin permiso):', title, body);
            return;
        }
        
        const notification = new Notification(title, {
            body,
            icon: options.icon || '/logoagapai-ok2.png',
            badge: options.badge || '/logoagapai-ok2.png',
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
        if (!destination) {
            console.log('⚠️ No hay destino configurado para verificar proximidad');
            return;
        }
        
        // Calcular distancia
        const distance = this.calculateDistance(
            currentLocation.lat, currentLocation.lng,
            destination.lat, destination.lng
        );
        
        console.log(`📏 Distancia al destino: ${distance.toFixed(0)}m`);
        
        // Alertas por proximidad
        if (distance <= 300 && !this.alerted300m) {
            this.alerted300m = true;
            console.log('🚨 ¡ALERTA DE PROXIMIDAD! Faltan menos de 300 metros');
            
            // Usar notification manager si está disponible
            if (window.notificationManager) {
                window.notificationManager.showProximityNotification(distance);
            } else {
                // Fallback al método local
                this.showNotification(
                    '¡Casi llegas!',
                    `Faltan ${distance.toFixed(0)} metros para tu destino`,
                    { urgent: true }
                );
            }
            
            // Vibración fuerte
            if (this.isSupported.vibration) {
                navigator.vibrate([1000, 200, 1000, 200, 1000]);
            }
        }
        
        if (distance <= 50 && !this.alerted50m) {
            this.alerted50m = true;
            console.log('🎉 ¡HAS LLEGADO! Ya estás en tu destino');
            
            // Usar notification manager si está disponible
            if (window.notificationManager) {
                window.notificationManager.showArrivalNotification();
            } else {
                // Fallback al método local
                this.showNotification(
                    '¡Has llegado!',
                    'Ya estás en tu destino',
                    { 
                        urgent: true,
                        onClick: () => this.stopBackgroundTracking()
                    }
                );
            }
            
            // Vibración muy fuerte
            if (this.isSupported.vibration) {
                navigator.vibrate([1500, 300, 1500, 300, 1500]);
            }
            
            // Detener tracking automáticamente después de un tiempo
            setTimeout(() => {
                this.stopBackgroundTracking();
            }, 10000); // 10 segundos
        }
    }
    
    // =================== CONFIGURAR DESTINO ===================
    setDestination(lat, lng, description = '') {
        try {
            // Guardar en localStorage
            localStorage.setItem('destino_lat', lat.toString());
            localStorage.setItem('destino_lng', lng.toString());
            localStorage.setItem('destino_descripcion', description);
            
            // Guardar en window para acceso rápido
            window.destinoCoords = [lat, lng];
            window.destinoDescripcion = description;
            
            // Limpiar flags de alerta
            this.alerted300m = false;
            this.alerted50m = false;
            
            console.log('📍 Destino configurado:', { lat, lng, description });
            
            // Guardar en estado de la aplicación
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
            // Intentar obtener destino de múltiples fuentes
            const state = localStorage.getItem('tuguia_state');
            if (state) {
                const data = JSON.parse(state);
                if (data.route?.end?.coords) {
                    console.log('📍 Destino encontrado en tuguia_state:', data.route.end.coords);
                    return {
                        lat: data.route.end.coords[0],
                        lng: data.route.end.coords[1]
                    };
                }
            }
            
            // Intentar obtener destino de window.endMarker
            if (window.endMarker) {
                const latLng = window.endMarker.getLatLng();
                console.log('📍 Destino encontrado en window.endMarker:', latLng);
                return {
                    lat: latLng.lat,
                    lng: latLng.lng
                };
            }
            
            // Intentar obtener destino de window.destinoCoords
            if (window.destinoCoords && window.destinoCoords.length === 2) {
                console.log('📍 Destino encontrado en window.destinoCoords:', window.destinoCoords);
                return {
                    lat: window.destinoCoords[0],
                    lng: window.destinoCoords[1]
                };
            }
            
            // Intentar obtener destino de localStorage directo
            const destinoLat = localStorage.getItem('destino_lat');
            const destinoLng = localStorage.getItem('destino_lng');
            if (destinoLat && destinoLng) {
                console.log('📍 Destino encontrado en localStorage:', [destinoLat, destinoLng]);
                return {
                    lat: parseFloat(destinoLat),
                    lng: parseFloat(destinoLng)
                };
            }
            
            console.log('⚠️ No se encontró destino configurado');
            return null;
        } catch (error) {
            console.error('❌ Error obteniendo destino del estado:', error);
            return null;
        }
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
                    
                case 'NOTIFICATION_CLICKED':
                    console.log('👆 Notificación clickeada:', data);
                    this.handleNotificationClick(data);
                    break;
                    
                case 'LOCATION_UPDATE':
                    console.log('📍 Actualización de ubicación desde SW:', data);
                    this.handleLocationUpdate(data);
                    break;
            }
        });
        
        // Detectar cuando la app va a segundo plano
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handleAppBackgrounded();
            } else {
                this.handleAppForegrounded();
            }
        });
    }
    
    // =================== MANEJO DE CLICKS EN NOTIFICACIONES ===================
    handleNotificationClick(data) {
        const { action, url } = data;
        
        switch (action) {
            case 'open':
                window.focus();
                if (url) {
                    window.location.href = url;
                }
                break;
                
            case 'stop_tracking':
                this.stopBackgroundTracking();
                break;
                
            case 'resume_tracking':
                this.startBackgroundLocationTracking();
                break;
        }
    }
    
    // =================== MANEJO DE APP EN SEGUNDO PLANO ===================
    handleAppBackgrounded() {
        console.log('📱 App en segundo plano');
        
        // Activar tracking en segundo plano si hay una ruta activa
        if (this.getDestinationFromState()) {
            this.startBackgroundLocationTracking();
        }
        
        // Activar Wake Lock para mantener la pantalla
        this.requestWakeLock();
        
        // Iniciar heartbeat para mantener la app activa
        this.startHeartbeat();
    }
    
    // =================== MANEJO DE APP EN PRIMER PLANO ===================
    handleAppForegrounded() {
        console.log('📱 App en primer plano');
        
        // Detener tracking en segundo plano
        this.stopBackgroundTracking();
        
        // Liberar Wake Lock
        this.releaseWakeLock();
        
        // Detener heartbeat
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        
        // Sincronizar datos pendientes
        this.syncPendingData();
    }
    
    // =================== SINCRONIZACIÓN DE DATOS PENDIENTES ===================
    async syncPendingData() {
        try {
            // Obtener datos pendientes del localStorage
            const pendingData = localStorage.getItem('tuguia_pending_sync');
            
            if (pendingData) {
                const data = JSON.parse(pendingData);
                console.log('🔄 Sincronizando datos pendientes:', data);
                
                // Aquí se podrían enviar los datos a un servidor
                // Por ahora solo los eliminamos del localStorage
                localStorage.removeItem('tuguia_pending_sync');
                
                console.log('✅ Datos sincronizados');
            }
        } catch (error) {
            console.error('❌ Error sincronizando datos:', error);
        }
    }
    
    // =================== MÉTODOS PÚBLICOS ===================
    
    // Iniciar tracking manualmente
    async startTracking() {
        console.log('🎯 Iniciando tracking manual...');
        
        const destination = this.getDestinationFromState();
        if (!destination) {
            console.warn('⚠️ No hay destino configurado');
            return false;
        }
        
        await this.startBackgroundLocationTracking();
        return true;
    }
    
    // Detener tracking manualmente
    async stopTracking() {
        console.log('🛑 Deteniendo tracking manual...');
        await this.stopBackgroundTracking();
    }
    
    // Verificar estado del tracking
    isTracking() {
        return this.locationWatchId !== null;
    }
    
    // Obtener estado de permisos
    getPermissionStatus() {
        return {
            notification: this.notificationPermission,
            geolocation: this.isSupported.geolocation ? 'supported' : 'not_supported',
            serviceWorker: this.registration ? 'registered' : 'not_registered',
            wakeLock: this.isSupported.wakeLock ? 'supported' : 'not_supported',
            vibration: this.isSupported.vibration ? 'supported' : 'not_supported'
        };
    }
    
    // Verificar soporte de geolocalización de manera más robusta
    checkGeolocationSupport() {
        if (!navigator.geolocation) {
            console.log('❌ Geolocalización no disponible en navigator');
            return false;
        }
        
        // Verificar métodos específicos
        const hasGetCurrentPosition = typeof navigator.geolocation.getCurrentPosition === 'function';
        const hasWatchPosition = typeof navigator.geolocation.watchPosition === 'function';
        const hasClearWatch = typeof navigator.geolocation.clearWatch === 'function';
        
        console.log('📍 Verificación de geolocalización:', {
            hasGetCurrentPosition,
            hasWatchPosition,
            hasClearWatch
        });
        
        return hasGetCurrentPosition && hasWatchPosition && hasClearWatch;
    }
    
    // Enviar notificación de prueba
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
    
    // =================== FUNCIONES DE TESTING ===================
    async testProximityNotification() {
        console.log('🧪 Probando notificación de proximidad...');
        
        // Simular ubicación actual
        const currentLocation = {
            lat: 10.397562,
            lng: -75.559672
        };
        
        // Configurar destino de prueba (300 metros de distancia)
        const testDestination = {
            lat: 10.400000,
            lng: -75.560000
        };
        
        // Guardar destino de prueba
        this.setDestination(testDestination.lat, testDestination.lng, 'Destino de Prueba');
        
        // Verificar proximidad
        this.checkDestinationProximity(currentLocation);
        
        console.log('✅ Prueba de proximidad completada');
    }
    
    async testArrivalNotification() {
        console.log('🧪 Probando notificación de llegada...');
        
        // Simular ubicación muy cerca del destino
        const currentLocation = {
            lat: 10.400001,
            lng: -75.560001
        };
        
        // Configurar destino de prueba
        const testDestination = {
            lat: 10.400000,
            lng: -75.560000
        };
        
        // Guardar destino de prueba
        this.setDestination(testDestination.lat, testDestination.lng, 'Destino de Prueba');
        
        // Verificar proximidad
        this.checkDestinationProximity(currentLocation);
        
        console.log('✅ Prueba de llegada completada');
    }
    
    // =================== FUNCIONES DE DEBUGGING ===================
    debugDestination() {
        const destination = this.getDestinationFromState();
        console.log('📍 Destino actual:', destination);
        
        if (destination) {
            console.log('✅ Destino configurado correctamente');
            console.log('📊 Coordenadas:', destination);
        } else {
            console.log('❌ No hay destino configurado');
        }
        
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

// =================== INICIALIZACIÓN GLOBAL ===================

// Crear instancia global
if (typeof window !== 'undefined') {
    window.backgroundManager = new BackgroundManager();
    
    // Exponer métodos útiles globalmente
    window.startBackgroundTracking = () => window.backgroundManager.startTracking();
    window.stopBackgroundTracking = () => window.backgroundManager.stopTracking();
    window.isBackgroundTracking = () => window.backgroundManager.isTracking();
    window.testNotification = () => window.backgroundManager.testNotification();
    window.getPermissionStatus = () => window.backgroundManager.getPermissionStatus();
    
    // Funciones de testing
    window.testProximityNotification = () => window.backgroundManager.testProximityNotification();
    window.testArrivalNotification = () => window.backgroundManager.testArrivalNotification();
    window.debugDestination = () => window.backgroundManager.debugDestination();
    window.debugLocation = () => window.backgroundManager.debugLocation();
    window.setDestination = (lat, lng, desc) => window.backgroundManager.setDestination(lat, lng, desc);
    
    // Funciones adicionales de debugging
    window.getBackgroundManager = () => window.backgroundManager;
    window.checkSupport = () => window.backgroundManager.isSupported;
    window.getRegistration = () => window.backgroundManager.registration;
    
    // Función mejorada para obtener estado completo
    window.getCompleteStatus = () => {
        if (!window.backgroundManager) return null;
        
        const bm = window.backgroundManager;
        const status = bm.getPermissionStatus();
        const isTracking = bm.isTracking();
        
        return {
            // Estado actual
            notification: status.notification,
            geolocation: status.geolocation,
            serviceWorker: status.serviceWorker,
            wakeLock: status.wakeLock,
            vibration: status.vibration,
            tracking: isTracking,
            
            // Soporte del navegador (desde la instancia real)
            browserSupport: bm.isSupported,
            
            // Información adicional
            watchId: bm.locationWatchId,
            registration: bm.registration ? 'Registrado' : 'No registrado',
            heartbeatInterval: bm.heartbeatInterval ? 'Activo' : 'Inactivo'
        };
    };
}

// Exportar para uso como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackgroundManager;
}

console.log('🚀 Background Manager inicializado'); 