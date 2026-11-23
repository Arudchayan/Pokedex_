import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../../components/base/Modal';

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
});
