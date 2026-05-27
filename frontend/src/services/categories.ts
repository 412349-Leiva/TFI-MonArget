import { api } from './api';
import type { Category, CategoryType } from '../types/finance';

export type CategoryPayload = {
  name: string;
  icon?: string;
  color?: string;
  type: CategoryType;
};

export const categoryService = {
  async list() {
    const { data } = await api.get<Category[]>('/categories');
    return data;
  },
  async create(payload: CategoryPayload) {
    const { data } = await api.post<Category>('/categories', payload);
    return data;
  },
};