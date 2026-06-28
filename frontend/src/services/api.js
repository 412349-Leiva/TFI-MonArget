import axios from 'axios';
import { getApiBaseUrl, resolveApiBaseUrl, usesNgrok } from './apiConfig';

const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: false,
});

let initialized = false;

apiClient.interceptors.request.use(
  async (config) => {
    if (!initialized) {
      const baseURL = await resolveApiBaseUrl();
      apiClient.defaults.baseURL = baseURL;
      initialized = true;
    }

    config.baseURL = getApiBaseUrl();

    if (usesNgrok(config.baseURL)) {
      config.headers['ngrok-skip-browser-warning'] = 'true';
    }

    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_email_for_verification');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
