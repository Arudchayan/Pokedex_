type LogFn = (...args: unknown[]) => void;

type ImportMetaEnvLike = {
  MODE?: unknown;
  DEV?: unknown;
};

const getImportMetaEnv = (): ImportMetaEnvLike | undefined => {
  try {
    return (import.meta as ImportMeta & { env?: ImportMetaEnvLike }).env;
  } catch {
    return undefined;
  }
};

const getEnvMode = (): string | undefined => {
  const mode = getImportMetaEnv()?.MODE;
  return typeof mode === 'string' ? mode : undefined;
};

const isTestEnv = (): boolean => {
  const mode = getEnvMode();
  if (mode === 'test') return true;
  // Vitest also sets NODE_ENV=test by default.
  return typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
};

const isDevEnv = (): boolean => {
  if (isTestEnv()) return false;
  return getImportMetaEnv()?.DEV === true;
};

const safeConsole = {
  debug: (...args: unknown[]) => console.debug(...args),
  info: (...args: unknown[]) => console.info(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
};

const makeDevOnly = (fn: LogFn): LogFn => {
  return (...args) => {
    if (!isDevEnv()) return;
    fn(...args);
  };
};

const makeNotTest = (fn: LogFn): LogFn => {
  return (...args) => {
    if (isTestEnv()) return;
    fn(...args);
  };
};

export const logger = {
  // Default: keep test output clean and avoid leaking noisy logs into production bundles.
  debug: makeDevOnly(safeConsole.debug),
  info: makeDevOnly(safeConsole.info),
  warn: makeNotTest(safeConsole.warn),
  error: safeConsole.error,
};

export default logger;
