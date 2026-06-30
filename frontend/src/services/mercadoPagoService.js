import apiClient from './api';
import { openInSystemBrowser, shouldOpenOAuthInSystemBrowser } from '../utils/pwa';
import { markMpConnectPending } from '../utils/authRedirect';

export const mercadoPagoService = {
  getStatus: () => apiClient.get('/mercadopago/oauth/status'),

  getAuthorizationUrl: async () => {
    const { data } = await apiClient.get('/mercadopago/oauth/connect');
    const url = data?.authorizationUrl;
    if (!url) {
      throw new Error('No se recibió la URL de autorización de Mercado Pago.');
    }
    return url;
  },

  connect: async () => {
    const url = await mercadoPagoService.getAuthorizationUrl();
    markMpConnectPending();

    if (shouldOpenOAuthInSystemBrowser()) {
      openInSystemBrowser(url);
      return { url, openedExternally: true };
    }

    window.location.assign(url);
    return { url, openedExternally: false };
  },

  disconnect: () => apiClient.delete('/mercadopago/oauth/disconnect'),
};
