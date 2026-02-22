const EVENT_NAME = 'pokedex-walkers-settings-changed';

export function notifyWalkersSettingsChanged() {
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function onWalkersSettingsChanged(handler: () => void) {
  const listener = () => handler();
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}

