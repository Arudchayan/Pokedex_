import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Tracks the top-level portal roots of every open trap. Only the most recently
 * opened trap handles keyboard events, so nested dialogs keep their own trap.
 */
const trapOrder: symbol[] = [];
const trapRoots = new Map<symbol, HTMLElement>();

/**
 * Elements we marked `inert`, with their original inert state so closing a
 * dialog never removes an inert attribute that someone else applied.
 */
const inertedElements = new Map<HTMLElement, boolean>();

function supportsInert(): boolean {
  return typeof HTMLElement !== 'undefined' && 'inert' in HTMLElement.prototype;
}

function getTopLevelRoot(element: HTMLElement): HTMLElement | null {
  let current = element;
  while (current.parentElement && current.parentElement !== document.body) {
    current = current.parentElement;
  }
  return current.parentElement === document.body ? current : null;
}

function syncBackgroundInert(): void {
  const roots = Array.from(trapRoots.values());

  if (roots.length === 0) {
    for (const [element, wasInert] of inertedElements) {
      if (!wasInert) element.removeAttribute('inert');
    }
    inertedElements.clear();
    return;
  }

  if (!supportsInert()) return;

  for (const child of Array.from(document.body.children)) {
    if (!(child instanceof HTMLElement)) continue;

    const containsOpenDialog = roots.some((root) => child === root || child.contains(root));

    if (containsOpenDialog) {
      const wasInert = inertedElements.get(child);
      if (wasInert === false) child.removeAttribute('inert');
      inertedElements.delete(child);
    } else if (!inertedElements.has(child)) {
      inertedElements.set(child, child.hasAttribute('inert'));
      child.setAttribute('inert', '');
    }
  }
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.hasAttribute('hidden') &&
      element.getAttribute('aria-hidden') !== 'true' &&
      element.closest('[inert]') === null
  );
}

export interface UseFocusTrapOptions {
  /** Whether the dialog is currently open. */
  active: boolean;
  /** The dialog element that focus must stay inside. */
  containerRef: RefObject<HTMLElement | null>;
  /** Element to focus when the dialog opens. Defaults to the first focusable control. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Called when Escape is pressed while this is the topmost trap. */
  onEscape?: () => void;
  /** Restore focus to the previously focused element when the trap deactivates. Defaults to true. */
  restoreFocus?: boolean;
}

/**
 * Keeps keyboard focus inside an open dialog and makes the rest of the page
 * inert. Handles initial focus, Tab/Shift+Tab wrapping (including controls
 * added after opening), Escape, nested dialogs, and focus restoration.
 */
export function useFocusTrap({
  active,
  containerRef,
  initialFocusRef,
  onEscape,
  restoreFocus = true,
}: UseFocusTrapOptions): void {
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const onEscapeRef = useRef(onEscape);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    const token = Symbol('focus-trap');
    const root = getTopLevelRoot(container);

    trapOrder.push(token);
    if (root) trapRoots.set(token, root);
    syncBackgroundInert();

    // Do not overwrite the original trigger when StrictMode re-runs the effect
    // after focus has already moved into the dialog.
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement && !container.contains(activeElement)) {
      previouslyFocusedRef.current = activeElement;
    }

    const initialTarget =
      initialFocusRef?.current ?? getFocusableElements(container)[0] ?? container;
    initialTarget.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (trapOrder[trapOrder.length - 1] !== token) return;

      if (event.key === 'Escape') {
        if (event.defaultPrevented || !onEscapeRef.current) return;
        event.preventDefault();
        onEscapeRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const index = focusable.indexOf(document.activeElement as HTMLElement);

      if (index === -1) {
        // Focus is outside the dialog, or on a non-tabbable element such as
        // the focused heading: enter the cycle at the appropriate end.
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && index === 0) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && index === focusable.length - 1) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      const orderIndex = trapOrder.indexOf(token);
      if (orderIndex !== -1) trapOrder.splice(orderIndex, 1);
      trapRoots.delete(token);
      syncBackgroundInert();

      const previous = previouslyFocusedRef.current;
      previouslyFocusedRef.current = null;

      if (restoreFocus && previous?.isConnected) {
        previous.focus();
      }
    };
  }, [active, containerRef, initialFocusRef, restoreFocus]);
}
