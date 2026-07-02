import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import apiClient from '../services/api';
import { useNavigate } from 'react-router-dom';
import { consumeAuthReturn } from '../utils/authRedirect';

const AuthContext = createContext(null);

const mapUser = (data) => ({
  email: data.email,
  name: data.name,
  mpAlias: data.mpAlias,
  verified: Boolean(data.verified),
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const clearSession = useCallback(() => {
    setUser(null);
    setIsVerified(false);
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_email_for_verification');
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      setUser(null);
      setIsVerified(false);
      return null;
    }

    const { data } = await apiClient.get('/auth/me');
    const nextUser = mapUser(data);
    setUser(nextUser);
    setIsVerified(nextUser.verified);
    return nextUser;
  }, []);

  useEffect(() => {
    const onSessionExpired = () => clearSession();
    window.addEventListener('auth:session-expired', onSessionExpired);
    return () => window.removeEventListener('auth:session-expired', onSessionExpired);
  }, [clearSession]);

  useEffect(() => {
    refreshUser()
      .catch(() => {
        localStorage.removeItem('jwt_token');
        setUser(null);
        setIsVerified(false);
      })
      .finally(() => setLoading(false));
  }, [refreshUser]);

  const register = async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      localStorage.setItem('user_email_for_verification', userData.email);
      navigate('/verify-code');
      return response;
    } catch (error) {
      console.error('Error en el registro:', error.response?.data || error.message);
      throw error;
    }
  };

  const login = async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const { token, verified, email, name, mpAlias } = response.data;

      if (token) {
        localStorage.setItem('jwt_token', token);
      }

      setUser({ email, name, mpAlias, verified: Boolean(verified) });
      setIsVerified(Boolean(verified));

      if (!verified) {
        localStorage.setItem('user_email_for_verification', email || credentials.email);
        navigate('/verify-code');
      } else {
        navigate(consumeAuthReturn('/dashboard'), { replace: true });
      }

      return response;
    } catch (error) {
      console.error('Error en el login:', error.response?.data || error.message);
      throw error;
    }
  };

  const logout = () => {
    clearSession();
    navigate('/login');
  };

  const verifyCode = async ({ code, password, passwordConfirm }) => {
    const email = localStorage.getItem('user_email_for_verification');
    if (!email) {
      throw new Error('No se encontró el email para la verificación.');
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
      throw new Error('No se encontró el email para restablecer la contraseña.');
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
      console.error('Error al restablecer contraseña:', error.response?.data || error.message);
      throw error;
    }
  };

  const resendPasswordResetCode = async () => {
    const email = localStorage.getItem('user_email_for_password_reset');
    if (!email) {
      throw new Error('No hay un email pendiente de recuperación.');
    }

    try {
      return await apiClient.post('/auth/resend-reset-code', { email });
    } catch (error) {
      console.error('Error al reenviar código de recuperación:', error.response?.data || error.message);
      throw error;
    }
  };

  const updateProfile = async (payload) => {
    const body = typeof payload === 'string' ? { mpAlias: payload } : payload;
    const { data } = await apiClient.patch('/auth/profile', body);
    const nextUser = mapUser(data);
    setUser((prev) => (prev ? { ...prev, ...nextUser } : nextUser));
    return nextUser;
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
    updateProfile,
    clearSession,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
