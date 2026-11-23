type InertPrototype = { inert?: boolean };

/**
 * jsdom does not implement `inert`, so trap tests that exercise background
 * inerting opt in explicitly. Returns a restore function that must be called
 * in a finally block.
 */
export function installInertSupport(): () => void {
  const target = HTMLElement.prototype as unknown as InertPrototype;
  const originalDescriptor = Object.getOwnPropertyDescriptor(target, 'inert');

  Object.defineProperty(target, 'inert', {
    configurable: true,
    writable: true,
    value: false,
  });

  return () => {
    if (originalDescriptor) {
      Object.defineProperty(target, 'inert', originalDescriptor);
    } else {
      delete target.inert;
    }
  };
}
