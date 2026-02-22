export const SW_UPDATE_AVAILABLE_EVENT = 'pokedex:sw-update-available';
export const SW_OFFLINE_READY_EVENT = 'pokedex:sw-offline-ready';

export type ServiceWorkerUpdateEventDetail = {
  applyUpdate: () => Promise<void>;
};
