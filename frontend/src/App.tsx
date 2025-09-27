import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { store, useAppSelector, useAppDispatch } from './store';
import { getProfile } from './store/slices/authSlice';
import { ROUTES, STORAGE_KEYS } from './utils/constants';

// Layout Components
import { AppLayout } from './components/shared/Layout/AppLayout';

// Page Components
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { PatientRecords } from './pages/patient/PatientRecords';
import { PatientUpload } from './pages/patient/PatientUpload';
import { PatientConsents } from './pages/patient/PatientConsents';
import { PatientEarnings } from './pages/patient/PatientEarnings';
import { PatientPrivacy } from './pages/patient/PatientPrivacy';
import { ResearcherDashboard } from './pages/researcher/ResearcherDashboard';
import { ResearcherProposals } from './pages/researcher/ResearcherProposals';
import { ResearcherRequests } from './pages/researcher/ResearcherRequests';
import { ResearcherDatasets } from './pages/researcher/ResearcherDatasets';
import { ResearcherResults } from './pages/researcher/ResearcherResults';
import { ResearcherBudget } from './pages/researcher/ResearcherBudget';

// Shared Pages
import { ProfilePage } from './pages/shared/ProfilePage';
import { NotificationsPage } from './pages/shared/NotificationsPage';
import { SettingsPage } from './pages/shared/SettingsPage';
import { HelpPage } from './pages/shared/HelpPage';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const { theme: appTheme } = useAppSelector((state) => state.ui);

  // Create Material-UI theme based on app theme settings
  const theme = createTheme({
    palette: {
      mode: appTheme.mode,
      primary: {
        main: appTheme.primaryColor,
      },
      secondary: {
        main: appTheme.secondaryColor,
      },
    },
    typography: {
      fontFamily: appTheme.fontFamily,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
          },
        },
      },
    },
  });

  useEffect(() => {
    // Check for existing authentication token and validate session
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token && !isAuthenticated && !isLoading) {
      dispatch(getProfile());
    }
  }, [dispatch, isAuthenticated, isLoading]);

  // Protected Route Component
  const ProtectedRoute: React.FC<{ children: React.ReactNode; userType?: 'patient' | 'researcher' }> = ({
    children,
    userType,
  }) => {
    if (!isAuthenticated) {
      return <Navigate to={ROUTES.LOGIN} replace />;
    }

    if (userType && user?.userType !== userType) {
      // Redirect to appropriate dashboard if user type doesn't match
      const redirectPath = user?.userType === 'patient'
        ? ROUTES.PATIENT_DASHBOARD
        : ROUTES.RESEARCHER_DASHBOARD;
      return <Navigate to={redirectPath} replace />;
    }

    return <>{children}</>;
  };

  // Public Route Component (only accessible when not authenticated)
  const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (isAuthenticated && user) {
      const redirectPath = user.userType === 'patient'
        ? ROUTES.PATIENT_DASHBOARD
        : ROUTES.RESEARCHER_DASHBOARD;
      return <Navigate to={redirectPath} replace />;
    }

    return <>{children}</>;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path={ROUTES.LOGIN}
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path={ROUTES.REGISTER}
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    {/* Home Route - Redirect to appropriate dashboard */}
                    <Route
                      path={ROUTES.HOME}
                      element={
                        <Navigate
                          to={
                            user?.userType === 'patient'
                              ? ROUTES.PATIENT_DASHBOARD
                              : ROUTES.RESEARCHER_DASHBOARD
                          }
                          replace
                        />
                      }
                    />

                    {/* Patient Routes */}
                    <Route
                      path={ROUTES.PATIENT_DASHBOARD}
                      element={
                        <ProtectedRoute userType="patient">
                          <PatientDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.PATIENT_RECORDS}
                      element={
                        <ProtectedRoute userType="patient">
                          <PatientRecords />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.PATIENT_UPLOAD}
                      element={
                        <ProtectedRoute userType="patient">
                          <PatientUpload />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.PATIENT_CONSENTS}
                      element={
                        <ProtectedRoute userType="patient">
                          <PatientConsents />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.PATIENT_EARNINGS}
                      element={
                        <ProtectedRoute userType="patient">
                          <PatientEarnings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.PATIENT_PRIVACY}
                      element={
                        <ProtectedRoute userType="patient">
                          <PatientPrivacy />
                        </ProtectedRoute>
                      }
                    />

                    {/* Researcher Routes */}
                    <Route
                      path={ROUTES.RESEARCHER_DASHBOARD}
                      element={
                        <ProtectedRoute userType="researcher">
                          <ResearcherDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.RESEARCHER_PROPOSALS}
                      element={
                        <ProtectedRoute userType="researcher">
                          <ResearcherProposals />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.RESEARCHER_REQUESTS}
                      element={
                        <ProtectedRoute userType="researcher">
                          <ResearcherRequests />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.RESEARCHER_DATASETS}
                      element={
                        <ProtectedRoute userType="researcher">
                          <ResearcherDatasets />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.RESEARCHER_RESULTS}
                      element={
                        <ProtectedRoute userType="researcher">
                          <ResearcherResults />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.RESEARCHER_BUDGET}
                      element={
                        <ProtectedRoute userType="researcher">
                          <ResearcherBudget />
                        </ProtectedRoute>
                      }
                    />

                    {/* Shared Routes */}
                    <Route
                      path={ROUTES.PROFILE}
                      element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.NOTIFICATIONS}
                      element={
                        <ProtectedRoute>
                          <NotificationsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.SETTINGS}
                      element={
                        <ProtectedRoute>
                          <SettingsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.HELP}
                      element={
                        <ProtectedRoute>
                          <HelpPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Catch-all route */}
                    <Route
                      path="*"
                      element={
                        <Navigate
                          to={
                            user?.userType === 'patient'
                              ? ROUTES.PATIENT_DASHBOARD
                              : ROUTES.RESEARCHER_DASHBOARD
                          }
                          replace
                        />
                      }
                    />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;