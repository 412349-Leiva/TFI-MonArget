import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { saveAuthReturn, consumeAuthReturn, hasValidSession } from '../utils/authRedirect';

const LoginPage = React.lazy(() => import('../pages/Auth/LoginPage'));
const RegisterPage = React.lazy(() => import('../pages/Auth/RegisterPage'));
const VerificationPage = React.lazy(() => import('../pages/Auth/VerificationPage'));
const ForgotPasswordPage = React.lazy(() => import('../pages/Auth/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('../pages/Auth/ResetPasswordPage'));
const TermsPage = React.lazy(() => import('../pages/Legal/TermsPage'));
const PrivacyPage = React.lazy(() => import('../pages/Legal/PrivacyPage'));
const DashboardPage = React.lazy(() => import('../pages/Dashboard/DashboardPage'));
const TransactionsPage = React.lazy(() => import('../pages/Transactions/TransactionsPage'));
const CalendarPage = React.lazy(() => import('../pages/Calendar/CalendarPage'));
const GoalsPage = React.lazy(() => import('../pages/Goals/GoalsPage'));
const GroupsPage = React.lazy(() => import('../pages/Groups/GroupsPage'));
const RecommendationsPage = React.lazy(() => import('../pages/Recommendations/RecommendationsPage'));
const ScanPage = React.lazy(() => import('../pages/Scan/ScanPage'));
const GuestPayPage = React.lazy(() => import('../pages/Pay/GuestPayPage'));
const GuestConfirmSettlementPage = React.lazy(() => import('../pages/Pay/GuestConfirmSettlementPage'));

function RouteLoader() {
  return (
    <div className="min-h-screen bg-[#0B1528] flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#D9B44A]" />
    </div>
  );
}

/**
 * PrivateRoute: Protector de rutas privadas.
 * Bloquea el acceso si no hay sesión activa o si el usuario no ingresó el código OTP.
 */
const PrivateRoute = ({ children }) => {
  const { user, isVerified } = useAuth();
  const location = useLocation();

  const hasToken = hasValidSession();

  if (!user || !hasToken) {
    saveAuthReturn(location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }

  if (!isVerified) {
    return <Navigate to="/verify-code" replace />;
  }

  return children;
};

/**
 * PublicRoute: Protector inverso de rutas públicas.
 * Evita que un usuario con sesión iniciada regrese a las pantallas de Login o Registro.
 */
const PublicRoute = ({ children }) => {
  const { user, isVerified } = useAuth();
  const hasToken = hasValidSession();
  const isAuthenticated = Boolean(user && isVerified && hasToken);

  if (isAuthenticated) {
    return <Navigate to={consumeAuthReturn('/dashboard')} replace />;
  }

  if (user && !isVerified) {
    return <Navigate to="/verify-code" replace />;
  }

  return children;
};

/**
 * Componente Principal de Enrutamiento de MonArgent
 */
const AppRoutes = () => {
  const { loading } = useAuth();

  if (loading) {
    return <RouteLoader />;
  }

  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route
          path="/login"
          element={(
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          )}
        />
        <Route
          path="/register"
          element={(
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          )}
        />
        <Route path="/verify-code" element={<VerificationPage />} />
        <Route
          path="/forgot-password"
          element={(
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          )}
        />
        <Route
          path="/reset-password"
          element={(
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          )}
        />
        <Route path="/pagar" element={<GuestPayPage />} />
        <Route path="/pagar/confirmar" element={<GuestConfirmSettlementPage />} />
        <Route path="/terminos" element={<TermsPage />} />
        <Route path="/privacidad" element={<PrivacyPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={(
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          )}
        />
        <Route
          path="/transactions"
          element={(
            <PrivateRoute>
              <TransactionsPage />
            </PrivateRoute>
          )}
        />
        <Route
          path="/transactions/income"
          element={(
            <PrivateRoute>
              <TransactionsPage />
            </PrivateRoute>
          )}
        />
        <Route
          path="/transactions/expense"
          element={(
            <PrivateRoute>
              <TransactionsPage />
            </PrivateRoute>
          )}
        />
        <Route
          path="/calendar"
          element={(
            <PrivateRoute>
              <CalendarPage />
            </PrivateRoute>
          )}
        />
        <Route
          path="/goals"
          element={(
            <PrivateRoute>
              <GoalsPage />
            </PrivateRoute>
          )}
        />
        <Route
          path="/groups"
          element={(
            <PrivateRoute>
              <GroupsPage />
            </PrivateRoute>
          )}
        />
        <Route
          path="/recommendations"
          element={(
            <PrivateRoute>
              <RecommendationsPage />
            </PrivateRoute>
          )}
        />
        <Route
          path="/scan"
          element={(
            <PrivateRoute>
              <ScanPage />
            </PrivateRoute>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
