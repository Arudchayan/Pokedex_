import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToastProvider, useToast } from '../../context/ToastContext';

// Test Component to expose hook
const TestComponent = () => {
  const { addToast, removeToast, toasts } = useToast();
  return (
    <div>
      <div data-testid="toast-count">{toasts.length}</div>
      {toasts.map((t) => (
        <div key={t.id} data-testid="toast-message">
          {t.message}
        </div>
      ))}
      <button onClick={() => addToast('Test Message', 'success', 1000)}>Add Toast</button>
      <button onClick={() => toasts.length > 0 && removeToast(toasts[0].id)}>Remove First</button>
    </div>
  );
};

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('provides toast context', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  it('adds a toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Add Toast').click();
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
    expect(screen.getByText('Test Message')).toBeInTheDocument();
  });

  it('removes a toast manually', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Add Toast').click();
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    act(() => {
      screen.getByText('Remove First').click();
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  it('auto-dismisses toast after duration', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Add Toast').click();
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });
});
