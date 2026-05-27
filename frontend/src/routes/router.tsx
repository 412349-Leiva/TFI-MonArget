import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { MainLayout } from '../layouts/MainLayout';
import { PrivateRoute } from './PrivateRoute';
import { PublicRoute } from './PublicRoute';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { VerifyPage } from '../pages/VerifyPage';
import { CompleteRegisterPage } from '../pages/CompleteRegisterPage';
import { TransactionsPage } from '../pages/TransactionsPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/',
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { path: '/verify', element: <VerifyPage /> },
          { path: '/complete-register', element: <CompleteRegisterPage /> },
        ],
      },
    ],
  },
  {
    path: '/',
    element: <PrivateRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/transactions', element: <TransactionsPage /> },
          { path: '/goals', element: <PlaceholderPage title="Objetivos" subtitle="Acá van los objetivos financieros." /> },
          { path: '/groups', element: <PlaceholderPage title="Grupos" subtitle="Acá van los gastos grupales." /> },
          { path: '/calendar', element: <PlaceholderPage title="Calendario" subtitle="Acá van alertas y vencimientos." /> },
          { path: '/ai', element: <PlaceholderPage title="IA" subtitle="Acá irán OCR, Gemini y recomendaciones." /> },
        ],
      },
    ],
  },
]);