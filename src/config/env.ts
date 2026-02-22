/**
 * Environment configuration
 * Provides type-safe access to environment variables
 */

interface EnvConfig {
  // API
  pokeapiUrl: string;
  apiTimeout: number;
  maxRetries: number;

  // Feature Flags
  enableAnalytics: boolean;
  enablePerformanceMonitoring: boolean;
  enableErrorReporting: boolean;

  // App Config
  pokemonPerPage: number;
  teamCapacity: number;
  maxComparison: number;

  // Audio
  defaultAudioEnabled: boolean;
  audioVolume: number;

  // Environment
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * Parse environment variable as boolean
 */
const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
};

/**
 * Parse environment variable as number
 */
const parseNumber = (value: string | undefined, defaultValue: number): number => {
  if (value === undefined) return defaultValue;
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Parse environment variable as integer
 */
const parseInteger = (value: string | undefined, defaultValue: number): number => {
  if (value === undefined) return defaultValue;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Get environment configuration
 */
export const getEnvConfig = (): EnvConfig => {
  return {
    // API
    pokeapiUrl:
      import.meta.env.VITE_POKEAPI_GRAPHQL_URL || 'https://beta.pokeapi.co/graphql/v1beta',
    apiTimeout: parseInteger(import.meta.env.VITE_API_TIMEOUT, 30000),
    maxRetries: parseInteger(import.meta.env.VITE_MAX_RETRIES, 3),

    // Feature Flags
    enableAnalytics: parseBoolean(import.meta.env.VITE_ENABLE_ANALYTICS, false),
    enablePerformanceMonitoring: parseBoolean(
      import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING,
      false
    ),
    enableErrorReporting: parseBoolean(import.meta.env.VITE_ENABLE_ERROR_REPORTING, false),

    // App Config
    pokemonPerPage: parseInteger(import.meta.env.VITE_POKEMON_PER_PAGE, 24),
    teamCapacity: parseInteger(import.meta.env.VITE_TEAM_CAPACITY, 6),
    maxComparison: parseInteger(import.meta.env.VITE_MAX_COMPARISON, 4),

    // Audio
    defaultAudioEnabled: parseBoolean(import.meta.env.VITE_DEFAULT_AUDIO_ENABLED, true),
    audioVolume: Math.max(0, Math.min(1, parseNumber(import.meta.env.VITE_AUDIO_VOLUME, 0.3))),

    // Environment
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  };
};

// Export singleton instance
export const env = getEnvConfig();

export default env;
