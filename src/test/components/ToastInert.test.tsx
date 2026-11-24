import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../../components/base/Modal';
import { useToast } from '../../context/ToastContext';
import { installInertSupport } from '../inertSupport';
import { renderWithProvider } from '../utils';

function ToastHarness() {
  const [open, setOpen] = useState(false);
  const { addToast } = useToast();

  return (
    <>
      <button type="button" onClick={() => addToast('Saved', 'success', 0)}>
        Show notification
      </button>
      <button type="button" onClick={() => setOpen(true)}>
        Open dialog
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Settings">
        <button type="button">Dialog action</button>
      </Modal>
    </>
  );
}

describe('Toast inert exemption', () => {
  it('keeps notifications visible and interactive while a dialog is open', async () => {
    const restoreInert = installInertSupport();

    try {
      const user = userEvent.setup({ delay: null });
      renderWithProvider(<ToastHarness />);

      await user.click(screen.getByRole('button', { name: 'Show notification' }));
      const toast = await screen.findByRole('alert');
      expect(toast).toHaveTextContent('Saved');

      await user.click(screen.getByRole('button', { name: 'Open dialog' }));

      expect(document.querySelector('[inert]')).not.toBeNull();
      expect(toast.closest('[data-inert-exempt]')).not.toBeNull();
      expect(toast.closest('[inert]')).toBeNull();

      await user.click(within(toast).getByRole('button', { name: 'Dismiss notification' }));

      await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    } finally {
      restoreInert();
    }
  });
});
