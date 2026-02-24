/**
 * Centralized error handling utilities for production
 */

import { logger } from './logger';

export interface ErrorReport {
  message: string;
  stack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  componentStack?: string;
}

const isTestEnv = () => import.meta.env.MODE === 'test';

/**
 * Format error for logging
 */
export const formatError = (error: Error, context?: Record<string, any>): ErrorReport => {
  return {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    ...context,
  };
};

/**
 * Log error to console (development) or service (production)
 */
export const logError = (error: Error, context?: Record<string, any>) => {
  // Unit tests intentionally exercise failure paths; keep test output clean by default.
  if (isTestEnv()) return;

  const errorReport = formatError(error, context);

  if (import.meta.env.DEV) {
    logger.error('[Error]', errorReport);
  } else {
    // In production, send to error tracking service
    // Example: Sentry, LogRocket, etc.
    logger.error('[Production Error]', errorReport.message);

    // sendToErrorService(errorReport);
  }
};

/**
 * Safe API call wrapper with error handling
 */
export const safeApiCall = async <T>(
  apiCall: () => Promise<T>,
  fallbackValue: T,
  errorContext?: string
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    logError(error as Error, { context: errorContext });
    return fallbackValue;
  }
};

/**
 * Retry logic for failed API calls
 */
export const retryApiCall = async <T>(
  apiCall: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        // Retries are expected in transient failures; log only in dev.
        logger.debug(`[Retry] Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }
  }

  throw lastError!;
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: Error): boolean => {
  return (
    error.message.includes('Network') ||
    error.message.includes('fetch') ||
    error.message.includes('Failed to fetch')
  );
};

/**
 * Get user-friendly error message
 */
export const getUserFriendlyErrorMessage = (error: Error): string => {
  if (isNetworkError(error)) {
    return 'Network connection lost. Please check your internet connection and try again.';
  }

  if (error.message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  if (error.message.includes('404')) {
    return 'The requested resource was not found.';
  }

  if (error.message.includes('500')) {
    return 'Server error. Please try again later.';
  }

  return 'An unexpected error occurred. Please try again.';
};

export default {
  formatError,
  logError,
  safeApiCall,
  retryApiCall,
  isNetworkError,
  getUserFriendlyErrorMessage,
};
