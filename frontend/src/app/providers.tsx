import type { ReactNode } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AppProvider } from '../contexts/AppContext';
import { LanguageProvider } from '../contexts/LanguageContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AppProvider>{children}</AppProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
