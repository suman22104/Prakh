import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { ErrorBoundary } from '../components/ErrorBoundary';

const LandingPage = lazy(() =>
  import('../pages/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const ScamCheckerPage = lazy(() =>
  import('../pages/ScamCheckerPage').then((m) => ({ default: m.ScamCheckerPage }))
);
const AnalysisResultPage = lazy(() =>
  import('../pages/AnalysisResultPage').then((m) => ({ default: m.AnalysisResultPage }))
);
const DashboardPage = lazy(() =>
  import('../pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const AssistedModePage = lazy(() =>
  import('../pages/AssistedModePage').then((m) => ({ default: m.AssistedModePage }))
);
const ReviewerDashboardPage = lazy(() =>
  import('../pages/ReviewerDashboardPage').then((m) => ({ default: m.ReviewerDashboardPage }))
);
const StatusPage = lazy(() =>
  import('../pages/StatusPage').then((m) => ({ default: m.StatusPage }))
);

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#5C665E]">
      Loading…
    </div>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppShell>
        <ErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
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
          </Suspense>
        </ErrorBoundary>
      </AppShell>
    </BrowserRouter>
  );
}
