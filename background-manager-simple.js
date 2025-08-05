// =================== BACKGROUND MANAGER SIMPLIFICADO PARA DIAGNÓSTICO ===================

console.log('🔍 Cargando Background Manager Simplificado...');

class BackgroundManagerSimple {
    constructor() {
        console.log('🔧 Constructor BackgroundManagerSimple iniciado');
        
        this.isSupported = this.checkSupport();
        this.notificationPermission = 'default';
        
        console.log('✅ Constructor completado');
    }
    
    checkSupport() {
        console.log('🔍 Verificando soporte...');
        
        const support = {
            serviceWorker: 'serviceWorker' in navigator,
            notification: 'Notification' in window,
            geolocation: 'geolocation' in navigator,
            wakeLock: 'wakeLock' in navigator,
            vibration: 'vibrate' in navigator,
            permissions: 'permissions' in navigator
        };
        
        console.log('📱 Soporte detectado:', support);
        return support;
    }
    
    getPermissionStatus() {
        return {
            notification: this.notificationPermission,
            geolocation: this.isSupported.geolocation ? 'supported' : 'not_supported',
            serviceWorker: 'not_registered',
            wakeLock: this.isSupported.wakeLock ? 'supported' : 'not_supported',
            vibration: this.isSupported.vibration ? 'supported' : 'not_supported'
        };
    }
    
    isTracking() {
        return false;
    }
    
    async testNotification() {
        console.log('🧪 Probando notificación...');
        if (Notification.permission === 'granted') {
            new Notification('Prueba Simple', {
                body: 'Esta es una prueba del Background Manager Simplificado',
                icon: './logoagapai-ok2.png'
            });
            return true;
        } else {
            console.warn('⚠️ Permisos de notificación no otorgados');
            return false;
        }
    }
}

// =================== INICIALIZACIÓN GLOBAL SIMPLIFICADA ===================

console.log('🔧 Inicializando Background Manager Simplificado...');

try {
    // Crear instancia global
    if (typeof window !== 'undefined') {
        window.backgroundManager = new BackgroundManagerSimple();
        console.log('✅ Background Manager Simplificado creado');
        
        // Exponer métodos básicos
        window.startBackgroundTracking = () => console.log('🎯 Tracking iniciado (simulado)');
        window.stopBackgroundTracking = () => console.log('🛑 Tracking detenido (simulado)');
        window.isBackgroundTracking = () => false;
        window.testNotification = () => window.backgroundManager.testNotification();
        window.getPermissionStatus = () => window.backgroundManager.getPermissionStatus();
        
        // Función de estado completo
        window.getCompleteStatus = () => {
            if (!window.backgroundManager) return null;
            
            const bm = window.backgroundManager;
            const status = bm.getPermissionStatus();
            
            return {
                notification: status.notification,
                geolocation: status.geolocation,
                serviceWorker: status.serviceWorker,
                wakeLock: status.wakeLock,
                vibration: status.vibration,
                tracking: false,
                browserSupport: bm.isSupported,
                watchId: null,
                registration: 'No registrado',
                heartbeatInterval: 'Inactivo'
            };
        };
        
        console.log('✅ Métodos globales expuestos');
    }
} catch (error) {
    console.error('❌ Error en inicialización simplificada:', error);
}

console.log('🚀 Background Manager Simplificado inicializado'); 