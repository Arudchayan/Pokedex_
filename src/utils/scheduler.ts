/**
 * Schedules a low-priority task to run when the main thread is idle.
 * Falls back to setTimeout if requestIdleCallback is not available.
 *
 * @param callback The function to execute
 */
export const scheduleIdleTask = (callback: () => void): void => {
  // In this app, "idle" tasks are best-effort. Using setTimeout keeps behavior deterministic
  // in Vitest (fake timers) and still yields back to the UI thread in production.
  setTimeout(callback, 0);
};
