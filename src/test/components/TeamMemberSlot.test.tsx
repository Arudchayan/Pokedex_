import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TeamMemberSlot from '../../components/team/TeamMemberSlot';
import { TeamMember } from '../../types';

describe('TeamMemberSlot', () => {
  const mockMember: TeamMember = {
    id: 1,
    name: 'bulbasaur',
    types: ['grass', 'poison'],
    imageUrl: 'test-url',
    stats: [],
    moves: [],
    evs: {},
    ivs: {},
    nature: 'hardy',
    item: '',
    ability: '',
    shinyImageUrl: 'test-shiny-url',
    flavorText: 'seed pokemon',
    selectedAbility: '',
    selectedMoves: [],
    level: 50,
    abilities: [],
  };

  const defaultProps = {
    member: mockMember,
    theme: 'light',
    onRemove: vi.fn(),
    onSelect: vi.fn(),
    onEdit: vi.fn(),
    index: 1,
  };

  it('renders reorder handle with correct aria-label', () => {
    render(<TeamMemberSlot {...defaultProps} />);
    const handle = screen.getByTitle('Drag to reorder');
    expect(handle).toBeInTheDocument();
    expect(handle).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Reorder bulbasaur. Position 2.')
    );
  });

  it('renders with correct classes when dragging', () => {
    render(<TeamMemberSlot {...defaultProps} isDragging={true} />);
    // The component is an <article>
    // Note: screen.getByRole('article') might fail if implicit role isn't recognized, but article usually is.
    // However, let's verify if 'article' role is standard. Yes it is.
    // But testing-library sometimes prefers name.
    // Let's use getByTitle('Drag to reorder').closest('article') or similar if needed.
    // Or just verify className on what we have.

    // Actually, let's just query by text to find the container or something unique.
    // But wrapperRef is on the article.

    // Let's rely on class checking.
    const image = screen.getByAltText('bulbasaur');
    const article = image.closest('article');
    expect(article).toHaveClass('opacity-40');
  });
});
