import axios from 'axios';

// Crear una instancia de Axios con configuración personalizada
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  withCredentials: true, // Importante para que las cookies de sesión (si se usan) se envíen
});

// Interceptor para inyectar el token JWT en cada solicitud
apiClient.interceptors.request.use(
  (config) => {
    const requestPath = config.url || '';
    const isAuthRequest = requestPath.startsWith('/auth/');
    const token = localStorage.getItem('jwt_token');
    if (token && !isAuthRequest) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
