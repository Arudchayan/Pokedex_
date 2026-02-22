import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PokemonListRow from './PokemonListRow';
import * as soundService from '../../services/soundService';
import { PokemonListItem } from '../../types';
import React from 'react';

// Mock soundService
vi.mock('../../services/soundService', () => ({
    playPokemonCry: vi.fn(),
    playUISound: vi.fn(),
}));

const mockPokemon: PokemonListItem = {
    id: 1,
    name: 'bulbasaur',
    types: ['grass', 'poison'],
    imageUrl: 'test-url',
    shinyImageUrl: 'test-url-shiny',
    stats: [],
};

describe('PokemonListRow interaction', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('debounces playPokemonCry on mouse enter', () => {
        const { container } = render(
            <PokemonListRow
                pokemon={mockPokemon}
                onSelect={() => {}}
                theme="light"
            />
        );

        // The outer div handles the events
        const row = container.firstChild as HTMLElement;

        // Mouse Enter
        fireEvent.mouseEnter(row);

        // Immediate check: Should NOT be called yet
        expect(soundService.playPokemonCry).not.toHaveBeenCalled();

        // Advance 150ms
        vi.advanceTimersByTime(150);
        expect(soundService.playPokemonCry).not.toHaveBeenCalled();

        // Advance another 100ms (total 250ms)
        vi.advanceTimersByTime(100);
        expect(soundService.playPokemonCry).toHaveBeenCalledWith(1);
    });

    it('cancels playPokemonCry if mouse leaves before debounce', () => {
        const { container } = render(
            <PokemonListRow
                pokemon={mockPokemon}
                onSelect={() => {}}
                theme="light"
            />
        );

        const row = container.firstChild as HTMLElement;

        // Mouse Enter
        fireEvent.mouseEnter(row);

        // Advance 100ms
        vi.advanceTimersByTime(100);

        // Mouse Leave
        fireEvent.mouseLeave(row);

        // Advance remaining time
        vi.advanceTimersByTime(200);

        // Should NOT be called
        expect(soundService.playPokemonCry).not.toHaveBeenCalled();
    });
});
