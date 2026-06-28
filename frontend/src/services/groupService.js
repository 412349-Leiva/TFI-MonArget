import apiClient from './api';

export const groupService = {
  list: () => apiClient.get('/groups'),
  getById: (id) => apiClient.get(`/groups/${id}`),
  create: (data) => apiClient.post('/groups', data),
  invite: (groupId, email) => apiClient.post(`/groups/${groupId}/invite`, { email }),
  addGuest: (groupId, data) => apiClient.post(`/groups/${groupId}/guests`, data),
  listInvitations: () => apiClient.get('/groups/invitations'),
  acceptInvitation: (id) => apiClient.post(`/groups/invitations/${id}/accept`),
  rejectInvitation: (id) => apiClient.post(`/groups/invitations/${id}/reject`),
};
