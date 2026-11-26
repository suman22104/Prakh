import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppProvider } from './contexts/AppContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AnalysisResultPage } from './pages/AnalysisResultPage';
import { AssistedModePage } from './pages/AssistedModePage';
import { DashboardPage } from './pages/DashboardPage';
import { LandingPage } from './pages/LandingPage';
import { ReviewerDashboardPage } from './pages/ReviewerDashboardPage';
import { ScamCheckerPage } from './pages/ScamCheckerPage';
import { StatusPage } from './pages/StatusPage';

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AppProvider>
          <BrowserRouter>
            <AppShell>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/check" element={<ScamCheckerPage />} />
                <Route path="/result/:id" element={<AnalysisResultPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/assisted" element={<AssistedModePage />} />
                <Route path="/reviewer" element={<ReviewerDashboardPage />} />
                <Route path="/status" element={<StatusPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          </BrowserRouter>
        </AppProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
