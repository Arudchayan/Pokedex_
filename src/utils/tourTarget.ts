function hasVisibleStyle(element: HTMLElement): boolean {
  let node: HTMLElement | null = element;

  while (node) {
    const style = window.getComputedStyle(node);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.visibility === 'collapse' ||
      style.opacity === '0'
    ) {
      return false;
    }
    node = node.parentElement;
  }

  return true;
}

export function isVisibleTourTarget(element: Element | null): element is HTMLElement {
  if (!(element instanceof HTMLElement) || !element.isConnected) return false;

  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;

  return hasVisibleStyle(element);
}

/**
 * Resolve a tour target from a selector list, skipping hidden responsive
 * variants. `querySelector` returns the first DOM match, which may be a
 * desktop-only control while the visible control is its mobile counterpart.
 */
export function resolveTourTarget(selector: string): HTMLElement | null {
  const targets = document.querySelectorAll<HTMLElement>(selector);

  for (const target of targets) {
    if (isVisibleTourTarget(target)) return target;
  }

  return null;
}
