// Capacitor Bridge para ejecutar notificaciones y tracking nativos cuando esté disponible
// Este archivo no usa imports; utiliza la API global window.Capacitor para funcionar sin bundler
(function CapacitorBridgeInit() {
  const Cap = window.Capacitor || {};
  const Plugins = Cap.Plugins || {};
  const getPlatform = typeof Cap.getPlatform === 'function' ? Cap.getPlatform.bind(Cap) : () => 'web';
  const platform = getPlatform();
  const isNative = platform !== 'web';

  const Geolocation = Plugins.Geolocation;
  const LocalNotifications = Plugins.LocalNotifications;
  const ForegroundService = Plugins.ForegroundService;

  async function requestAllPermissions() {
    try {
      if (LocalNotifications && typeof LocalNotifications.requestPermissions === 'function') {
        await LocalNotifications.requestPermissions();
      }
    } catch (e) {
      console.warn('[CapBridge] LocalNotifications permisos:', e?.message);
    }
    try {
      if (Geolocation && typeof Geolocation.requestPermissions === 'function') {
        await Geolocation.requestPermissions();
      }
    } catch (e) {
      console.warn('[CapBridge] Geolocation permisos:', e?.message);
    }
  }

  async function startForegroundService() {
    if (!ForegroundService) return;
    try {
      if (typeof ForegroundService.startForegroundService === 'function') {
        await ForegroundService.startForegroundService({
          id: 1001,
          title: 'Seguimiento activo',
          text: 'Tu Guía está monitoreando tu ubicación',
          iconName: 'ic_launcher',
          channelId: 'TRACKING'
        });
      } else if (typeof ForegroundService.start === 'function') {
        await ForegroundService.start({
          id: 1001,
          title: 'Seguimiento activo',
          text: 'Tu Guía está monitoreando tu ubicación',
          iconName: 'ic_launcher',
          channelId: 'TRACKING'
        });
      }
    } catch (e) {
      console.warn('[CapBridge] ForegroundService:', e?.message);
    }
  }

  function hookBackgroundManagerNotifications() {
    const bm = window.backgroundManager;
    if (!bm || !LocalNotifications) return;

    const original = bm.showNotification.bind(bm);
    bm.showNotification = async (title, body, options = {}) => {
      if (isNative && LocalNotifications && typeof LocalNotifications.schedule === 'function') {
        try {
          await LocalNotifications.schedule({
            notifications: [{
              id: Date.now() % 2147483647,
              title,
              body,
              channelId: options.urgent ? 'ALARM' : 'TRACKING',
              ongoing: !!options.urgent,
              smallIcon: 'ic_launcher',
              sound: options.urgent ? 'default' : undefined,
              extra: { tag: options.tag || 'info' }
            }]
          });
          if (options.urgent && navigator.vibrate) {
            navigator.vibrate(options.vibrate || [1000, 300, 1000, 300, 1000]);
          }
          return;
        } catch (e) {
          console.warn('[CapBridge] LocalNotifications.schedule fallo, fallback web:', e?.message);
        }
      }
      // Fallback a web
      original(title, body, options);
    };
  }

  async function startNativeWatch() {
    if (!isNative || !Geolocation) return;
    await requestAllPermissions();
    await startForegroundService();
    try {
      // Iniciar watch nativo y forward a BackgroundManager
      if (typeof Geolocation.watchPosition === 'function') {
        Geolocation.watchPosition({ enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }, (pos, err) => {
          if (err) {
            console.warn('[CapBridge] watchPosition error:', err);
            return;
          }
          const c = pos && pos.coords;
          if (!c) return;
          const synthesized = { coords: { latitude: c.latitude, longitude: c.longitude, accuracy: c.accuracy } };
          if (window.backgroundManager && typeof window.backgroundManager.handleLocationUpdate === 'function') {
            window.backgroundManager.handleLocationUpdate(synthesized);
          }
        });
      }
    } catch (e) {
      console.error('[CapBridge] watchPosition fallo:', e?.message);
    }
  }

  function init() {
    try {
      if (!isNative) return; // En web no hace nada
      hookBackgroundManagerNotifications();
      startNativeWatch();
    } catch (e) {
      console.error('[CapBridge] init error:', e?.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


