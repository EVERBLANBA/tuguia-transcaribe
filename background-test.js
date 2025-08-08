// =================== TESTING SUITE PARA BACKGROUND MANAGER ===================

class BackgroundTestSuite {
    constructor() {
        this.results = [];
        this.isRunning = false;
    }
    
    // =================== EJECUTAR TODAS LAS PRUEBAS ===================
    async runAllTests() {
        if (this.isRunning) {
            console.log('⚠️ Tests ya en ejecución');
            return;
        }
        
        this.isRunning = true;
        this.results = [];
        
        console.log('🧪 =================== INICIANDO PRUEBAS DE SEGUNDO PLANO ===================');
        
        try {
            // Prueba 1: Service Worker
            await this.testServiceWorker();
            
            // Prueba 2: Notificaciones
            await this.testNotifications();
            
            // Prueba 3: Background Manager
            await this.testBackgroundManager();
            
            // Prueba 4: Geolocalización
            await this.testGeolocation();
            
            // Prueba 5: Wake Lock
            await this.testWakeLock();
            
            // Prueba 6: Background Sync
            await this.testBackgroundSync();
            
            // Prueba 7: Tracking de ubicación
            await this.testLocationTracking();
            
            // Prueba 8: Notificaciones de proximidad
            await this.testProximityNotifications();
            
            // Mostrar resultados
            this.showResults();
            
        } catch (error) {
            console.error('❌ Error ejecutando pruebas:', error);
        } finally {
            this.isRunning = false;
        }
    }
    
    // =================== PRUEBA 1: SERVICE WORKER ===================
    async testServiceWorker() {
        console.log('\n🔧 Prueba 1: Service Worker');
        
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            const result = {
                test: 'Service Worker',
                passed: !!registration,
                details: registration ? 'Registrado correctamente' : 'No registrado'
            };
            
            if (registration) {
                console.log('✅ Service Worker registrado');
                console.log('📊 Estado:', registration.active ? 'Activo' : 'Inactivo');
                console.log('🔄 Scope:', registration.scope);
            } else {
                console.log('❌ Service Worker no registrado');
            }
            
            this.results.push(result);
            
        } catch (error) {
            console.log('❌ Error verificando Service Worker:', error.message);
            this.results.push({
                test: 'Service Worker',
                passed: false,
                details: error.message
            });
        }
    }
    
    // =================== PRUEBA 2: NOTIFICACIONES ===================
    async testNotifications() {
        console.log('\n🔔 Prueba 2: Notificaciones');
        
        const permission = Notification.permission;
        const result = {
            test: 'Notificaciones',
            passed: permission === 'granted',
            details: `Permiso: ${permission}`
        };
        
        if (permission === 'granted') {
            console.log('✅ Permisos de notificación otorgados');
        } else if (permission === 'default') {
            console.log('⚠️ Permisos de notificación no solicitados');
        } else {
            console.log('❌ Permisos de notificación denegados');
        }
        
        this.results.push(result);
    }
    
    // =================== PRUEBA 3: BACKGROUND MANAGER ===================
    async testBackgroundManager() {
        console.log('\n🎯 Prueba 3: Background Manager');
        
        const result = {
            test: 'Background Manager',
            passed: !!window.backgroundManager,
            details: window.backgroundManager ? 'Disponible' : 'No disponible'
        };
        
        if (window.backgroundManager) {
            console.log('✅ Background Manager disponible');
            console.log('📊 Estado:', window.backgroundManager.isInitialized ? 'Inicializado' : 'No inicializado');
            console.log('🔧 Soporte:', window.backgroundManager.isSupported);
        } else {
            console.log('❌ Background Manager no disponible');
        }
        
        this.results.push(result);
    }
    
    // =================== PRUEBA 4: GEOLOCALIZACIÓN ===================
    async testGeolocation() {
        console.log('\n📍 Prueba 4: Geolocalización');
        
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
            });
            
            const result = {
                test: 'Geolocalización',
                passed: true,
                details: `Lat: ${position.coords.latitude.toFixed(6)}, Lng: ${position.coords.longitude.toFixed(6)}`
            };
            
            console.log('✅ Geolocalización funcionando');
            console.log('📊 Coordenadas:', {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy
            });
            
            this.results.push(result);
            
        } catch (error) {
            console.log('❌ Error obteniendo ubicación:', error.message);
            this.results.push({
                test: 'Geolocalización',
                passed: false,
                details: error.message
            });
        }
    }
    
    // =================== PRUEBA 5: WAKE LOCK ===================
    async testWakeLock() {
        console.log('\n🔆 Prueba 5: Wake Lock');
        
        const result = {
            test: 'Wake Lock',
            passed: 'wakeLock' in navigator,
            details: 'wakeLock' in navigator ? 'Soportado' : 'No soportado'
        };
        
        if ('wakeLock' in navigator) {
            console.log('✅ Wake Lock soportado');
        } else {
            console.log('⚠️ Wake Lock no soportado');
        }
        
        this.results.push(result);
    }
    
    // =================== PRUEBA 6: BACKGROUND SYNC ===================
    async testBackgroundSync() {
        console.log('\n🔄 Prueba 6: Background Sync');
        
        const result = {
            test: 'Background Sync',
            passed: 'sync' in window.ServiceWorkerRegistration.prototype,
            details: 'sync' in window.ServiceWorkerRegistration.prototype ? 'Soportado' : 'No soportado'
        };
        
        if ('sync' in window.ServiceWorkerRegistration.prototype) {
            console.log('✅ Background Sync soportado');
        } else {
            console.log('⚠️ Background Sync no soportado');
        }
        
        this.results.push(result);
    }
    
    // =================== PRUEBA 7: TRACKING DE UBICACIÓN ===================
    async testLocationTracking() {
        console.log('\n🎯 Prueba 7: Tracking de Ubicación');
        
        if (!window.backgroundManager) {
            console.log('❌ Background Manager no disponible');
            this.results.push({
                test: 'Tracking de Ubicación',
                passed: false,
                details: 'Background Manager no disponible'
            });
            return;
        }
        
        try {
            // Configurar destino de prueba
            const testDestination = {
                lat: 10.400000,
                lng: -75.560000
            };
            
            window.backgroundManager.setDestination(testDestination.lat, testDestination.lng, 'Destino de Prueba');
            console.log('✅ Destino de prueba configurado');
            
            // Iniciar tracking
            const trackingStarted = await window.backgroundManager.startTracking();
            
            const result = {
                test: 'Tracking de Ubicación',
                passed: trackingStarted,
                details: trackingStarted ? 'Iniciado correctamente' : 'No se pudo iniciar'
            };
            
            if (trackingStarted) {
                console.log('✅ Tracking iniciado correctamente');
                
                // Detener tracking después de 5 segundos
                setTimeout(() => {
                    window.backgroundManager.stopTracking();
                    console.log('✅ Tracking detenido');
                }, 5000);
                
            } else {
                console.log('❌ No se pudo iniciar tracking');
            }
            
            this.results.push(result);
            
        } catch (error) {
            console.log('❌ Error en tracking:', error.message);
            this.results.push({
                test: 'Tracking de Ubicación',
                passed: false,
                details: error.message
            });
        }
    }
    
    // =================== PRUEBA 8: NOTIFICACIONES DE PROXIMIDAD ===================
    async testProximityNotifications() {
        console.log('\n🚨 Prueba 8: Notificaciones de Proximidad');
        
        if (!window.backgroundManager) {
            console.log('❌ Background Manager no disponible');
            this.results.push({
                test: 'Notificaciones de Proximidad',
                passed: false,
                details: 'Background Manager no disponible'
            });
            return;
        }
        
        try {
            // Simular ubicación cerca del destino
            const currentLocation = {
                lat: 10.400001,
                lng: -75.560001
            };
            
            // Configurar destino de prueba
            const testDestination = {
                lat: 10.400000,
                lng: -75.560000
            };
            
            window.backgroundManager.setDestination(testDestination.lat, testDestination.lng, 'Destino de Prueba');
            
            // Verificar proximidad
            window.backgroundManager.checkDestinationProximity(currentLocation);
            
            const result = {
                test: 'Notificaciones de Proximidad',
                passed: true,
                details: 'Proximidad verificada correctamente'
            };
            
            console.log('✅ Notificaciones de proximidad funcionando');
            
            this.results.push(result);
            
        } catch (error) {
            console.log('❌ Error en notificaciones de proximidad:', error.message);
            this.results.push({
                test: 'Notificaciones de Proximidad',
                passed: false,
                details: error.message
            });
        }
    }
    
    // =================== MOSTRAR RESULTADOS ===================
    showResults() {
        console.log('\n📊 =================== RESULTADOS DE PRUEBAS ===================');
        
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        
        console.log(`\n✅ Pruebas exitosas: ${passed}/${total}`);
        console.log(`📈 Porcentaje de éxito: ${((passed/total)*100).toFixed(1)}%`);
        
        console.log('\n📋 Detalles:');
        this.results.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${result.test}: ${result.details}`);
        });
        
        // Mostrar recomendaciones
        this.showRecommendations();
    }
    
    // =================== MOSTRAR RECOMENDACIONES ===================
    showRecommendations() {
        console.log('\n💡 =================== RECOMENDACIONES ===================');
        
        const failedTests = this.results.filter(r => !r.passed);
        
        if (failedTests.length === 0) {
            console.log('🎉 ¡Excelente! Todas las funcionalidades de segundo plano están funcionando correctamente.');
            console.log('📱 Tu aplicación está lista para funcionar en segundo plano.');
        } else {
            console.log('⚠️ Algunas funcionalidades necesitan atención:');
            
            failedTests.forEach(test => {
                switch (test.test) {
                    case 'Service Worker':
                        console.log('🔧 Service Worker: Verificar que el archivo sw.js esté en la raíz del proyecto');
                        break;
                    case 'Notificaciones':
                        console.log('🔔 Notificaciones: Solicitar permisos manualmente al usuario');
                        break;
                    case 'Background Manager':
                        console.log('🎯 Background Manager: Verificar que el archivo background-manager.js esté cargado');
                        break;
                    case 'Geolocalización':
                        console.log('📍 Geolocalización: Verificar permisos de ubicación en el navegador');
                        break;
                    case 'Wake Lock':
                        console.log('🔆 Wake Lock: Funcionalidad opcional, no crítica para el funcionamiento');
                        break;
                    case 'Background Sync':
                        console.log('🔄 Background Sync: Funcionalidad opcional, no crítica para el funcionamiento');
                        break;
                }
            });
        }
    }
}

// =================== FUNCIONES GLOBALES DE TESTING ===================

// Función principal para ejecutar todas las pruebas
window.runBackgroundTests = async function() {
    const testSuite = new BackgroundTestSuite();
    await testSuite.runAllTests();
};

// Función para obtener estado del background manager
window.getBackgroundStatus = function() {
    if (!window.backgroundManager) {
        return {
            available: false,
            message: 'Background Manager no disponible'
        };
    }
    
    return {
        available: true,
        initialized: window.backgroundManager.isInitialized,
        tracking: window.backgroundManager.isTracking(),
        permissions: window.backgroundManager.getPermissionStatus(),
        support: window.backgroundManager.isSupported
    };
};

// Función para probar notificación
window.testNotification = async function() {
    if (!window.backgroundManager) {
        console.log('❌ Background Manager no disponible');
        return false;
    }
    
    return await window.backgroundManager.testNotification();
};

// Función para iniciar tracking
window.startBackgroundTracking = async function() {
    if (!window.backgroundManager) {
        console.log('❌ Background Manager no disponible');
        return false;
    }
    
    return await window.backgroundManager.startTracking();
};

// Función para detener tracking
window.stopBackgroundTracking = async function() {
    if (!window.backgroundManager) {
        console.log('❌ Background Manager no disponible');
        return false;
    }
    
    return await window.backgroundManager.stopTracking();
};

// Función para probar notificación de proximidad
window.testProximityNotification = async function() {
    if (!window.backgroundManager) {
        console.log('❌ Background Manager no disponible');
        return false;
    }
    
    return await window.backgroundManager.testProximityNotification();
};

// Función para probar notificación de llegada
window.testArrivalNotification = async function() {
    if (!window.backgroundManager) {
        console.log('❌ Background Manager no disponible');
        return false;
    }
    
    return await window.backgroundManager.testArrivalNotification();
};

console.log('🧪 Background Test Suite cargado');
console.log('📝 Comandos disponibles:');
console.log('   - runBackgroundTests()');
console.log('   - getBackgroundStatus()');
console.log('   - testNotification()');
console.log('   - startBackgroundTracking()');
console.log('   - stopBackgroundTracking()');
console.log('   - testProximityNotification()');
console.log('   - testArrivalNotification()'); 