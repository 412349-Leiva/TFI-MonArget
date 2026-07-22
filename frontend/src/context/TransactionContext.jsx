import React, { createContext, useState, useContext, useCallback } from 'react';
import apiClient from '../services/api';
import { notifyFinancesChanged } from '../utils/financesEvents';
import { sortTransactionsByDateDesc } from '../utils/datetime';

const TransactionContext = createContext(null);

export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async (month, year, categoryId, type, options = {}) => {
    const { silent = false } = options;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const params = new URLSearchParams();
      if (month) params.append('month', month);
      if (year) params.append('year', year);
      if (categoryId) params.append('categoryId', categoryId);
      if (type) params.append('type', type);

      const response = await apiClient.get(`/transactions?${params.toString()}`);
      setTransactions(sortTransactionsByDateDesc(response.data || []));
    } catch (err) {
      if (!silent) {
        setError(err.response?.data?.message || 'Error al cargar transacciones');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiClient.get('/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    }
  }, []);

  const createCategory = useCallback(async (data) => {
    const response = await apiClient.post('/categories', data);
    setCategories((prev) => [response.data, ...prev]);
    return response.data;
  }, []);

  const createTransaction = useCallback(async (data) => {
    const response = await apiClient.post('/transactions', data);
    setTransactions((prev) => sortTransactionsByDateDesc([response.data, ...prev]));
    notifyFinancesChanged();
    return response.data;
  }, []);

  const updateTransaction = useCallback(async (id, data) => {
    const response = await apiClient.put(`/transactions/${id}`, data);
    setTransactions((prev) => sortTransactionsByDateDesc(
      prev.map((t) => (t.id === id ? response.data : t)),
    ));
    notifyFinancesChanged();
    return response.data;
  }, []);

  const deleteTransaction = useCallback(async (id) => {
    await apiClient.delete(`/transactions/${id}`);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    notifyFinancesChanged();
  }, []);

  const value = {
    transactions,
    categories,
    loading,
    error,
    fetchTransactions,
    fetchCategories,
    createCategory,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions debe ser usado dentro de TransactionProvider');
  }
  return context;
};
