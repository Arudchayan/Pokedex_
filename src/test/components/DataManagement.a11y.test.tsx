import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithProvider } from '../utils';
import DataManagement from '../../components/shared/DataManagement';

// Mock scrollTo to prevent JSDOM errors
window.scrollTo = vi.fn();

describe('DataManagement Accessibility', () => {
  it('has an accessible close button', () => {
    renderWithProvider(<DataManagement onClose={() => {}} />);
    // Should fail if aria-label is missing
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('has a labeled import textarea', () => {
    renderWithProvider(<DataManagement onClose={() => {}} />);
    // Should fail if label association is missing
    const textarea = screen.getByLabelText(/paste json data|import data/i);
    expect(textarea).toBeInTheDocument();
  });

  it('announces validation errors via role="alert"', async () => {
    renderWithProvider(<DataManagement onClose={() => {}} />);

    const importBtn = screen.getByRole('button', { name: /restore backup/i });
    const textarea = screen.getByPlaceholderText('Paste JSON here...');
    fireEvent.change(textarea, { target: { value: 'invalid json' } });

    // Expect an alert to appear and the destructive action to stay disabled.
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/invalid json/i);
    expect(importBtn).toBeDisabled();
    expect(textarea).toHaveAttribute('aria-describedby', alert.id);
  });

  it('opens an accessible confirmation and focuses the safe Cancel action', () => {
    renderWithProvider(<DataManagement onClose={() => {}} />);

    const backup = {
      version: '1.0',
      timestamp: '2024-01-01T00:00:00.000Z',
      theme: 'dark',
      team: [],
      favorites: [],
      savedTeams: [],
    };

    const textarea = screen.getByPlaceholderText('Paste JSON here...');
    fireEvent.change(textarea, { target: { value: JSON.stringify(backup) } });
    fireEvent.click(screen.getByRole('button', { name: /restore backup/i }));

    const dialog = screen.getByRole('alertdialog', { name: 'Confirm restore' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Confirm Restore' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Confirm restore' })).toBeInTheDocument();
  });

  it('traps Tab inside the confirmation and Escape cancels only the confirmation', async () => {
    renderWithProvider(<DataManagement onClose={() => {}} />);

    const backup = {
      version: '1.0',
      timestamp: '2024-01-01T00:00:00.000Z',
      theme: 'dark',
      team: [],
      favorites: [],
      savedTeams: [],
    };

    const textarea = screen.getByPlaceholderText('Paste JSON here...');
    fireEvent.change(textarea, { target: { value: JSON.stringify(backup) } });
    fireEvent.click(screen.getByRole('button', { name: /restore backup/i }));

    const dialog = screen.getByRole('alertdialog', { name: 'Confirm restore' });
    const confirmButton = within(dialog).getByRole('button', { name: 'Confirm Restore' });
    const cancelButton = within(dialog).getByRole('button', { name: 'Cancel' });
    const downloadButton = within(dialog).getByRole('button', {
      name: 'Download current data first',
    });

    expect(cancelButton).toHaveFocus();

    downloadButton.focus();
    fireEvent.keyDown(downloadButton, { key: 'Tab' });
    expect(confirmButton).toHaveFocus();

    confirmButton.focus();
    fireEvent.keyDown(confirmButton, { key: 'Tab', shiftKey: true });
    expect(downloadButton).toHaveFocus();

    fireEvent.keyDown(downloadButton, { key: 'Escape' });

    await waitFor(() =>
      expect(screen.queryByRole('alertdialog', { name: 'Confirm restore' })).not.toBeInTheDocument()
    );
    expect(screen.getByRole('dialog', { name: 'Data Management' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Restore Backup' })).toHaveFocus()
    );
  });

  it('has correct dialog accessibility roles', () => {
    renderWithProvider(<DataManagement onClose={() => {}} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    // Modal wrapper uses auto-generated aria-labelledby pointing to the h2 title
    expect(dialog).toHaveAttribute('aria-labelledby');

    const heading = screen.getByRole('heading', { level: 2 });
    // Verify the heading id matches the dialog's aria-labelledby
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(heading).toHaveAttribute('id', labelledBy!);
  });
});
