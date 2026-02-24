import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import TeamExportModal from '../../components/team/TeamExportModal';
import { renderWithProvider } from '../utils';
import { MAX_INPUT_LENGTH } from '../../utils/securityUtils';

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('TeamExportModal DoS Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enforces maxLength on import textarea to prevent DoS', () => {
    renderWithProvider(<TeamExportModal isOpen={true} onClose={() => {}} team={[]} />);

    // Switch to Import tab
    const importTab = screen.getByRole('button', { name: 'Import' });
    fireEvent.click(importTab);

    // Find the textarea
    const textarea = screen.getByPlaceholderText(/Pikachu @ Light Ball/i);

    // Check for maxLength attribute
    expect(textarea).toHaveAttribute('maxLength', String(MAX_INPUT_LENGTH));
  });
});
