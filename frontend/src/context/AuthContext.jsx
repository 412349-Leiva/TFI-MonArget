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

  // Efecto para verificar si hay un usuario al cargar la app
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      // Aquí podrías añadir una llamada a un endpoint '/profile' para validar el token
      // y obtener los datos frescos del usuario. Por ahora, asumimos que el token es válido.
      // Simulamos la carga de datos del usuario.
      // En un caso real, decodificarías el token o harías una llamada a la API.
      console.log("Token encontrado, intentando autenticar usuario...");
      // Aquí iría la lógica para obtener el perfil del usuario con el token
      // y luego llamar a setUser() y setIsVerified().
      // Por simplicidad, lo dejamos pendiente.
    }
    setLoading(false);
  }, []);

  // Función de Registro
  const register = async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      // El backend no devuelve el token en el registro, sino que espera la verificación.
      // Guardamos el email para la pantalla de verificación.
      localStorage.setItem('user_email_for_verification', userData.email);
      navigate('/verify-code'); // Redirigir a la pantalla de verificación
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
      const { token, userDetails } = response.data; // Asumiendo que el backend devuelve token y datos del usuario

      localStorage.setItem('jwt_token', token);
      setUser(userDetails);
      setIsVerified(userDetails.isVerified); // Asumiendo que el backend devuelve este estado

      if (!userDetails.isVerified) {
        localStorage.setItem('user_email_for_verification', userDetails.email);
        navigate('/verify-code');
      } else {
        navigate('/dashboard'); // O a la ruta principal de la app
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
  const verifyCode = async (code) => {
      const email = localStorage.getItem('user_email_for_verification');
      if (!email) {
          throw new Error("No se encontró el email para la verificación.");
      }
      try {
          const response = await apiClient.post('/auth/verify', { email, code });
          // Tras la verificación exitosa, el backend debería permitir el login
          // o directamente devolver un token. Asumimos que debemos loguear de nuevo.
          localStorage.removeItem('user_email_for_verification');
          setIsVerified(true);
          // Podríamos redirigir al login para que inicie sesión con su cuenta ya verificada
          // o si el backend ya nos da el token, hacemos el login directamente.
          alert("¡Cuenta verificada con éxito! Por favor, inicia sesión.");
          navigate('/login');
          return response;
      } catch (error) {
          console.error('Error en la verificación del código:', error.response?.data || error.message);
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
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

// 3. Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
