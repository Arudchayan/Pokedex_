import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MobileTeamSheet from '../../components/team/MobileTeamSheet';
import { installInertSupport } from '../inertSupport';
import type { TeamMember } from '../../types';

const team: TeamMember[] = [
  {
    id: 1,
    name: 'bulbasaur',
    imageUrl: 'img1.png',
    shinyImageUrl: '',
    types: ['grass', 'poison'],
    flavorText: '',
    stats: [],
    abilities: [],
  },
  {
    id: 4,
    name: 'charmander',
    imageUrl: 'img4.png',
    shinyImageUrl: '',
    types: ['fire'],
    flavorText: '',
    stats: [],
    abilities: [],
  },
];

const renderSheet = () => {
  const onRemove = vi.fn();
  const onClear = vi.fn();
  const onSelect = vi.fn();

  render(
    <div>
      <button type="button">Background action</button>
      <MobileTeamSheet
        team={team}
        onRemove={onRemove}
        onClear={onClear}
        onSelect={onSelect}
        teamCapacity={4}
        theme="light"
      />
    </div>
  );

  return { onRemove, onClear, onSelect };
};

type User = ReturnType<typeof userEvent.setup>;

const getTrigger = () => screen.getByRole('button', { name: /Team: 2\/4/i });

const openSheet = async (user: User) => {
  await user.click(getTrigger());
  const dialog = screen.getByRole('dialog', { name: 'Team Builder' });
  await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  return dialog;
};

describe('MobileTeamSheet focus management', () => {
  it('moves focus to the dialog heading when opened', async () => {
    const user = userEvent.setup({ delay: null });
    renderSheet();

    const dialog = await openSheet(user);

    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByRole('heading', { name: 'Team Builder', level: 2 })).toHaveFocus();
  });

  it('wraps Tab from the last control to the first and Shift+Tab back again', async () => {
    const user = userEvent.setup({ delay: null });
    renderSheet();

    const dialog = await openSheet(user);
    const first = within(dialog).getByRole('button', { name: 'Clear All' });
    const last = within(dialog).getByRole('button', { name: 'Add a Pokémon to slot 4 of 4' });

    last.focus();
    await user.tab();
    expect(first).toHaveFocus();

    await user.tab({ shift: true });
    expect(last).toHaveFocus();
  });

  it('keeps Tab and Shift+Tab inside the dialog', async () => {
    const user = userEvent.setup({ delay: null });
    renderSheet();

    const trigger = getTrigger();
    const backgroundAction = screen.getByRole('button', { name: 'Background action' });
    const dialog = await openSheet(user);

    for (let i = 0; i < 12; i += 1) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
      expect(document.activeElement).not.toBe(trigger);
      expect(document.activeElement).not.toBe(backgroundAction);
    }

    for (let i = 0; i < 12; i += 1) {
      await user.tab({ shift: true });
      expect(dialog.contains(document.activeElement)).toBe(true);
      expect(document.activeElement).not.toBe(trigger);
      expect(document.activeElement).not.toBe(backgroundAction);
    }
  }, 15000);

  it('closes on Escape and restores focus to the trigger', async () => {
    const user = userEvent.setup({ delay: null });
    renderSheet();

    const trigger = getTrigger();
    await openSheet(user);

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('closes via the Close control and restores focus to the trigger', async () => {
    const user = userEvent.setup({ delay: null });
    renderSheet();

    const trigger = getTrigger();
    const dialog = await openSheet(user);

    await user.click(within(dialog).getByRole('button', { name: 'Close team builder' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('skips controls hidden by CSS or aria-hidden when wrapping', async () => {
    const user = userEvent.setup({ delay: null });
    renderSheet();

    const dialog = await openSheet(user);
    const first = within(dialog).getByRole('button', { name: 'Clear All' });
    const slot3 = within(dialog).getByRole('button', { name: 'Add a Pokémon to slot 3 of 4' });
    const slot4 = within(dialog).getByRole('button', { name: 'Add a Pokémon to slot 4 of 4' });
    const lastMemberRemove = within(dialog).getByRole('button', {
      name: 'Remove charmander from team',
    });

    slot4.style.display = 'none';
    first.focus();
    await user.tab({ shift: true });
    expect(slot3).toHaveFocus();

    slot3.setAttribute('aria-hidden', 'true');
    first.focus();
    await user.tab({ shift: true });
    expect(lastMemberRemove).toHaveFocus();
  });

  it('marks the background inert while open and clears it on close', async () => {
    const restoreInert = installInertSupport();

    try {
      const user = userEvent.setup({ delay: null });
      renderSheet();

      const trigger = getTrigger();
      const appRoot = trigger.closest('body > *');
      await openSheet(user);

      expect(appRoot).toHaveAttribute('inert');

      await user.keyboard('{Escape}');

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(appRoot).not.toHaveAttribute('inert');
    } finally {
      restoreInert();
    }
  });
});
