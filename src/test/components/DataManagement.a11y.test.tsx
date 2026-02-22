import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
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

  it('announces status messages via role="alert"', async () => {
    renderWithProvider(<DataManagement onClose={() => {}} />);

    // Trigger an error (empty import)
    const importBtn = screen.getByRole('button', { name: /restore backup/i });

    // We need to type something invalid or trigger the button.
    // The component checks if importData is truthy before allowing click, or disabled.
    // Let's type something invalid.
    const textarea = screen.getByPlaceholderText('Paste JSON here...');
    fireEvent.change(textarea, { target: { value: 'invalid json' } });

    fireEvent.click(importBtn);

    // Expect an alert to appear
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/invalid json/i);
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
