/**
 * Service Worker registration utility
 * Registers the VitePWA-generated service worker for offline support
 */

import { registerSW as registerVitePwaSW } from 'virtual:pwa-register';
import { logger } from './logger';
import {
  SW_OFFLINE_READY_EVENT,
  SW_UPDATE_AVAILABLE_EVENT,
  type ServiceWorkerUpdateEventDetail,
} from './swEvents';

export const registerServiceWorker = async (): Promise<void> => {
  // Only register in production
  if (!import.meta.env.PROD) {
    logger.debug('[SW] Service worker registration skipped in development');
    return;
  }

  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service workers are not supported in this browser');
    return;
  }

  try {
    // Register the SW emitted by vite-plugin-pwa (workbox)
    const updateServiceWorker = registerVitePwaSW({
      immediate: true,
      onNeedRefresh() {
        logger.info('[SW] New version available! Please refresh.');
        window.dispatchEvent(
          new CustomEvent<ServiceWorkerUpdateEventDetail>(SW_UPDATE_AVAILABLE_EVENT, {
            detail: {
              applyUpdate: async () => {
                await updateServiceWorker(true);
              },
            },
          })
        );
      },
      onOfflineReady() {
        logger.info('[SW] Offline ready.');
        window.dispatchEvent(new CustomEvent(SW_OFFLINE_READY_EVENT));
      },
      onRegisterError(error) {
        logger.error('[SW] Service worker registration failed:', error);
      },
    });
  } catch (error) {
    logger.error('[SW] Service worker registration failed:', error);
  }
};

/**
 * Unregister service worker (for development)
 */
export const unregisterServiceWorker = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      logger.info('[SW] Service worker unregistered');
    }
  } catch (error) {
    logger.error('[SW] Error unregistering service worker:', error);
  }
};

export default {
  registerServiceWorker,
  unregisterServiceWorker,
};
