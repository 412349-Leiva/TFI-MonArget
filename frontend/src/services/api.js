import axios from 'axios';
import { getApiBaseUrl, resolveApiBaseUrl, usesNgrok } from './apiConfig';
import { markMpConnectPending, saveAuthReturn } from '../utils/authRedirect';

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
    const url = error.config?.url || '';
    const isAuthAttempt = /\/auth\/(login|register|forgot|reset|verify)/.test(url);
    if (error.response?.status === 401 && !isAuthAttempt) {
      const path = window.location.pathname + window.location.search;
      if (path !== '/login') {
        saveAuthReturn(path);
        if (/\/mercadopago\/oauth\/connect/.test(url)) {
          markMpConnectPending();
        }
      }
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_email_for_verification');
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
