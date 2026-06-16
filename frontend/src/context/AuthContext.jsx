import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../services/api';
import { useNavigate } from 'react-router-dom';

// 1. Crear el Contexto
const AuthContext = createContext(null);

// 2. Crear el Proveedor del Contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true); // Para saber si estamos verificando el estado inicial
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      setLoading(false);
      return;
    }

    apiClient.get('/auth/me')
      .then(({ data }) => {
        setUser({ email: data.email });
        setIsVerified(Boolean(data.verified));
      })
      .catch(() => {
        localStorage.removeItem('jwt_token');
      })
      .finally(() => setLoading(false));
  }, []);

  // Función de Registro
  const register = async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      // Paso 1: se envía código al email. Guardamos email para el paso 2.
      localStorage.setItem('user_email_for_verification', userData.email);

      navigate('/verify-code');
      return response;
    } catch (error) {
      console.error('Error en el registro:', error.response?.data || error.message);
      throw error;
    }
  };

  // Función de Login
  const login = async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const { token, verified, email } = response.data;

      if (token) {
        localStorage.setItem('jwt_token', token);
      }

      setUser(email ? { email } : null);
      setIsVerified(Boolean(verified));

      if (!verified) {
        localStorage.setItem('user_email_for_verification', email || credentials.email);
        navigate('/verify-code');
      } else {
        navigate('/dashboard');
      }
      
      return response;
    } catch (error) {
      console.error('Error en el login:', error.response?.data || error.message);
      throw error;
    }
  };

  // Función de Logout
  const logout = () => {
    setUser(null);
    setIsVerified(false);
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_email_for_verification');
    navigate('/login');
  };
  
  // Función para verificar el código
  const verifyCode = async ({ code, password, passwordConfirm }) => {
      const email = localStorage.getItem('user_email_for_verification');
      if (!email) {
          throw new Error("No se encontró el email para la verificación.");
      }
      try {
          const response = await apiClient.post('/auth/verify', { email, code, password, passwordConfirm });
          localStorage.removeItem('user_email_for_verification');
          setIsVerified(true);
          navigate('/login');
          return response;
      } catch (error) {
          console.error('Error en la verificación del código:', error.response?.data || error.message);
          throw error;
      }
  };

  const resendCode = async () => {
    const email = localStorage.getItem('user_email_for_verification');
    if (!email) {
      throw new Error('No hay un email pendiente de verificación.');
    }

    try {
      return await apiClient.post('/auth/resend-code', { email });
    } catch (error) {
      console.error('Error al reenviar código:', error.response?.data || error.message);
      throw error;
    }
  };


  const requestPasswordReset = async (email) => {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      localStorage.setItem('user_email_for_password_reset', email);
      navigate('/reset-password');
      return response;
    } catch (error) {
      console.error('Error al solicitar recuperacion:', error.response?.data || error.message);
      throw error;
    }
  };

  const resetPassword = async ({ code, password, passwordConfirm }) => {
    const email = localStorage.getItem('user_email_for_password_reset');
    if (!email) {
      throw new Error('No se encontro el email para restablecer la contrasena.');
    }

    try {
      const response = await apiClient.post('/auth/reset-password', {
        email,
        code,
        password,
        passwordConfirm,
      });
      localStorage.removeItem('user_email_for_password_reset');
      navigate('/login');
      return response;
    } catch (error) {
      console.error('Error al restablecer contrasena:', error.response?.data || error.message);
      throw error;
    }
  };

  const resendPasswordResetCode = async () => {
    const email = localStorage.getItem('user_email_for_password_reset');
    if (!email) {
      throw new Error('No hay un email pendiente de recuperacion.');
    }

    try {
      return await apiClient.post('/auth/resend-reset-code', { email });
    } catch (error) {
      console.error('Error al reenviar codigo de recuperacion:', error.response?.data || error.message);
      throw error;
    }
  };

  const value = {
    user,
    isVerified,
    loading,
    login,
    register,
    logout,
    verifyCode,
    resendCode,
    requestPasswordReset,
    resetPassword,
    resendPasswordResetCode,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

// 3. Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
