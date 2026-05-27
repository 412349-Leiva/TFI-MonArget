import { api } from './api';
import type { CategoryType, Transaction } from '../types/finance';

export type TransactionPayload = {
  title: string;
  description?: string;
  amount: number;
  date: string;
  type: CategoryType;
  categoryId: number;
};

export const transactionService = {
  async list() {
    const { data } = await api.get<Transaction[]>('/transactions');
    return data;
  },
  async create(payload: TransactionPayload) {
    const { data } = await api.post<Transaction>('/transactions', payload);
    return data;
  },
  async remove(id: number) {
    await api.delete(`/transactions/${id}`);
  },
};