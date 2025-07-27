// =================== SISTEMA DE MANEJO DE ERRORES ===================

class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 50;
        this.setupGlobalHandlers();
    }
    
    // Configurar manejadores globales
    setupGlobalHandlers() {
        // Errores JavaScript no capturados
        window.addEventListener('error', (event) => {
            this.logError('JavaScript Error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                stack: event.error?.stack
            });
        });
        
        // Promesas rechazadas no capturadas
        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled Promise Rejection', {
                reason: event.reason,
                stack: event.reason?.stack
            });
        });
    }
    
    // Registrar error
    logError(type, details, context = {}) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            type,
            details,
            context,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        this.errorLog.push(errorEntry);
        
        // Mantener solo los últimos errores
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }
        
        console.error(`❌ ${type}:`, details, context);
    }
    
    // Wrapper para APIs que pueden fallar
    async safeApiCall(apiFunction, fallbackValue = null, errorMessage = 'Error en API') {
        try {
            return await apiFunction();
        } catch (error) {
            this.logError('API Error', {
                message: errorMessage,
                error: error.message,
                stack: error.stack
            });
            return fallbackValue;
        }
    }
    
    // Geocodificación segura
    async safeGeocode(address) {
        return this.safeApiCall(
            async () => {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Cartagena, Colombia')}&limit=1`
                );
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (!data || data.length === 0) {
                    throw new Error('No se encontraron resultados');
                }
                
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                    display_name: data[0].display_name
                };
            },
            null,
            `Error geocodificando: ${address}`
        );
    }
    
    // Geolocalización segura
    async safeGetLocation() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                this.logError('Geolocation Error', { message: 'Geolocalización no soportada' });
                resolve(null);
                return;
            }
            
            const timeoutId = setTimeout(() => {
                this.logError('Geolocation Timeout', { message: 'Timeout obteniendo ubicación' });
                resolve(null);
            }, 10000);
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    clearTimeout(timeoutId);
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    clearTimeout(timeoutId);
                    this.logError('Geolocation Error', {
                        code: error.code,
                        message: error.message
                    });
                    resolve(null);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 8000,
                    maximumAge: 60000
                }
            );
        });
    }
    
    // Mostrar notificación de error al usuario
    showUserError(message, type = 'error') {
        const notification = document.createElement('div');
        notification.className = `error-notification error-${type}`;
        notification.innerHTML = `
            <div class="error-content">
                <span class="error-icon">${type === 'error' ? '❌' : '⚠️'}</span>
                <span class="error-message">${message}</span>
                <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Estilos inline para asegurar que se vean
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#f8d7da' : '#fff3cd'};
            color: ${type === 'error' ? '#721c24' : '#856404'};
            border: 1px solid ${type === 'error' ? '#f5c6cb' : '#ffeaa7'};
            border-radius: 8px;
            padding: 1rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 10000;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    // Validar coordenadas
    validateCoordinates(coords) {
        if (!coords || !Array.isArray(coords) || coords.length !== 2) {
            this.logError('Validation Error', { message: 'Coordenadas inválidas', coords });
            return false;
        }
        
        const [lat, lng] = coords;
        if (typeof lat !== 'number' || typeof lng !== 'number') {
            this.logError('Validation Error', { message: 'Coordenadas no son números', coords });
            return false;
        }
        
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            this.logError('Validation Error', { message: 'Coordenadas fuera de rango', coords });
            return false;
        }
        
        return true;
    }
    
    // Obtener reporte de errores
    getErrorReport() {
        return {
            errors: this.errorLog,
            summary: {
                total: this.errorLog.length,
                byType: this.errorLog.reduce((acc, error) => {
                    acc[error.type] = (acc[error.type] || 0) + 1;
                    return acc;
                }, {}),
                recent: this.errorLog.slice(-5)
            }
        };
    }
    
    // Limpiar log de errores
    clearErrorLog() {
        this.errorLog = [];
    }
}

// Crear instancia global
const errorHandler = new ErrorHandler();

// Agregar estilos CSS para notificaciones
const errorStyles = document.createElement('style');
errorStyles.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .error-notification {
        font-family: 'Segoe UI', Arial, sans-serif;
    }
    
    .error-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .error-icon {
        font-size: 1.2rem;
    }
    
    .error-message {
        flex: 1;
        font-size: 0.9rem;
        line-height: 1.3;
    }
    
    .error-close {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0;
        margin-left: 0.5rem;
        opacity: 0.7;
    }
    
    .error-close:hover {
        opacity: 1;
    }
`;
document.head.appendChild(errorStyles);

// Exportar
if (typeof window !== 'undefined') {
    window.ErrorHandler = errorHandler;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
} 