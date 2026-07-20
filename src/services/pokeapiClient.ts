import { POKEAPI_GRAPHQL_URL } from '../constants';
import { logError, isNetworkError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

interface GraphQLResponse<T> {
  data: T;
  errors?: { message: string }[];
}

/**
 * Thin GraphQL fetch wrapper for the public PokeAPI endpoint.
 */
export async function queryPokeAPI<T>(
  query: string,
  variables: Record<string, unknown> = {},
  options: { signal?: AbortSignal } = {}
): Promise<T> {
  try {
    const timeoutSignal = AbortSignal.timeout(30000);
    const combinedSignal = options.signal
      ? AbortSignal.any
        ? AbortSignal.any([options.signal, timeoutSignal])
        : options.signal
      : timeoutSignal;
    const response = await fetch(POKEAPI_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query, variables }),
      signal: combinedSignal,
    });

    if (!response.ok) {
      const error = new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      logError(error, { endpoint: POKEAPI_GRAPHQL_URL, status: response.status });
      throw error;
    }

    const json = (await response.json()) as GraphQLResponse<T>;

    if (json.errors) {
      logger.debug('GraphQL Errors:', json.errors);
      const error = new Error(`GraphQL Error: ${json.errors[0]?.message || 'Unknown error'}`);
      logError(error, { graphqlErrors: json.errors });
      throw error;
    }

    return json.data;
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      const timeoutError = new Error('Request timed out. Please try again.');
      logError(timeoutError, { context: 'API Timeout' });
      throw timeoutError;
    }

    if (error instanceof Error && isNetworkError(error)) {
      const networkError = new Error('Network error. Please check your connection.');
      logError(networkError, { context: 'Network Error' });
      throw networkError;
    }

    throw error;
  }
}
