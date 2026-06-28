import apiClient from './api';

export const mercadoPagoService = {
  getStatus: () => apiClient.get('/mercadopago/oauth/status'),
  connect: async () => {
    const { data } = await apiClient.get('/mercadopago/oauth/connect');
    if (data?.authorizationUrl) {
      window.location.href = data.authorizationUrl;
    }
  },
  disconnect: () => apiClient.delete('/mercadopago/oauth/disconnect'),
};
