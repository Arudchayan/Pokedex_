import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { PokemonProvider } from './context/PokemonContext';
import { ToastProvider } from './context/ToastContext';
import { AchievementProvider } from './context/AchievementContext';
import ToastContainer from './components/shared/ToastContainer';
import { registerServiceWorker } from './utils/registerSW';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './config/queryClient';
import './index.css';
import './styles/global.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <PokemonProvider>
          <ToastProvider>
            <AchievementProvider>
              <App />
              <ToastContainer />
            </AchievementProvider>
          </ToastProvider>
        </PokemonProvider>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// PWA: register service worker in production builds
registerServiceWorker();
