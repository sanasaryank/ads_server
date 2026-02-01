import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { CssBaseline, ThemeProvider, Box, CircularProgress } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { theme } from './theme';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import {
  RestaurantsErrorFallback,
  AdvertisementErrorFallback,
  DictionariesErrorFallback,
  StatisticsErrorFallback,
} from './components/common/ErrorFallback';
import { navigationService } from './utils/navigationService';
import './i18n/config';

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RestaurantsListPage = lazy(() => import('./pages/restaurants/RestaurantsListPage').then(m => ({ default: m.RestaurantsListPage })));
const SlotsListPage = lazy(() => import('./pages/slots/SlotsListPage').then(m => ({ default: m.SlotsListPage })));
const DictionariesPage = lazy(() => import('./pages/dictionaries/DictionariesPage').then(m => ({ default: m.DictionariesPage })));
const StatisticsPage = lazy(() => import('./pages/statistics/StatisticsPage').then(m => ({ default: m.StatisticsPage })));
const AdvertisersListPage = lazy(() => import('./pages/advertisement/AdvertisersListPage'));
const CampaignsListPage = lazy(() => import('./pages/advertisement/CampaignsListPage'));
const CreativesListPage = lazy(() => import('./pages/advertisement/CreativesListPage'));
const SchedulesListPage = lazy(() => import('./pages/advertisement/SchedulesListPage'));

/**
 * Loading fallback component
 */
const LoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      bgcolor: 'background.default',
    }}
  >
    <CircularProgress size={60} />
  </Box>
);

/**
 * App Router Component
 * Registers navigate function with navigation service
 */
function AppRouter() {
  const navigate = useNavigate();
  const location = useLocation();

  // Register navigate function with navigation service on mount
  useEffect(() => {
    navigationService.setNavigate(navigate);
  }, [navigate]);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
                  <Route index element={<Navigate to="/restaurants" replace />} />
                  
                  {/* Restaurants - reset on route change */}
                  <Route
                    path="restaurants"
                    element={
                      <ErrorBoundary fallback={<RestaurantsErrorFallback />} resetKeys={[location.pathname]}>
                        <RestaurantsListPage />
                      </ErrorBoundary>
                    }
                  />

                  {/* Dictionaries - reset on route change */}
                  <Route
                    path="dictionaries/:dictKey"
                    element={
                      <ErrorBoundary fallback={<DictionariesErrorFallback />} resetKeys={[location.pathname]}>
                        <DictionariesPage />
                      </ErrorBoundary>
                    }
                  />

                  {/* Slots - reset on route change */}
                  <Route
                    path="slots"
                    element={
                      <ErrorBoundary fallback={<DictionariesErrorFallback />} resetKeys={[location.pathname]}>
                        <SlotsListPage />
                      </ErrorBoundary>
                    }
                  />

                  {/* Advertisement - reset on route change */}
                  <Route
                    path="advertisers"
                    element={
                      <ErrorBoundary fallback={<AdvertisementErrorFallback />} resetKeys={[location.pathname]}>
                        <AdvertisersListPage />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="campaigns"
                    element={
                      <ErrorBoundary fallback={<AdvertisementErrorFallback />} resetKeys={[location.pathname]}>
                        <CampaignsListPage />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="creatives"
                    element={
                      <ErrorBoundary fallback={<AdvertisementErrorFallback />} resetKeys={[location.pathname]}>
                        <CreativesListPage />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="schedules"
                    element={
                      <ErrorBoundary fallback={<AdvertisementErrorFallback />} resetKeys={[location.pathname]}>
                        <SchedulesListPage />
                      </ErrorBoundary>
                    }
                  />

                  {/* Statistics - reset on route change */}
                  <Route
                    path="statistics/:section"
                    element={
                      <ErrorBoundary fallback={<StatisticsErrorFallback />} resetKeys={[location.pathname]}>
                        <StatisticsPage />
                      </ErrorBoundary>
                    }
                  />
                </Route>
              </Routes>
            </Suspense>  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          autoHideDuration={3000}
        >
          <BrowserRouter>
            <AppRouter />          </BrowserRouter>
        </SnackbarProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
