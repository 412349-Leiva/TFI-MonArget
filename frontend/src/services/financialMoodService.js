import apiClient from './api';

export const financialMoodService = {
  getMood: () => apiClient.get('/profile/mood'),
};
