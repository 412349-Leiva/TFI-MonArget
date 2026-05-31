import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Importación de Páginas/Vistas
// Públicas
import LoginPage from '../pages/Auth/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage';
import VerificationPage from '../pages/Auth/VerificationPage';

// Privadas
import DashboardPage from '../pages/Dashboard/DashboardPage';
import CalendarPage from '../pages/Calendar/CalendarPage';
import GoalsPage from '../pages/Goals/GoalsPage';
import GroupsPage from '../pages/Groups/GroupsPage';


/**
 * Componente para proteger rutas.
 * Si el usuario no está autenticado, lo redirige a la página de login.
 */
const PrivateRoute = ({ children }) => {
  const { user, isVerified } = useAuth();
  
  if (!user) {
    // No hay usuario, redirigir al login
    return <Navigate to="/login" />;
  }

  if (!isVerified) {
    // Hay usuario pero no está verificado, redirigir a la pantalla de verificación
    return <Navigate to="/verify-code" />;
  }

  return children;
};

/**
 * Componente principal de enrutamiento de la aplicación.
 */
const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-code" element={<VerificationPage />} />

        {/* Ruta raíz - Redirige al dashboard si está logueado, si no al login */}
        <Route 
          path="/" 
          element={
            <Navigate to="/dashboard" />
          } 
        />

        {/* Rutas Privadas */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <DashboardPage />
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

        {/* Ruta para manejar 404 o redirigir */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
