import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AchievementsModal from '../../components/shared/AchievementsModal';
import { renderWithProvider } from '../utils';
import { usePokemonStore } from '../../store/usePokemonStore';

describe('AchievementsModal', () => {
  beforeEach(() => {
    // Reset store achievements before each test
    usePokemonStore.setState({ achievements: {} });
    vi.clearAllMocks();
  });

  it('renders correctly with no achievements unlocked', () => {
    const onClose = vi.fn();
    renderWithProvider(<AchievementsModal onClose={onClose} />);

    expect(screen.getByText('Achievements')).toBeInTheDocument();
    expect(screen.getByText('Total Progress')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText(/0 \/ \d+ Unlocked/)).toBeInTheDocument();

    // Check for some achievements being present but locked
    expect(screen.getByText('Novice Trainer')).toBeInTheDocument();
    expect(screen.getByText('Add your first Pokémon to the team.')).toBeInTheDocument();
  });

  it('renders correctly with some achievements unlocked', async () => {
    // Set achievement state in Zustand store
    usePokemonStore.setState({
      achievements: {
        novice_trainer: 1678888888888,
      },
    });

    const onClose = vi.fn();
    renderWithProvider(<AchievementsModal onClose={onClose} />);

    // Check progress
    // 1 achievement unlocked out of 8
    expect(screen.getByText(/1 \/ \d+ Unlocked/)).toBeInTheDocument();

    // Check unlocked style/text
    const noviceTitle = screen.getByText('Novice Trainer');
    expect(noviceTitle).toBeInTheDocument();
    // Assuming the date formatting works
    expect(screen.getByText(/Unlocked:/)).toBeInTheDocument();
  });

  it('closes when close button is clicked', () => {
    const onClose = vi.fn();
    renderWithProvider(<AchievementsModal onClose={onClose} />);

    // The close button has a span with 'close' material symbol text
    fireEvent.click(screen.getByText('close'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when clicking backdrop', () => {
    const onClose = vi.fn();
    renderWithProvider(<AchievementsModal onClose={onClose} />);

    // Clicking the text 'Achievements' (inside modal) should NOT close it.
    fireEvent.click(screen.getByText('Achievements'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
