import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { saveAuthReturn, consumeAuthReturn, hasValidSession } from '../utils/authRedirect';

// Importación de Páginas/Vistas Públicas
import LoginPage from '../pages/Auth/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage';
import VerificationPage from '../pages/Auth/VerificationPage';
import ForgotPasswordPage from '../pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/Auth/ResetPasswordPage';
import TermsPage from '../pages/Legal/TermsPage';
import PrivacyPage from '../pages/Legal/PrivacyPage';

// Importación de Páginas/Vistas Privadas
import DashboardPage from '../pages/Dashboard/DashboardPage';
import TransactionsPage from '../pages/Transactions/TransactionsPage';
import CalendarPage from '../pages/Calendar/CalendarPage';
import GoalsPage from '../pages/Goals/GoalsPage';
import GroupsPage from '../pages/Groups/GroupsPage';
import RecommendationsPage from '../pages/Recommendations/RecommendationsPage';
import ScanPage from '../pages/Scan/ScanPage';
import GuestPayPage from '../pages/Pay/GuestPayPage';
import GuestConfirmSettlementPage from '../pages/Pay/GuestConfirmSettlementPage';

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
    // Si está autenticado pero le falta el código de 6 dígitos, se lo fuerza a verificar
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

  // Previene redirecciones en falso mientras React recupera el token del localStorage
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1528] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#D9B44A]"></div>
      </div>
    );
  }

  return (
    <Routes>
        {/* Rutas Públicas (Con protección de retorno) */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/verify-code" 
          element={
            // No se envuelve en PublicRoute completo porque requiere de forma obligatoria que exista un 'user' no verificado
            <VerificationPage />
          } 
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          }
        />
        <Route path="/pagar" element={<GuestPayPage />} />
        <Route path="/pagar/confirmar" element={<GuestConfirmSettlementPage />} />
        <Route path="/terminos" element={<TermsPage />} />
        <Route path="/privacidad" element={<PrivacyPage />} />

        {/* Enrutamiento Raíz Inteligente */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Rutas Privadas Protegidas (Requieren Login y Verificación OTP) */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <PrivateRoute>
              <TransactionsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/transactions/income"
          element={
            <PrivateRoute>
              <TransactionsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/transactions/expense"
          element={
            <PrivateRoute>
              <TransactionsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/calendar" 
          element={
            <PrivateRoute>
              <CalendarPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/goals" 
          element={
            <PrivateRoute>
              <GoalsPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/groups" 
          element={
            <PrivateRoute>
              <GroupsPage />
            </PrivateRoute>
          } 
        />
        <Route
          path="/recommendations"
          element={
            <PrivateRoute>
              <RecommendationsPage />
            </PrivateRoute>
          }
        />
          <Route
            path="/scan"
            element={
              <PrivateRoute>
                <ScanPage />
              </PrivateRoute>
            }
          />

        {/*  Captura de rutas inexistentes (404 fallback) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  );
};

export default AppRoutes;