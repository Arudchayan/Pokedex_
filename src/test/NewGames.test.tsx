import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { renderWithProvider, setPokeapiServiceMock } from './utils';
import MoveGame from '../components/games/MoveGame';
import ItemGame from '../components/games/ItemGame';
import TrainerGame from '../components/games/TrainerGame';

const mockClose = vi.fn();

describe('New Games Integration', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        setPokeapiServiceMock();
    });

    it('renders MoveGame and loads data', async () => {
        renderWithProvider(<MoveGame onClose={mockClose} date="2023-10-27" seed={123} />);
        expect(screen.getByText(/MoveDle/i)).toBeInTheDocument();
        expect(screen.getByText(/Loading/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
        });

        const input = screen.getByPlaceholderText(/Guess a move/i);
        expect(input).toBeInTheDocument();
    });

    it('renders ItemGame and loads data', async () => {
        renderWithProvider(<ItemGame onClose={mockClose} date="2023-10-27" seed={123} />);
        expect(screen.getByText(/ItemDle/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
        });

        const input = screen.getByPlaceholderText(/What item is this/i);
        expect(input).toBeInTheDocument();
    });

    it('renders TrainerGame and loads data', async () => {
        renderWithProvider(<TrainerGame onClose={mockClose} date="2023-10-27" seed={123} />);
        expect(screen.getByText(/TrainerDle/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
        });

        const input = screen.getByPlaceholderText(/Who is this trainer/i);
        expect(input).toBeInTheDocument();
    });

});
