// =================== GESTOR DE NOTIFICACIONES CENTRALIZADO ===================

class NotificationManager {
    constructor() {
        this.permission = 'default';
        this.isSupported = 'Notification' in window;
        this.notifications = new Map();
        this.defaultIcon = './logoagapai-ok2.png';
        this.defaultBadge = './pin-verde-destino.png';
        
        this.init();
    }
    
    // =================== INICIALIZACIÓN ===================
    async init() {
        if (!this.isSupported) {
            console.warn('⚠️ Notificaciones no soportadas en este navegador');
            return;
        }
        
        this.permission = Notification.permission;
        console.log('🔔 Estado inicial de notificaciones:', this.permission);
        
        // Solicitar permisos si es necesario
        if (this.permission === 'default') {
            await this.requestPermission();
        }
        
        // Configurar listeners
        this.setupNotificationListeners();
    }
    
    // =================== SOLICITUD DE PERMISOS ===================
    async requestPermission() {
        try {
            this.permission = await Notification.requestPermission();
            console.log('🔔 Permiso de notificaciones:', this.permission);
            
            if (this.permission === 'granted') {
                // Mostrar notificación de bienvenida
                this.showWelcomeNotification();
            }
            
            return this.permission;
        } catch (error) {
            console.error('❌ Error solicitando permisos de notificación:', error);
            return 'denied';
        }
    }
    
    // =================== CONFIGURACIÓN DE LISTENERS ===================
    setupNotificationListeners() {
        // Escuchar clicks en notificaciones
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
                    this.handleNotificationClick(event.data);
                }
            });
        }
    }
    
    // =================== NOTIFICACIÓN DE BIENVENIDA ===================
    showWelcomeNotification() {
        this.showNotification(
            'Tu Guía Cartagena',
            '¡Bienvenido! Tu aplicación está lista para navegar',
            {
                tag: 'welcome',
                icon: this.defaultIcon,
                badge: this.defaultBadge,
                requireInteraction: false
            }
        );
    }
    
    // =================== NOTIFICACIÓN PRINCIPAL ===================
    showNotification(title, body, options = {}) {
        if (!this.isSupported || this.permission !== 'granted') {
            console.log('📢 Notificación (sin permiso):', title, body);
            return null;
        }

        // Delegar a BackgroundManager si está disponible para aprovechar SW/bridge nativo
        try {
            if (window.backgroundManager && typeof window.backgroundManager.showNotification === 'function') {
                const merged = {
                    icon: options.icon || this.defaultIcon,
                    badge: options.badge || this.defaultBadge,
                    tag: options.tag || 'default',
                    requireInteraction: options.requireInteraction || false,
                    silent: options.silent || false,
                    vibrate: options.vibrate || [100, 50, 100],
                    data: options.data || {},
                    actions: options.actions || [],
                    urgent: !!options.urgent
                };
                window.backgroundManager.showNotification(title, body, merged);
                return { delegated: true };
            }
        } catch (e) {
            console.warn('⚠️ Delegación a BackgroundManager falló, usando Notification API:', e?.message);
        }

        // Fallback a Notification API
        try {
            const notificationOptions = {
                body,
                icon: options.icon || this.defaultIcon,
                badge: options.badge || this.defaultBadge,
                tag: options.tag || 'default',
                requireInteraction: options.requireInteraction || false,
                silent: options.silent || false,
                vibrate: options.vibrate || [100, 50, 100],
                data: options.data || {},
                actions: options.actions || []
            };
            const notification = new Notification(title, notificationOptions);
            this.setupNotificationEvents(notification, options);
            this.notifications.set(notificationOptions.tag, notification);
            console.log('✅ Notificación enviada (fallback):', title);
            return notification;
        } catch (error) {
            console.error('❌ Error enviando notificación:', error);
            return null;
        }
    }
    
    // =================== CONFIGURACIÓN DE EVENTOS DE NOTIFICACIÓN ===================
    setupNotificationEvents(notification, options) {
        // Click en la notificación
        notification.onclick = (event) => {
            console.log('👆 Notificación clickeada:', notification.tag);
            
            // Cerrar la notificación
            notification.close();
            
            // Ejecutar callback personalizado si existe
            if (options.onClick) {
                options.onClick(event);
            }
            
            // Enviar mensaje al Service Worker
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'NOTIFICATION_CLICKED',
                    data: {
                        tag: notification.tag,
                        action: 'open',
                        url: options.url
                    }
                });
            }
        };
        
        // Cerrar notificación
        notification.onclose = () => {
            console.log('❌ Notificación cerrada:', notification.tag);
            this.notifications.delete(notification.tag);
        };
        
        // Error en notificación
        notification.onerror = (error) => {
            console.error('❌ Error en notificación:', error);
        };
    }
    
    // =================== NOTIFICACIONES ESPECÍFICAS ===================
    
    // Notificación de proximidad al destino
    showProximityNotification(distance) {
        return this.showNotification(
            '¡Casi llegas!',
            `Faltan ${distance.toFixed(0)} metros para tu destino`,
            {
                tag: 'proximity',
                icon: './pin-verde-destino.png',
                badge: './pin-morado.png',
                urgent: true,
                vibrate: [200, 100, 200, 100, 200],
                requireInteraction: true,
                actions: [
                    {
                        action: 'stop_tracking',
                        title: 'Detener seguimiento',
                        icon: './pin-morado.png'
                    }
                ]
            }
        );
    }
    
    // Notificación de llegada al destino
    showArrivalNotification() {
        return this.showNotification(
            '¡Has llegado!',
            'Ya estás en tu destino',
            {
                tag: 'arrival',
                icon: './pin-verde-destino.png',
                badge: './pin-morado.png',
                urgent: true,
                vibrate: [1500, 300, 1500, 300, 1500],
                requireInteraction: true,
                actions: [
                    {
                        action: 'stop_tracking',
                        title: 'Detener seguimiento',
                        icon: './pin-morado.png'
                    }
                ]
            }
        );
    }
    
    // Notificación de error
    showErrorNotification(message) {
        return this.showNotification(
            'Error en Tu Guía',
            message,
            {
                tag: 'error',
                icon: './pin-morado.png',
                badge: './pin-verde-destino.png',
                urgent: false,
                requireInteraction: false
            }
        );
    }
    
    // Notificación de información
    showInfoNotification(title, message) {
        return this.showNotification(
            title,
            message,
            {
                tag: 'info',
                icon: this.defaultIcon,
                badge: this.defaultBadge,
                urgent: false,
                requireInteraction: false
            }
        );
    }
    
    // =================== MANEJO DE CLICKS EN NOTIFICACIONES ===================
    handleNotificationClick(data) {
        const { tag, action } = data;
        
        switch (tag) {
            case 'proximity':
                if (action === 'stop_tracking') {
                    this.stopTracking();
                }
                break;
                
            case 'arrival':
                if (action === 'stop_tracking') {
                    this.stopTracking();
                }
                break;
                
            case 'welcome':
                // Enfocar la ventana
                window.focus();
                break;
        }
    }
    
    // =================== FUNCIONES DE UTILIDAD ===================
    
    // Detener tracking (función helper)
    stopTracking() {
        if (window.backgroundManager) {
            window.backgroundManager.stopTracking();
        }
    }
    
    // Cerrar notificación específica
    closeNotification(tag) {
        const notification = this.notifications.get(tag);
        if (notification) {
            notification.close();
        }
    }
    
    // Cerrar todas las notificaciones
    closeAllNotifications() {
        this.notifications.forEach(notification => {
            notification.close();
        });
        this.notifications.clear();
    }
    
    // Verificar si una notificación está activa
    isNotificationActive(tag) {
        return this.notifications.has(tag);
    }
    
    // Obtener estado de permisos
    getPermissionStatus() {
        return {
            supported: this.isSupported,
            permission: this.permission,
            activeNotifications: this.notifications.size
        };
    }
    
    // Notificación de prueba
    showTestNotification() {
        return this.showNotification(
            'Tu Guía Cartagena',
            'Esta es una notificación de prueba',
            {
                tag: 'test',
                icon: this.defaultIcon,
                badge: this.defaultBadge,
                urgent: false,
                requireInteraction: false
            }
        );
    }
}

// =================== INICIALIZACIÓN GLOBAL ===================

// Crear instancia global
if (typeof window !== 'undefined') {
    window.notificationManager = new NotificationManager();
    
    // Exponer métodos útiles globalmente
    window.showNotification = (title, body, options) => 
        window.notificationManager.showNotification(title, body, options);
    
    window.showProximityNotification = (distance) => 
        window.notificationManager.showProximityNotification(distance);
    
    window.showArrivalNotification = () => 
        window.notificationManager.showArrivalNotification();
    
    window.showErrorNotification = (message) => 
        window.notificationManager.showErrorNotification(message);
    
    window.showInfoNotification = (title, message) => 
        window.notificationManager.showInfoNotification(title, message);
    
    window.testNotification = () => 
        window.notificationManager.showTestNotification();
    
    window.getNotificationStatus = () => 
        window.notificationManager.getPermissionStatus();
}

// Exportar para uso como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
} 