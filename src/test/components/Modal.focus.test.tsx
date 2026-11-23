import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../../components/base/Modal';
import { installInertSupport } from '../inertSupport';

function NestedModals() {
  const [outerOpen, setOuterOpen] = useState(true);
  const [innerOpen, setInnerOpen] = useState(false);

  return (
    <>
      <Modal isOpen={outerOpen} onClose={() => setOuterOpen(false)} title="Outer dialog">
        <button type="button" onClick={() => setInnerOpen(true)}>
          Open inner dialog
        </button>
      </Modal>
      <Modal isOpen={innerOpen} onClose={() => setInnerOpen(false)} title="Inner dialog">
        <button type="button">Inner action</button>
      </Modal>
    </>
  );
}

function TriggeredModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <main id="main-content" tabIndex={-1}>
        Main content
      </main>
      <button type="button" onClick={() => setOpen(true)}>
        Open triggered dialog
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Triggered dialog">
        <button type="button">Dialog action</button>
      </Modal>
    </>
  );
}

describe('Modal focus management', () => {
  it('keeps nested dialogs independently trapped and restores focus between them', async () => {
    const user = userEvent.setup();
    render(<NestedModals />);

    const outer = screen.getByRole('dialog', { name: 'Outer dialog' });
    expect(within(outer).getByRole('button', { name: 'Close' })).toHaveFocus();

    const opener = within(outer).getByRole('button', { name: 'Open inner dialog' });
    await user.click(opener);

    const inner = screen.getByRole('dialog', { name: 'Inner dialog' });
    const innerClose = within(inner).getByRole('button', { name: 'Close' });
    const innerAction = within(inner).getByRole('button', { name: 'Inner action' });
    expect(innerClose).toHaveFocus();

    innerAction.focus();
    await user.tab();
    expect(innerClose).toHaveFocus();

    await user.tab({ shift: true });
    expect(innerAction).toHaveFocus();

    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Inner dialog' })).not.toBeInTheDocument()
    );
    expect(screen.getByRole('dialog', { name: 'Outer dialog' })).toBeInTheDocument();
    expect(opener).toHaveFocus();

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('restores focus to a page trigger opened after mount', async () => {
    const user = userEvent.setup({ delay: null });
    render(<TriggeredModal />);

    const trigger = screen.getByRole('button', { name: 'Open triggered dialog' });
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Triggered dialog' })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Triggered dialog' })).not.toBeInTheDocument()
    );
    expect(trigger).toHaveFocus();
  });

  it('falls back to main content when the invoking control is hidden', async () => {
    const user = userEvent.setup({ delay: null });
    render(<TriggeredModal />);

    const trigger = screen.getByRole('button', { name: 'Open triggered dialog' });
    await user.click(trigger);
    trigger.style.display = 'none';

    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Triggered dialog' })).not.toBeInTheDocument()
    );
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('keeps nested dialog roots out of the inert background', async () => {
    const restoreInert = installInertSupport();

    try {
      const user = userEvent.setup({ delay: null });
      render(<NestedModals />);

      const appRoot = document.querySelector('body > div:not([role="dialog"])');
      const outer = screen.getByRole('dialog', { name: 'Outer dialog' });
      expect(appRoot).toHaveAttribute('inert');

      await user.click(within(outer).getByRole('button', { name: 'Open inner dialog' }));

      const inner = screen.getByRole('dialog', { name: 'Inner dialog' });
      expect(outer).not.toHaveAttribute('inert');
      expect(inner).not.toHaveAttribute('inert');
      expect(appRoot).toHaveAttribute('inert');

      await user.keyboard('{Escape}');

      await waitFor(() =>
        expect(screen.queryByRole('dialog', { name: 'Inner dialog' })).not.toBeInTheDocument()
      );
      expect(appRoot).toHaveAttribute('inert');

      await user.keyboard('{Escape}');

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(appRoot).not.toHaveAttribute('inert');
    } finally {
      restoreInert();
    }
  });
});
