import React, { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MobileDrawer from '../../components/layout/MobileDrawer';
import { installInertSupport } from '../inertSupport';
import { renderWithProvider } from '../utils';

type MediaListener = (event: MediaQueryListEvent) => void;

function installMatchMedia(initialMatches: boolean) {
  const listeners = new Set<MediaListener>();
  const mediaQueryList = {
    matches: initialMatches,
    media: '(min-width: 768px)',
    onchange: null,
    addEventListener: (_type: string, listener: MediaListener) => listeners.add(listener),
    removeEventListener: (_type: string, listener: MediaListener) => listeners.delete(listener),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  const original = window.matchMedia;

  window.matchMedia = vi
    .fn()
    .mockReturnValue(mediaQueryList) as unknown as typeof window.matchMedia;

  return {
    setMatches: (matches: boolean) => {
      mediaQueryList.matches = matches;
      listeners.forEach((listener) =>
        listener({ matches, media: mediaQueryList.media } as MediaQueryListEvent)
      );
    },
    restore: () => {
      window.matchMedia = original;
    },
  };
}

function DrawerHarness() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Open navigation menu
      </button>
      <main id="main-content" tabIndex={-1}>
        Main content
      </main>
      <button type="button">Background action</button>
      <MobileDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} onRandomPokemon={vi.fn()} />
    </>
  );
}

type User = ReturnType<typeof userEvent.setup>;

const renderHarness = () => {
  const view = renderWithProvider(<DrawerHarness />);
  return {
    ...view,
    trigger: screen.getByRole('button', { name: 'Open navigation menu' }),
  };
};

const openDrawer = async (user: User, trigger: HTMLElement) => {
  await user.click(trigger);
  const dialog = screen.getByRole('dialog', { name: 'Navigation menu' });
  await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  return dialog;
};

describe('MobileDrawer focus management', () => {
  it('moves focus to the first navigation item when opened', async () => {
    const user = userEvent.setup({ delay: null });
    const { trigger } = renderHarness();

    const dialog = await openDrawer(user, trigger);

    expect(within(dialog).getByRole('button', { name: 'Move Dex' })).toHaveFocus();
  });

  it('wraps Tab from the last control to the first and Shift+Tab back again', async () => {
    const user = userEvent.setup({ delay: null });
    const { trigger } = renderHarness();

    const dialog = await openDrawer(user, trigger);
    const first = within(dialog).getByRole('button', { name: 'Close menu' });
    const last = within(dialog).getByRole('button', { name: 'Data Management' });

    last.focus();
    await user.tab();
    expect(first).toHaveFocus();

    await user.tab({ shift: true });
    expect(last).toHaveFocus();
  });

  it('keeps Tab and Shift+Tab inside the drawer', async () => {
    const user = userEvent.setup({ delay: null });
    const { trigger } = renderHarness();

    const dialog = await openDrawer(user, trigger);
    const backgroundAction = screen.getByRole('button', { name: 'Background action' });

    for (let i = 0; i < 24; i += 1) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
      expect(document.activeElement).not.toBe(trigger);
      expect(document.activeElement).not.toBe(backgroundAction);
    }

    for (let i = 0; i < 24; i += 1) {
      await user.tab({ shift: true });
      expect(dialog.contains(document.activeElement)).toBe(true);
      expect(document.activeElement).not.toBe(trigger);
      expect(document.activeElement).not.toBe(backgroundAction);
    }
  }, 20000);

  it('closes on Escape and restores focus to the trigger', async () => {
    const user = userEvent.setup({ delay: null });
    const { trigger } = renderHarness();

    const dialog = await openDrawer(user, trigger);

    await user.keyboard('{Escape}');

    await waitFor(() => expect(trigger).toHaveFocus());
    expect(dialog).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('mobile-drawer-root')).toHaveAttribute('inert');
  });

  it('closes via the Close control and restores focus to the trigger', async () => {
    const user = userEvent.setup({ delay: null });
    const { trigger } = renderHarness();

    const dialog = await openDrawer(user, trigger);

    await user.click(within(dialog).getByRole('button', { name: 'Close menu' }));

    await waitFor(() => expect(trigger).toHaveFocus());
    expect(dialog).toHaveAttribute('aria-hidden', 'true');
  });

  it('closes on a backdrop click and restores focus to the trigger', async () => {
    const user = userEvent.setup({ delay: null });
    const { trigger } = renderHarness();

    await openDrawer(user, trigger);

    await user.click(screen.getByTestId('mobile-drawer-backdrop'));

    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.getByTestId('mobile-drawer-root')).toHaveAttribute('inert');
  });

  it('keeps the trap working while the theme panel is open', async () => {
    const user = userEvent.setup({ delay: null });
    const { trigger } = renderHarness();

    const dialog = await openDrawer(user, trigger);
    const themeTrigger = within(dialog).getByRole('button', {
      name: 'Customize theme settings',
    });

    await user.click(themeTrigger);
    const firstThemeControl = within(dialog).getByRole('button', { name: 'Light' });

    await user.tab();
    expect(firstThemeControl).toHaveFocus();

    await user.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);

    await user.keyboard('{Escape}');

    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('marks the background inert while open and clears it on close', async () => {
    const restoreInert = installInertSupport();

    try {
      const user = userEvent.setup({ delay: null });
      const { trigger, container } = renderHarness();

      const dialog = await openDrawer(user, trigger);

      expect(container).toHaveAttribute('inert');
      expect(dialog).not.toHaveAttribute('inert');

      await user.keyboard('{Escape}');

      await waitFor(() => expect(trigger).toHaveFocus());
      expect(container).not.toHaveAttribute('inert');
      expect(screen.getByTestId('mobile-drawer-root')).toHaveAttribute('inert');
    } finally {
      restoreInert();
    }
  });

  it('closes and releases the page when the viewport reaches the md breakpoint', async () => {
    const restoreInert = installInertSupport();
    const media = installMatchMedia(false);

    try {
      const user = userEvent.setup({ delay: null });
      const { trigger, container } = renderHarness();

      const dialog = await openDrawer(user, trigger);
      expect(container).toHaveAttribute('inert');
      expect(document.body.style.overflow).toBe('hidden');

      // jsdom does not evaluate Tailwind's md:hidden, so emulate the CSS that
      // hides the trigger once the viewport reaches 768px.
      trigger.style.display = 'none';

      act(() => media.setMatches(true));

      await waitFor(() => expect(dialog).toHaveAttribute('aria-hidden', 'true'));
      await waitFor(() => expect(screen.getByRole('main')).toHaveFocus());
      expect(container).not.toHaveAttribute('inert');
      expect(screen.getByTestId('mobile-drawer-root')).toHaveAttribute('inert');
      expect(document.body.style.overflow).toBe('');
    } finally {
      media.restore();
      restoreInert();
    }
  });

  it('keeps the closed drawer inert, off-screen, and out of the accessibility tree', () => {
    renderHarness();

    const root = screen.getByTestId('mobile-drawer-root');
    const dialog = within(root).getByLabelText('Navigation menu');

    expect(root).toHaveAttribute('inert');
    expect(dialog).toHaveAttribute('aria-hidden', 'true');
    expect(dialog).toHaveClass('-translate-x-full');
  });
});
