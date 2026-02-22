
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EvolutionGraph from './EvolutionGraph';
import { Evolution } from '../../types';
import { renderWithProvider } from '../../test/utils';

describe('EvolutionGraph', () => {
    const mockChain: Evolution[] = [
        {
            id: 1,
            name: 'bulbasaur',
            imageUrl: 'bulbasaur.png',
            evolvesFromId: null
        },
        {
            id: 2,
            name: 'ivysaur',
            imageUrl: 'ivysaur.png',
            evolvesFromId: 1,
            trigger: 'level-up',
            minLevel: 16
        },
        {
            id: 3,
            name: 'venusaur',
            imageUrl: 'venusaur.png',
            evolvesFromId: 2,
            trigger: 'level-up',
            minLevel: 32
        }
    ];

    const complexChain: Evolution[] = [
        {
            id: 60,
            name: 'poliwag',
            imageUrl: 'poliwag.png',
            evolvesFromId: null
        },
        {
            id: 61,
            name: 'poliwhirl',
            imageUrl: 'poliwhirl.png',
            evolvesFromId: 60,
            trigger: 'level-up',
            minLevel: 25
        },
        {
            id: 186,
            name: 'politoed',
            imageUrl: 'politoed.png',
            evolvesFromId: 61,
            trigger: 'trade',
            heldItem: "King's Rock"
        }
    ];

    const itemChain: Evolution[] = [
        {
            id: 133,
            name: 'eevee',
            imageUrl: 'eevee.png',
            evolvesFromId: null
        },
        {
            id: 134,
            name: 'vaporeon',
            imageUrl: 'vaporeon.png',
            evolvesFromId: 133,
            trigger: 'use item',
            item: 'water stone'
        }
    ];

    it('renders basic level up chain', () => {
        renderWithProvider(<EvolutionGraph chain={mockChain} onSelectPokemon={() => {}} />);

        expect(screen.getByText('bulbasaur')).toBeInTheDocument();
        expect(screen.getByText('ivysaur')).toBeInTheDocument();
        expect(screen.getByText('venusaur')).toBeInTheDocument();

        // Check triggers
        const levels = screen.getAllByText(/Lvl/);
        expect(levels).toHaveLength(2); // Lvl 16, Lvl 32
    });

    it('renders trade with held item', () => {
        renderWithProvider(<EvolutionGraph chain={complexChain} onSelectPokemon={() => {}} />);

        expect(screen.getByText('politoed')).toBeInTheDocument();
        // The label combines them: "Trade, Hold King's Rock"
        expect(screen.getByText(/Trade/)).toBeInTheDocument();
        expect(screen.getByText(/Hold/)).toBeInTheDocument();
        expect(screen.getByText("King's Rock")).toBeInTheDocument();
    });

    it('renders use item trigger', () => {
        renderWithProvider(<EvolutionGraph chain={itemChain} onSelectPokemon={() => {}} />);

        expect(screen.getByText('vaporeon')).toBeInTheDocument();
        // "Use Item" is implied by "water stone", so we just check for the item
        expect(screen.getByText('water stone')).toBeInTheDocument();
    });

    it('handles interaction', () => {
        const handleSelect = vi.fn();
        renderWithProvider(<EvolutionGraph chain={mockChain} onSelectPokemon={handleSelect} />);

        // Click the node
        fireEvent.click(screen.getByText('bulbasaur'));
        expect(handleSelect).toHaveBeenCalledWith(1);
    });

    it('calls onOpenItemDex when item is clicked', () => {
        const handleOpenItemDex = vi.fn();
        renderWithProvider(<EvolutionGraph chain={itemChain} onSelectPokemon={() => {}} onOpenItemDex={handleOpenItemDex} />);

        const itemButton = screen.getByText('water stone');
        fireEvent.click(itemButton);
        expect(handleOpenItemDex).toHaveBeenCalledWith('water stone');
    });
});
