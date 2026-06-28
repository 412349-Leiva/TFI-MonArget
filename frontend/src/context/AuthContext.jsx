import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import apiClient from '../services/api';
import { useNavigate } from 'react-router-dom';

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
        navigate('/dashboard');
      }

      return response;
    } catch (error) {
      console.error('Error en el login:', error.response?.data || error.message);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setIsVerified(false);
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_email_for_verification');
    navigate('/login');
  };

  const verifyCode = async ({ code, password, passwordConfirm }) => {
    const email = localStorage.getItem('user_email_for_verification');
    if (!email) {
      throw new Error('No se encontr? el email para la verificaci?n.');
    }
    try {
      const response = await apiClient.post('/auth/verify', { email, code, password, passwordConfirm });
      localStorage.removeItem('user_email_for_verification');
      setIsVerified(true);
      navigate('/login');
      return response;
    } catch (error) {
      console.error('Error en la verificaci?n del c?digo:', error.response?.data || error.message);
      throw error;
    }
  };

  const resendCode = async () => {
    const email = localStorage.getItem('user_email_for_verification');
    if (!email) {
      throw new Error('No hay un email pendiente de verificaci?n.');
    }

    try {
      return await apiClient.post('/auth/resend-code', { email });
    } catch (error) {
      console.error('Error al reenviar c?digo:', error.response?.data || error.message);
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
      throw new Error('No se encontr? el email para restablecer la contrase?a.');
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
      console.error('Error al restablecer contrase?a:', error.response?.data || error.message);
      throw error;
    }
  };

  const resendPasswordResetCode = async () => {
    const email = localStorage.getItem('user_email_for_password_reset');
    if (!email) {
      throw new Error('No hay un email pendiente de recuperaci?n.');
    }

    try {
      return await apiClient.post('/auth/resend-reset-code', { email });
    } catch (error) {
      console.error('Error al reenviar c?digo de recuperaci?n:', error.response?.data || error.message);
      throw error;
    }
  };

  const updateProfile = async (mpAlias) => {
    const { data } = await apiClient.patch('/auth/profile', { mpAlias });
    const nextUser = mapUser(data);
    setUser(nextUser);
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
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
