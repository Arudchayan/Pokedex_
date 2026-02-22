/**
 * Analytics tracking utilities
 * Prepared for integration with Google Analytics, Mixpanel, etc.
 */

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

interface PageView {
  path: string;
  title: string;
  referrer?: string;
}

/**
 * Track custom events
 */
export const trackEvent = ({ category, action, label, value }: AnalyticsEvent) => {
  // In development, analytics are logged for debugging
  // In production, send to analytics service
  if (import.meta.env.DEV) {
    // Only log in development mode
    if (import.meta.env.MODE === 'development') {
      console.log('[Analytics Event]', { category, action, label, value });
    }
    return;
  }

  // Google Analytics 4
  // if (typeof gtag !== 'undefined') {
  //   gtag('event', action, {
  //     event_category: category,
  //     event_label: label,
  //     value: value,
  //   });
  // }

  // Mixpanel
  // if (typeof mixpanel !== 'undefined') {
  //   mixpanel.track(action, {
  //     category,
  //     label,
  //     value,
  //   });
  // }
};

/**
 * Track page views
 */
export const trackPageView = ({ path, title, referrer }: PageView) => {
  if (!import.meta.env.PROD) {
    console.log('[Analytics PageView]', { path, title, referrer });
    return;
  }

  // Google Analytics 4
  // if (typeof gtag !== 'undefined') {
  //   gtag('config', 'GA_MEASUREMENT_ID', {
  //     page_path: path,
  //     page_title: title,
  //   });
  // }
};

/**
 * Track Pokemon interactions
 */
export const trackPokemonView = (pokemonId: number, pokemonName: string) => {
  trackEvent({
    category: 'Pokemon',
    action: 'View',
    label: `${pokemonId} - ${pokemonName}`,
    value: pokemonId,
  });
};

export const trackPokemonFavorite = (pokemonId: number, isFavorite: boolean) => {
  trackEvent({
    category: 'Pokemon',
    action: isFavorite ? 'Favorite' : 'Unfavorite',
    label: String(pokemonId),
    value: pokemonId,
  });
};

export const trackPokemonCompare = (pokemonIds: number[]) => {
  trackEvent({
    category: 'Pokemon',
    action: 'Compare',
    label: pokemonIds.join(','),
    value: pokemonIds.length,
  });
};

/**
 * Track team building
 */
export const trackTeamAdd = (pokemonId: number) => {
  trackEvent({
    category: 'Team',
    action: 'Add',
    label: String(pokemonId),
    value: pokemonId,
  });
};

export const trackTeamRemove = (pokemonId: number) => {
  trackEvent({
    category: 'Team',
    action: 'Remove',
    label: String(pokemonId),
    value: pokemonId,
  });
};

export const trackTeamAnalytics = () => {
  trackEvent({
    category: 'Team',
    action: 'View Analytics',
  });
};

/**
 * Track search and filters
 */
export const trackSearch = (searchTerm: string) => {
  trackEvent({
    category: 'Search',
    action: 'Query',
    label: searchTerm,
  });
};

export const trackFilter = (filterType: string, filterValue: string) => {
  trackEvent({
    category: 'Filter',
    action: filterType,
    label: filterValue,
  });
};

/**
 * Track battle calculator usage
 */
export const trackBattleCalculation = (
  attackType: string,
  defenseTypes: string[],
  effectiveness: number
) => {
  trackEvent({
    category: 'Battle Calculator',
    action: 'Calculate',
    label: `${attackType} vs ${defenseTypes.join('/')}`,
    value: effectiveness,
  });
};

/**
 * Track performance metrics
 */
export const trackPerformance = (metricName: string, value: number) => {
  if (!import.meta.env.PROD) {
    console.log('[Analytics Performance]', { metricName, value });
    return;
  }

  // Send to analytics
  // if (typeof gtag !== 'undefined') {
  //   gtag('event', 'timing_complete', {
  //     name: metricName,
  //     value: Math.round(value),
  //   });
  // }
};

/**
 * Track errors
 */
export const trackError = (errorMessage: string, errorStack?: string) => {
  trackEvent({
    category: 'Error',
    action: 'Exception',
    label: errorMessage,
  });
};

export default {
  trackEvent,
  trackPageView,
  trackPokemonView,
  trackPokemonFavorite,
  trackPokemonCompare,
  trackTeamAdd,
  trackTeamRemove,
  trackTeamAnalytics,
  trackSearch,
  trackFilter,
  trackBattleCalculation,
  trackPerformance,
  trackError,
};
