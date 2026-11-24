import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { retryApiCall } from '../utils/errorHandler';

describe('retryApiCall', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stops after three attempts with exponential backoff', async () => {
    const apiCall = vi.fn().mockRejectedValue(new Error('offline'));
    const result = retryApiCall(apiCall, 3, 2000).catch((error: Error) => error);

    await vi.advanceTimersByTimeAsync(0);
    expect(apiCall).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1999);
    expect(apiCall).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(apiCall).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(3999);
    expect(apiCall).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1);
    expect(apiCall).toHaveBeenCalledTimes(3);

    await expect(result).resolves.toEqual(new Error('offline'));

    await vi.advanceTimersByTimeAsync(60_000);
    expect(apiCall).toHaveBeenCalledTimes(3);
  });

  it('does not keep retrying after the request signal is aborted', async () => {
    const controller = new AbortController();
    const apiCall = vi.fn().mockRejectedValue(new Error('offline'));
    const result = retryApiCall(apiCall, 3, 2000, controller.signal).catch((error: Error) => error);

    controller.abort();
    await vi.advanceTimersByTimeAsync(60_000);

    await expect(result).resolves.toEqual(new Error('offline'));
    expect(apiCall).toHaveBeenCalledTimes(1);
  });
});
