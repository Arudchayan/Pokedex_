import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import AbilityDex from './AbilityDex';
import ItemDex from './ItemDex';
import MoveDex from './MoveDex';
import { renderWithProvider } from '../../test/utils';

// Mock global fetch
const globalFetch = global.fetch;

describe('Dex Components Accessibility', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        data: {
          pokemon_v2_ability: [],
          pokemon_v2_item: [],
          pokemon_v2_move: []
        }
      }),
    });
  });

  afterEach(() => {
    global.fetch = globalFetch;
    vi.restoreAllMocks();
  });

  describe('AbilityDex', () => {
    it('has accessible dialog role and labeled input', async () => {
      renderWithProvider(<AbilityDex onClose={() => {}} />);

      const dialog = await waitFor(() => screen.getByRole('dialog'));
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      // Modal wrapper uses aria-labelledby pointing to the h2 title element
      expect(dialog).toHaveAttribute('aria-labelledby');

      // Verify the title is rendered
      expect(screen.getByRole('heading', { name: 'Ability Dex' })).toBeInTheDocument();

      const input = screen.getByLabelText(/search/i);
      expect(input).toBeInTheDocument();
    });
  });

  describe('ItemDex', () => {
    it('has accessible dialog role and labeled input', async () => {
      renderWithProvider(<ItemDex onClose={() => {}} />);

      const dialog = await waitFor(() => screen.getByRole('dialog'));
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');

      expect(screen.getByRole('heading', { name: 'Item Dex' })).toBeInTheDocument();

      const input = screen.getByLabelText(/search/i);
      expect(input).toBeInTheDocument();
    });
  });

  describe('MoveDex', () => {
    it('has accessible dialog role and labeled input', async () => {
      renderWithProvider(<MoveDex onClose={() => {}} />);

      const dialog = await waitFor(() => screen.getByRole('dialog'));
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');

      expect(screen.getByRole('heading', { name: 'Move Dex' })).toBeInTheDocument();

      const input = screen.getByLabelText(/search/i);
      expect(input).toBeInTheDocument();
    });
  });
});
