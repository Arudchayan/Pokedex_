import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../test/utils';
import BattleCalculator from './BattleCalculator';

// Mock TypeBadge since we don't need to test its rendering here
vi.mock('../charts/TypeBadge', () => ({
  default: ({ type }: { type: string }) => <span data-testid={`type-${type}`}>{type}</span>,
}));

describe('BattleCalculator Component Logic', () => {
  const onClose = vi.fn();

  it('should render correctly', () => {
    renderWithProvider(<BattleCalculator onClose={onClose} />);
    expect(screen.getByText('Battle Calculator')).toBeInTheDocument();
    expect(screen.getByText('Attacking Type')).toBeInTheDocument();
  });

  it('should calculate normal damage correctly (Normal vs Normal)', () => {
    renderWithProvider(<BattleCalculator onClose={onClose} />);

    // Default is usually Normal vs Normal which is 1x
    expect(screen.getByText('×1.00')).toBeInTheDocument();
    expect(screen.getByText('Normal Damage')).toBeInTheDocument();
  });

  it('should calculate super effective damage (Fire vs Grass)', () => {
    renderWithProvider(<BattleCalculator onClose={onClose} />);

    // 1. Select Fire as attacker
    // The attacker list is the first one. We can distinguish by container or just assume order.
    // However, since we mock TypeBadge with data-testid, all type buttons look similar.
    // The component has two sections: Attacker and Defender.
    // Attacker section buttons call setAttackerType
    // Defender section buttons call toggleDefenderType

    // Let's find the container.
    const attackerSection = screen.getByText('Attacking Type').closest('div');
    const defenderSection = screen.getByText(/Defending Type/i).closest('div');

    // Click Fire in Attacker section
    // We can scope queries.
    const fireBtn = (attackerSection as HTMLElement).querySelector(
      '[data-testid="type-fire"]'
    )?.parentElement;
    fireEvent.click(fireBtn!);

    // 2. Select Grass as defender
    // Default is 'normal'. We need to remove 'normal' and add 'grass'.
    // Or just add 'grass' (making it normal/grass) -> Fire vs Normal(1x) * Grass(2x) = 2x.
    // Let's try just adding Grass first.
    const grassDefBtn = (defenderSection as HTMLElement).querySelector(
      '[data-testid="type-grass"]'
    )?.parentElement;
    fireEvent.click(grassDefBtn!);

    // Now we have Normal/Grass.
    // Fire vs Normal = 1x
    // Fire vs Grass = 2x
    // Total = 2x.

    // If we wanted pure Grass, we'd need to unclick Normal.
    // Let's check if it is 2x.
    expect(screen.getByText('×2.00')).toBeInTheDocument();
    expect(screen.getByText('Super Effective!')).toBeInTheDocument();
  });

  it('should calculate immunity (Normal vs Ghost)', () => {
    renderWithProvider(<BattleCalculator onClose={onClose} />);

    const defenderSection = screen.getByText(/Defending Type/i).closest('div');

    // Default Attacker: Normal
    // Default Defender: Normal

    // We want Defender: Ghost (or Normal/Ghost)
    // Normal vs Ghost = 0x
    // Normal vs Normal = 1x
    // 1 * 0 = 0. So Normal/Ghost is fine.

    const ghostDefBtn = (defenderSection as HTMLElement).querySelector(
      '[data-testid="type-ghost"]'
    )?.parentElement;
    fireEvent.click(ghostDefBtn!);

    expect(screen.getByText('×0.00')).toBeInTheDocument();
    expect(screen.getByText('No Effect')).toBeInTheDocument();
  });

  it('should handle dual types (Fire vs Grass/Bug)', () => {
    // Fire vs Grass (2x) * Bug (2x) = 4x
    renderWithProvider(<BattleCalculator onClose={onClose} />);

    const attackerSection = screen.getByText('Attacking Type').closest('div');
    const defenderSection = screen.getByText(/Defending Type/i).closest('div');

    // Attacker: Fire
    const fireBtn = (attackerSection as HTMLElement).querySelector(
      '[data-testid="type-fire"]'
    )?.parentElement;
    fireEvent.click(fireBtn!);

    // Defender: Currently Normal.
    // We need Grass and Bug.
    // If we just add Grass and Bug, we get Normal/Grass (max 2 types).
    // Logic: if length < 2, add. If in list, remove.
    // Current: ['normal']

    // Remove Normal
    const normalDefBtn = (defenderSection as HTMLElement).querySelector(
      '[data-testid="type-normal"]'
    )?.parentElement;
    fireEvent.click(normalDefBtn!);
    // Current: [] (Actually logic might prevent empty list? Let's check component code)
    // Component: if (defenderTypes.includes(type)) { if length > 1 remove }
    // So we cannot remove the last type. We must add another first.

    // Add Grass
    const grassDefBtn = (defenderSection as HTMLElement).querySelector(
      '[data-testid="type-grass"]'
    )?.parentElement;
    fireEvent.click(grassDefBtn!);
    // Current: ['normal', 'grass']

    // Remove Normal
    fireEvent.click(normalDefBtn!);
    // Current: ['grass']

    // Add Bug
    const bugDefBtn = (defenderSection as HTMLElement).querySelector(
      '[data-testid="type-bug"]'
    )?.parentElement;
    fireEvent.click(bugDefBtn!);
    // Current: ['grass', 'bug']

    expect(screen.getByText('×4.00')).toBeInTheDocument();
    expect(screen.getByText('Extremely Effective!')).toBeInTheDocument();
  });
});
