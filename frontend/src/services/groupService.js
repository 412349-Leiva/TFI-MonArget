import apiClient from './api';

export const groupService = {
  list: () => apiClient.get('/groups'),
  getById: (id) => apiClient.get(`/groups/${id}`),
  create: (data) => apiClient.post('/groups', data),
  invite: (groupId, email) => apiClient.post(`/groups/${groupId}/invite`, { email }),
  addGuest: (groupId, data) => apiClient.post(`/groups/${groupId}/guests`, data),
  addMyExpenses: (groupId, items) => apiClient.post(`/groups/${groupId}/my-expenses`, { items }),
  listInvitations: () => apiClient.get('/groups/invitations'),
  acceptInvitation: (id) => apiClient.post(`/groups/invitations/${id}/accept`),
  rejectInvitation: (id) => apiClient.post(`/groups/invitations/${id}/reject`),
  uploadSettlementProof: (groupId, fromMemberKey, toMemberKey, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fromMemberKey', fromMemberKey);
    formData.append('toMemberKey', toMemberKey);
    return apiClient.post(`/groups/${groupId}/settlements/proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  fetchSettlementProof: (groupId, fromMemberKey, toMemberKey) => apiClient.get(
    `/groups/${groupId}/settlements/proof`,
    {
      params: { fromMemberKey, toMemberKey },
      responseType: 'blob',
    },
  ),
  confirmSettlement: (groupId, data) => apiClient.post(`/groups/${groupId}/settlements/confirm`, data),
  confirmMovements: (groupId) => apiClient.post(`/groups/${groupId}/confirm-movements`),
  listHistory: () => apiClient.get('/groups/history'),
};
