import apiClient from './api';

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
    // Misma pestaña/contexto: conserva localStorage (JWT) al volver de Mercado Pago.
    window.location.assign(url);
    return { url, openedExternally: false };
  },

  disconnect: () => apiClient.delete('/mercadopago/oauth/disconnect'),
};
