import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SpeedTierAnalysis from './SpeedTierAnalysis';
import { TeamMember } from '../../types';

describe('SpeedTierAnalysis', () => {
  const mockTeam: TeamMember[] = [
    {
      id: 1,
      name: 'Pikachu',
      types: ['electric'],
      imageUrl: 'pikachu.png',
      shinyImageUrl: 'pikachu-shiny.png',
      flavorText: 'Pika Pika',
      stats: [{ name: 'speed', value: 90 }], // Base 90
      ivs: { speed: 31 },
      evs: { speed: 252 },
      selectedNature: 'Jolly', // +Speed
      selectedItem: 'Choice Scarf', // x1.5
    } as TeamMember,
    {
      id: 2,
      name: 'Slowpoke',
      types: ['water', 'psychic'],
      imageUrl: 'slowpoke.png',
      shinyImageUrl: 'slowpoke-shiny.png',
      flavorText: 'Slow...',
      stats: [{ name: 'speed', value: 15 }], // Base 15
      ivs: { speed: 0 },
      evs: { speed: 0 },
      selectedNature: 'Quiet', // +SpA -Spe
      selectedItem: 'Iron Ball', // x0.5
    } as TeamMember
  ];

  it('renders correctly with team members and benchmarks', () => {
    render(<SpeedTierAnalysis team={mockTeam} theme="light" />);

    expect(screen.getByText(/Speed Tiers/)).toBeInTheDocument();
    expect(screen.getByText('Pikachu')).toBeInTheDocument();
    expect(screen.getByText('Slowpoke')).toBeInTheDocument();

    // Check for benchmarks
    expect(screen.getByText('Regieleki (Max)')).toBeInTheDocument();
  });

  it('does not render if team is empty', () => {
      const { container } = render(<SpeedTierAnalysis team={[]} theme="light" />);
      expect(container).toBeEmptyDOMElement();
  });
});
