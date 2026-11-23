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

/** Supported PokeAPI GraphQL endpoint (v1beta2 schema). */
export const DEFAULT_POKEAPI_GRAPHQL_URL = 'https://graphql.pokeapi.co/v1beta2';

/**
 * Hosts that used to serve the GraphQL API but now reject requests (HTTP 401 with no CORS
 * headers). A deployment may still have `VITE_POKEAPI_GRAPHQL_URL` pointing at one of these,
 * so ignore it instead of shipping an app that cannot load any data.
 */
export const RETIRED_POKEAPI_GRAPHQL_HOSTS = ['beta.pokeapi.co'] as const;

const isRetiredPokeapiGraphqlHost = (url: string): boolean => {
  try {
    return (RETIRED_POKEAPI_GRAPHQL_HOSTS as readonly string[]).includes(
      new URL(url).hostname.toLowerCase()
    );
  } catch {
    return false;
  }
};

/**
 * Resolve the configured GraphQL URL, falling back to the supported endpoint when the value is
 * empty or points at a retired host.
 */
export const resolvePokeapiGraphqlUrl = (configuredUrl: string | undefined): string => {
  const candidate = configuredUrl?.trim();
  if (!candidate) {
    return DEFAULT_POKEAPI_GRAPHQL_URL;
  }
  if (isRetiredPokeapiGraphqlHost(candidate)) {
    console.warn(
      `[config] Ignoring retired PokeAPI GraphQL endpoint "${candidate}". ` +
        `Using ${DEFAULT_POKEAPI_GRAPHQL_URL} instead. Update VITE_POKEAPI_GRAPHQL_URL.`
    );
    return DEFAULT_POKEAPI_GRAPHQL_URL;
  }
  return candidate;
};

/**
 * Get environment configuration
 */
export const getEnvConfig = (): EnvConfig => {
  return {
    // API
    pokeapiUrl: resolvePokeapiGraphqlUrl(import.meta.env.VITE_POKEAPI_GRAPHQL_URL),
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
