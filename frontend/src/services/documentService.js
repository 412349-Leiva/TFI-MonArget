import apiClient from './api';

export const documentService = {
  listReceived: () => apiClient.get('/profile/documents'),
  download: (groupId, fromMemberKey, toMemberKey) => apiClient.get(
    `/groups/${groupId}/settlements/proof`,
    {
      params: { fromMemberKey, toMemberKey },
      responseType: 'blob',
    },
  ),
};
