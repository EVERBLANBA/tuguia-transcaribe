// =================== SISTEMA DE TESTING PARA FUNCIONALIDADES DE SEGUNDO PLANO ===================

class BackgroundTestSuite {
    constructor() {
        this.tests = [];
        this.results = [];
        this.currentTest = 0;
    }
    
    // =================== EJECUTAR TODAS LAS PRUEBAS ===================
    async runAllTests() {
        console.log('🧪 Iniciando pruebas de funcionalidades de segundo plano...');
        
        this.tests = [
            this.testServiceWorkerRegistration,
            this.testNotificationPermissions,
            this.testBackgroundManager,
            this.testNotificationManager,
            this.testGeolocation,
            this.testBackgroundSync,
            this.testWakeLock,
            this.testCache,
            this.testOfflineFunctionality
        ];
        
        for (let i = 0; i < this.tests.length; i++) {
            this.currentTest = i + 1;
            const testName = this.tests[i].name;
            
            console.log(`\n🔍 Ejecutando prueba ${this.currentTest}/${this.tests.length}: ${testName}`);
            
            try {
                const result = await this.tests[i].call(this);
                this.results.push({
                    test: testName,
                    passed: result.passed,
                    message: result.message,
                    details: result.details
                });
                
                if (result.passed) {
                    console.log(`✅ ${testName}: ${result.message}`);
                } else {
                    console.log(`❌ ${testName}: ${result.message}`);
                }
            } catch (error) {
                console.error(`💥 Error en ${testName}:`, error);
                this.results.push({
                    test: testName,
                    passed: false,
                    message: 'Error durante la prueba',
                    details: error.message
                });
            }
        }
        
        this.printResults();
        return this.results;
    }
    
    // =================== PRUEBA DE REGISTRO DE SERVICE WORKER ===================
    async testServiceWorkerRegistration() {
        if (!('serviceWorker' in navigator)) {
            return {
                passed: false,
                message: 'Service Workers no soportados',
                details: 'El navegador no soporta Service Workers'
            };
        }
        
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            
            if (registration) {
                return {
                    passed: true,
                    message: 'Service Worker registrado correctamente',
                    details: `Estado: ${registration.active ? 'Activo' : 'Inactivo'}`
                };
            } else {
                return {
                    passed: false,
                    message: 'Service Worker no registrado',
                    details: 'No se encontró registro de Service Worker'
                };
            }
        } catch (error) {
            return {
                passed: false,
                message: 'Error verificando Service Worker',
                details: error.message
            };
        }
    }
    
    // =================== PRUEBA DE PERMISOS DE NOTIFICACIÓN ===================
    async testNotificationPermissions() {
        if (!('Notification' in window)) {
            return {
                passed: false,
                message: 'Notificaciones no soportadas',
                details: 'El navegador no soporta la API de Notificaciones'
            };
        }
        
        const permission = Notification.permission;
        
        if (permission === 'granted') {
            return {
                passed: true,
                message: 'Permisos de notificación otorgados',
                details: 'El usuario ha otorgado permisos de notificación'
            };
        } else if (permission === 'denied') {
            return {
                passed: false,
                message: 'Permisos de notificación denegados',
                details: 'El usuario ha denegado los permisos de notificación'
            };
        } else {
            return {
                passed: false,
                message: 'Permisos de notificación no solicitados',
                details: 'Los permisos aún no han sido solicitados'
            };
        }
    }
    
    // =================== PRUEBA DE BACKGROUND MANAGER ===================
    async testBackgroundManager() {
        if (!window.backgroundManager) {
            return {
                passed: false,
                message: 'Background Manager no disponible',
                details: 'El Background Manager no se ha inicializado'
            };
        }
        
        const status = window.backgroundManager.getPermissionStatus();
        
        return {
            passed: true,
            message: 'Background Manager funcionando',
            details: `Estado: ${JSON.stringify(status)}`
        };
    }
    
    // =================== PRUEBA DE NOTIFICATION MANAGER ===================
    async testNotificationManager() {
        if (!window.notificationManager) {
            return {
                passed: false,
                message: 'Notification Manager no disponible',
                details: 'El Notification Manager no se ha inicializado'
            };
        }
        
        const status = window.notificationManager.getPermissionStatus();
        
        return {
            passed: true,
            message: 'Notification Manager funcionando',
            details: `Estado: ${JSON.stringify(status)}`
        };
    }
    
    // =================== PRUEBA DE GEOLOCALIZACIÓN ===================
    async testGeolocation() {
        if (!navigator.geolocation) {
            return {
                passed: false,
                message: 'Geolocalización no soportada',
                details: 'El navegador no soporta la API de Geolocalización'
            };
        }
        
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 10000,
                    enableHighAccuracy: true
                });
            });
            
            return {
                passed: true,
                message: 'Geolocalización funcionando',
                details: `Precisión: ${position.coords.accuracy}m`
            };
        } catch (error) {
            return {
                passed: false,
                message: 'Error en geolocalización',
                details: error.message
            };
        }
    }
    
    // =================== PRUEBA DE BACKGROUND SYNC ===================
    async testBackgroundSync() {
        if (!('serviceWorker' in navigator)) {
            return {
                passed: false,
                message: 'Background Sync no soportado',
                details: 'Service Workers no están disponibles'
            };
        }
        
        const registration = await navigator.serviceWorker.getRegistration();
        
        if (registration && 'sync' in window.ServiceWorkerRegistration.prototype) {
            return {
                passed: true,
                message: 'Background Sync soportado',
                details: 'La API de Background Sync está disponible'
            };
        } else {
            return {
                passed: false,
                message: 'Background Sync no soportado',
                details: 'La API de Background Sync no está disponible'
            };
        }
    }
    
    // =================== PRUEBA DE WAKE LOCK ===================
    async testWakeLock() {
        if (!('wakeLock' in navigator)) {
            return {
                passed: false,
                message: 'Wake Lock no soportado',
                details: 'El navegador no soporta la API de Wake Lock'
            };
        }
        
        return {
            passed: true,
            message: 'Wake Lock soportado',
            details: 'La API de Wake Lock está disponible'
        };
    }
    
    // =================== PRUEBA DE CACHE ===================
    async testCache() {
        if (!('caches' in window)) {
            return {
                passed: false,
                message: 'Cache API no soportada',
                details: 'El navegador no soporta la API de Cache'
            };
        }
        
        try {
            const cacheNames = await caches.keys();
            
            return {
                passed: true,
                message: 'Cache API funcionando',
                details: `Caches disponibles: ${cacheNames.length}`
            };
        } catch (error) {
            return {
                passed: false,
                message: 'Error en Cache API',
                details: error.message
            };
        }
    }
    
    // =================== PRUEBA DE FUNCIONALIDAD OFFLINE ===================
    async testOfflineFunctionality() {
        if (!('serviceWorker' in navigator)) {
            return {
                passed: false,
                message: 'Funcionalidad offline no soportada',
                details: 'Service Workers no están disponibles'
            };
        }
        
        const registration = await navigator.serviceWorker.getRegistration();
        
        if (registration && registration.active) {
            return {
                passed: true,
                message: 'Funcionalidad offline disponible',
                details: 'Service Worker activo para funcionalidad offline'
            };
        } else {
            return {
                passed: false,
                message: 'Funcionalidad offline no disponible',
                details: 'No hay Service Worker activo'
            };
        }
    }
    
    // =================== IMPRIMIR RESULTADOS ===================
    printResults() {
        console.log('\n📊 RESULTADOS DE LAS PRUEBAS:');
        console.log('================================');
        
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        
        console.log(`✅ Pruebas exitosas: ${passed}/${total}`);
        console.log(`❌ Pruebas fallidas: ${total - passed}/${total}`);
        
        console.log('\n📋 DETALLES:');
        this.results.forEach((result, index) => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${index + 1}. ${result.test}: ${result.message}`);
            if (result.details) {
                console.log(`   📝 ${result.details}`);
            }
        });
        
        // Mostrar recomendaciones
        this.showRecommendations();
    }
    
    // =================== MOSTRAR RECOMENDACIONES ===================
    showRecommendations() {
        const failedTests = this.results.filter(r => !r.passed);
        
        if (failedTests.length === 0) {
            console.log('\n🎉 ¡Todas las pruebas pasaron! Tu aplicación está lista para funcionar en segundo plano.');
            return;
        }
        
        console.log('\n💡 RECOMENDACIONES:');
        
        failedTests.forEach(test => {
            switch (test.test) {
                case 'testServiceWorkerRegistration':
                    console.log('🔧 Asegúrate de que el Service Worker esté registrado correctamente');
                    break;
                    
                case 'testNotificationPermissions':
                    console.log('🔔 Solicita permisos de notificación al usuario');
                    break;
                    
                case 'testBackgroundManager':
                    console.log('📱 Verifica que el Background Manager se inicialice correctamente');
                    break;
                    
                case 'testGeolocation':
                    console.log('📍 Solicita permisos de ubicación al usuario');
                    break;
                    
                case 'testBackgroundSync':
                    console.log('🔄 Background Sync no está disponible, pero no es crítico');
                    break;
                    
                case 'testWakeLock':
                    console.log('🔆 Wake Lock no está disponible, pero no es crítico');
                    break;
            }
        });
    }
    
    // =================== FUNCIONES DE UTILIDAD ===================
    
    // Ejecutar prueba específica
    async runSpecificTest(testName) {
        const test = this.tests.find(t => t.name === testName);
        if (test) {
            return await test.call(this);
        } else {
            throw new Error(`Prueba no encontrada: ${testName}`);
        }
    }
    
    // Obtener resultados
    getResults() {
        return this.results;
    }
    
    // Verificar si todas las pruebas críticas pasaron
    isCriticalTestsPassed() {
        const criticalTests = ['testServiceWorkerRegistration', 'testNotificationPermissions', 'testBackgroundManager'];
        return criticalTests.every(testName => {
            const result = this.results.find(r => r.test === testName);
            return result && result.passed;
        });
    }
}

// =================== INICIALIZACIÓN GLOBAL ===================

// Crear instancia global
if (typeof window !== 'undefined') {
    window.backgroundTestSuite = new BackgroundTestSuite();
    
    // Exponer funciones útiles globalmente
    window.runBackgroundTests = () => window.backgroundTestSuite.runAllTests();
    window.runSpecificBackgroundTest = (testName) => window.backgroundTestSuite.runSpecificTest(testName);
    window.getBackgroundTestResults = () => window.backgroundTestSuite.getResults();
    window.areCriticalTestsPassed = () => window.backgroundTestSuite.isCriticalTestsPassed();
}

// Exportar para uso como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackgroundTestSuite;
} 