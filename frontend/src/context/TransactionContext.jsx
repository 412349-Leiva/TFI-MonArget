import React, { createContext, useState, useContext, useCallback } from 'react';
import apiClient from '../services/api';

const TransactionContext = createContext(null);

export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async (month, year, categoryId, type) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (month) params.append('month', month);
      if (year) params.append('year', year);
      if (categoryId) params.append('categoryId', categoryId);
      if (type) params.append('type', type);

      const response = await apiClient.get(`/transactions?${params.toString()}`);
      setTransactions(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar transacciones');
    } finally {
      setLoading(false);
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

  const createTransaction = useCallback(async (data) => {
    try {
      const response = await apiClient.post('/transactions', data);
      setTransactions(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      throw err;
    }
  }, []);

  const updateTransaction = useCallback(async (id, data) => {
    try {
      const response = await apiClient.put(`/transactions/${id}`, data);
      setTransactions(prev => prev.map(t => t.id === id ? response.data : t));
      return response.data;
    } catch (err) {
      throw err;
    }
  }, []);

  const deleteTransaction = useCallback(async (id) => {
    try {
      await apiClient.delete(`/transactions/${id}`);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      throw err;
    }
  }, []);

  const value = {
    transactions,
    categories,
    loading,
    error,
    fetchTransactions,
    fetchCategories,
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

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions debe ser usado dentro de TransactionProvider');
  }
  return context;
};
