// =================== OPTIMIZACIONES MÓVILES ===================

class MobileOptimizer {
    constructor() {
        this.isMobile = this.detectMobile();
        this.batteryLevel = null;
        this.networkType = null;
        this.deviceMemory = null;
        
        this.init();
    }
    
    // =================== DETECCIÓN DE DISPOSITIVO ===================
    detectMobile() {
        const userAgent = navigator.userAgent.toLowerCase();
        const mobileKeywords = [
            'android', 'iphone', 'ipad', 'ipod', 'blackberry', 
            'windows phone', 'mobile', 'opera mini'
        ];
        
        const isMobile = mobileKeywords.some(keyword => 
            userAgent.includes(keyword)
        );
        
        const isSmallScreen = window.innerWidth <= 768;
        const hasTouchScreen = 'ontouchstart' in window;
        
        return {
            isMobile,
            isSmallScreen,
            hasTouchScreen,
            isLikelyMobile: isMobile || (isSmallScreen && hasTouchScreen)
        };
    }
    
    // =================== INICIALIZACIÓN ===================
    async init() {
        console.log('📱 Inicializando optimizaciones móviles...');
        console.log('🔍 Detección de dispositivo:', this.isMobile);
        
        if (this.isMobile.isLikelyMobile) {
            await this.setupMobileOptimizations();
        }
        
        // Monitorear cambios de orientación
        this.setupOrientationHandling();
        
        // Monitorear estado de la batería
        await this.setupBatteryMonitoring();
        
        // Monitorear conexión de red
        this.setupNetworkMonitoring();
        
        // Optimizar rendimiento
        this.setupPerformanceOptimizations();
    }
    
    // =================== OPTIMIZACIONES ESPECÍFICAS MÓVILES ===================
    async setupMobileOptimizations() {
        console.log('⚡ Aplicando optimizaciones móviles...');
        
        // 1. Viewport optimizado
        this.setupMobileViewport();
        
        // 2. Touch gestures mejorados
        this.setupTouchOptimizations();
        
        // 3. Reducir animaciones en dispositivos lentos
        this.optimizeAnimations();
        
        // 4. Gestión inteligente de memoria
        this.setupMemoryManagement();
        
        // 5. Optimizar mapas para móviles
        this.optimizeMapsForMobile();
        
        // 6. Reducir frecuencia de GPS si es necesario
        this.optimizeGPSUsage();
    }
    
    // =================== VIEWPORT MÓVIL ===================
    setupMobileViewport() {
        // Asegurar viewport correcto
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
        
        // Prevenir zoom accidental
        document.addEventListener('gesturestart', (e) => e.preventDefault());
        document.addEventListener('gesturechange', (e) => e.preventDefault());
        document.addEventListener('gestureend', (e) => e.preventDefault());
    }
    
    // =================== OPTIMIZACIONES TOUCH ===================
    setupTouchOptimizations() {
        // Mejorar respuesta táctil
        document.addEventListener('touchstart', (e) => {
            // Reducir delay de 300ms en iOS
        }, { passive: true });
        
        // Optimizar scroll en mapas
        const mapElements = document.querySelectorAll('[id*="map"]');
        mapElements.forEach(mapEl => {
            mapEl.style.touchAction = 'pan-x pan-y';
            mapEl.style.overscrollBehavior = 'contain';
        });
        
        // Mejorar botones táctiles
        const buttons = document.querySelectorAll('button, .btn');
        buttons.forEach(btn => {
            // Aumentar área táctil mínima
            if (btn.offsetHeight < 44) {
                btn.style.minHeight = '44px';
                btn.style.minWidth = '44px';
            }
            
            // Feedback visual inmediato
            btn.addEventListener('touchstart', () => {
                btn.style.transform = 'scale(0.95)';
            }, { passive: true });
            
            btn.addEventListener('touchend', () => {
                btn.style.transform = 'scale(1)';
            }, { passive: true });
        });
    }
    
    // =================== MONITOREO DE BATERÍA ===================
    async setupBatteryMonitoring() {
        try {
            if ('getBattery' in navigator) {
                this.battery = await navigator.getBattery();
                this.batteryLevel = this.battery.level;
                
                console.log(`🔋 Nivel de batería: ${(this.batteryLevel * 100).toFixed(0)}%`);
                
                // Escuchar cambios en la batería
                this.battery.addEventListener('levelchange', () => {
                    this.batteryLevel = this.battery.level;
                    this.handleBatteryLevelChange();
                });
                
                this.battery.addEventListener('chargingchange', () => {
                    console.log('🔌 Estado de carga:', this.battery.charging ? 'Cargando' : 'Descargando');
                });
                
                // Optimizar según nivel inicial
                this.handleBatteryLevelChange();
            }
        } catch (error) {
            console.log('⚠️ API de batería no disponible');
        }
    }
    
    // Manejar cambios en el nivel de batería
    handleBatteryLevelChange() {
        const batteryPercent = this.batteryLevel * 100;
        console.log(`🔋 Batería: ${batteryPercent.toFixed(0)}%`);
        
        if (batteryPercent < 20) {
            console.log('⚡ Activando modo ahorro de batería');
            this.enableBatterySaveMode();
        } else if (batteryPercent > 30 && this.batterySaveMode) {
            console.log('🔋 Desactivando modo ahorro de batería');
            this.disableBatterySaveMode();
        }
    }
    
    // =================== MODO AHORRO DE BATERÍA ===================
    enableBatterySaveMode() {
        this.batterySaveMode = true;
        
        // Reducir frecuencia de GPS
        if (window.backgroundManager && window.backgroundManager.locationWatchId) {
            console.log('📍 Reduciendo frecuencia de GPS');
            // Reconfigurar con menor precisión
            navigator.geolocation.clearWatch(window.backgroundManager.locationWatchId);
            
            const lowPowerOptions = {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 5000 // Cache más largo
            };
            
            window.backgroundManager.locationWatchId = navigator.geolocation.watchPosition(
                (pos) => window.backgroundManager.handleLocationUpdate(pos),
                (err) => window.backgroundManager.handleLocationError(err),
                lowPowerOptions
            );
        }
        
        // Reducir animaciones
        document.documentElement.style.setProperty('--animation-duration', '0s');
        
        // Reducir frecuencia de heartbeat
        if (window.backgroundManager && window.backgroundManager.heartbeatInterval) {
            clearInterval(window.backgroundManager.heartbeatInterval);
            window.backgroundManager.heartbeatInterval = setInterval(() => {
                console.log('💓 Heartbeat (modo ahorro)');
            }, 60000); // Cada minuto en lugar de 30 segundos
        }
        
        // Mostrar notificación
        if (window.backgroundManager) {
            window.backgroundManager.showNotification(
                'Modo ahorro activado',
                'Reduciendo uso de GPS para ahorrar batería',
                { silent: true }
            );
        }
    }
    
    disableBatterySaveMode() {
        this.batterySaveMode = false;
        
        // Restaurar configuraciones normales
        document.documentElement.style.removeProperty('--animation-duration');
        
        console.log('🔋 Modo ahorro desactivado - restaurando configuración normal');
    }
    
    // =================== MONITOREO DE RED ===================
    setupNetworkMonitoring() {
        if ('connection' in navigator) {
            this.networkType = navigator.connection.effectiveType;
            console.log('📶 Tipo de conexión:', this.networkType);
            
            navigator.connection.addEventListener('change', () => {
                this.networkType = navigator.connection.effectiveType;
                this.handleNetworkChange();
            });
            
            this.handleNetworkChange();
        }
    }
    
    handleNetworkChange() {
        console.log('📶 Conexión cambió a:', this.networkType);
        
        // Ajustar calidad según conexión
        if (this.networkType === 'slow-2g' || this.networkType === '2g') {
            console.log('🐌 Conexión lenta detectada - optimizando...');
            this.enableLowBandwidthMode();
        } else if (this.networkType === '4g' || this.networkType === '5g') {
            this.disableLowBandwidthMode();
        }
    }
    
    // =================== MODO CONEXIÓN LENTA ===================
    enableLowBandwidthMode() {
        this.lowBandwidthMode = true;
        
        // Reducir calidad de tiles del mapa
        const maps = window.mapManager?.maps || new Map();
        maps.forEach((map) => {
            // Cambiar a tiles de menor calidad si es posible
            map.eachLayer((layer) => {
                if (layer._url && layer._url.includes('openstreetmap')) {
                    // Configurar para tiles de menor resolución
                    layer.options.detectRetina = false;
                }
            });
        });
        
        // Reducir frecuencia de geocodificación
        if (window.debouncedSearch) {
            // Aumentar debounce delay
            window.debouncedSearch = debounce(window.debouncedSearch, 1000);
        }
        
        console.log('📱 Modo ancho de banda limitado activado');
    }
    
    disableLowBandwidthMode() {
        this.lowBandwidthMode = false;
        console.log('📱 Modo ancho de banda normal restaurado');
    }
    
    // =================== ORIENTACIÓN ===================
    setupOrientationHandling() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                console.log('🔄 Orientación cambió');
                this.handleOrientationChange();
            }, 100);
        });
        
        // También escuchar resize para responsive
        window.addEventListener('resize', debounce(() => {
            this.handleOrientationChange();
        }, 250));
    }
    
    handleOrientationChange() {
        // Reajustar mapas
        if (window.map) {
            setTimeout(() => {
                window.map.invalidateSize();
            }, 200);
        }
        
        if (window.mapaOrigen) {
            setTimeout(() => {
                window.mapaOrigen.invalidateSize();
            }, 200);
        }
        
        if (window.mapaDestino) {
            setTimeout(() => {
                window.mapaDestino.invalidateSize();
            }, 200);
        }
        
        // Reajustar UI elements
        this.adjustUIForOrientation();
    }
    
    adjustUIForOrientation() {
        const isLandscape = window.innerWidth > window.innerHeight;
        
        if (isLandscape) {
            document.body.classList.add('landscape');
            document.body.classList.remove('portrait');
        } else {
            document.body.classList.add('portrait');
            document.body.classList.remove('landscape');
        }
    }
    
    // =================== OPTIMIZACIÓN DE ANIMACIONES ===================
    optimizeAnimations() {
        // Detectar si el dispositivo es capaz de manejar animaciones complejas
        const isLowEndDevice = this.isLowEndDevice();
        
        if (isLowEndDevice) {
            console.log('📱 Dispositivo de gama baja detectado - reduciendo animaciones');
            
            // Agregar clase CSS para animaciones reducidas
            document.documentElement.classList.add('reduced-motion');
            
            // Configurar CSS custom properties
            document.documentElement.style.setProperty('--animation-duration', '0.1s');
            document.documentElement.style.setProperty('--transition-duration', '0.1s');
        }
    }
    
    // =================== DETECCIÓN DE DISPOSITIVO DE GAMA BAJA ===================
    isLowEndDevice() {
        // Usar Device Memory API si está disponible
        if ('deviceMemory' in navigator) {
            this.deviceMemory = navigator.deviceMemory;
            return navigator.deviceMemory < 4; // Menos de 4GB
        }
        
        // Fallback: usar User Agent y otras métricas
        const userAgent = navigator.userAgent.toLowerCase();
        const lowEndKeywords = [
            'android 4', 'android 5', 'android 6',
            'iphone 5', 'iphone 6', 'ipad 2', 'ipad 3'
        ];
        
        const isOldDevice = lowEndKeywords.some(keyword => 
            userAgent.includes(keyword)
        );
        
        // También verificar hardware concurrency
        const lowCoreCount = navigator.hardwareConcurrency && 
                           navigator.hardwareConcurrency < 4;
        
        return isOldDevice || lowCoreCount;
    }
    
    // =================== GESTIÓN DE MEMORIA ===================
    setupMemoryManagement() {
        // Limpiar cache periódicamente en dispositivos de gama baja
        if (this.isLowEndDevice()) {
            setInterval(() => {
                this.performMemoryCleanup();
            }, 300000); // Cada 5 minutos
        }
        
        // Escuchar eventos de memoria baja
        if ('memory' in performance) {
            this.monitorMemoryUsage();
        }
    }
    
    performMemoryCleanup() {
        console.log('🧹 Realizando limpieza de memoria...');
        
        // Limpiar cache de geocodificación antiguo
        if (window.geocodingCache) {
            const oldEntries = Array.from(window.geocodingCache.cache.entries())
                .filter(([key, value]) => 
                    Date.now() - value.timestamp > 600000 // 10 minutos
                );
            
            oldEntries.forEach(([key]) => {
                window.geocodingCache.cache.delete(key);
            });
            
            console.log(`🗑️ Limpiadas ${oldEntries.length} entradas de cache`);
        }
        
        // Forzar garbage collection si está disponible
        if (window.gc) {
            window.gc();
        }
    }
    
    monitorMemoryUsage() {
        setInterval(() => {
            const memInfo = performance.memory;
            const usedMB = (memInfo.usedJSHeapSize / 1024 / 1024).toFixed(1);
            const limitMB = (memInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(1);
            const usagePercent = (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit * 100).toFixed(1);
            
            console.log(`💾 Memoria: ${usedMB}MB / ${limitMB}MB (${usagePercent}%)`);
            
            // Si el uso de memoria es alto, realizar limpieza
            if (usagePercent > 85) {
                console.warn('⚠️ Uso de memoria alto - realizando limpieza');
                this.performMemoryCleanup();
            }
        }, 60000); // Cada minuto
    }
    
    // =================== OPTIMIZACIÓN DE MAPAS ===================
    optimizeMapsForMobile() {
        // Configuraciones específicas para mapas en móviles
        const defaultMapOptions = {
            preferCanvas: true, // Usar Canvas en lugar de SVG
            zoomSnap: 0.5, // Zoom más suave
            wheelPxPerZoomLevel: 120,
            maxZoom: this.isMobile.isLikelyMobile ? 18 : 19, // Reducir zoom máximo en móviles
        };
        
        // Aplicar a mapas existentes
        if (window.map) {
            Object.assign(window.map.options, defaultMapOptions);
        }
        
        // Configurar para futuros mapas
        window.defaultMapOptions = defaultMapOptions;
    }
    
    // =================== OPTIMIZACIÓN GPS ===================
    optimizeGPSUsage() {
        // Configuración GPS optimizada para móviles
        window.mobileGPSOptions = {
            enableHighAccuracy: !this.batterySaveMode,
            timeout: this.batterySaveMode ? 15000 : 8000,
            maximumAge: this.batterySaveMode ? 10000 : 3000
        };
        
        console.log('📍 Configuración GPS optimizada:', window.mobileGPSOptions);
    }
    
    // =================== PERFORMANCE OPTIMIZATIONS ===================
    setupPerformanceOptimizations() {
        // Usar requestIdleCallback para tareas no críticas
        if ('requestIdleCallback' in window) {
            this.scheduleIdleTasks();
        }
        
        // Optimizar scroll
        this.optimizeScrolling();
        
        // Lazy loading de imágenes
        this.setupLazyLoading();
    }
    
    scheduleIdleTasks() {
        requestIdleCallback((deadline) => {
            while (deadline.timeRemaining() > 0) {
                // Realizar tareas de baja prioridad
                this.performIdleTask();
                break; // Solo una tarea por frame
            }
        });
    }
    
    performIdleTask() {
        // Tareas que se pueden realizar cuando el navegador está idle
        // Por ejemplo: pre-cachear datos, limpiar logs antiguos, etc.
        console.log('⚡ Realizando tarea en tiempo idle');
    }
    
    optimizeScrolling() {
        // Mejorar performance de scroll
        let isScrolling = false;
        
        window.addEventListener('scroll', () => {
            if (!isScrolling) {
                requestAnimationFrame(() => {
                    // Aquí van las tareas que dependen del scroll
                    isScrolling = false;
                });
                isScrolling = true;
            }
        }, { passive: true });
    }
    
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });
            
            // Observar imágenes con data-src
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }
}

// =================== UTILIDAD DEBOUNCE ===================
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

// =================== INICIALIZACIÓN ===================
const mobileOptimizer = new MobileOptimizer();

// Exportar globalmente
if (typeof window !== 'undefined') {
    window.MobileOptimizer = mobileOptimizer;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileOptimizer;
}

console.log('📱 Mobile Optimizer inicializado'); 