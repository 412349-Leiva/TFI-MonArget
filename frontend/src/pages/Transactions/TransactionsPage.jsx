import React, { useState, useEffect } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import Layout from '../../components/layout/Layout';
import { Plus, Trash2, Edit2, Loader2, X, Calendar } from 'lucide-react';

const now = () => new Date().toISOString().slice(0, 16);

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const inputCls =
  'w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition';

const emptyForm = () => ({
  title: '',
  description: '',
  amount: '',
  date: now(),
  categoryId: '',
  type: '',
});

const TransactionsPage = () => {
  const {
    transactions,
    categories,
    loading,
    fetchTransactions,
    fetchCategories,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions();

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterType, setFilterType] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchTransactions(month, year, filterCategoryId || null, filterType || null);
  }, [month, year, filterCategoryId, filterType, fetchTransactions]);

  const handleOpenModal = (transaction = null) => {
    if (transaction) {
      setEditingId(transaction.id);
      // date from backend may be "2025-06-01T10:30:00" — slice to 16 for datetime-local
      const dateVal = transaction.date ? transaction.date.slice(0, 16) : now();
      setFormData({
        title: transaction.title || '',
        description: transaction.description || '',
        amount: transaction.amount ?? '',
        date: dateVal,
        categoryId: transaction.categoryId ?? '',
        type: transaction.type || '',
      });
    } else {
      setEditingId(null);
      setFormData(emptyForm());
    }
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError('');
  };

  const handleChange = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.amount || !formData.categoryId || !formData.type || !formData.date) {
      setError('Completa todos los campos requeridos.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const payload = {
        title: formData.title,
        description: formData.description || null,
        amount: parseFloat(formData.amount),
        date: formData.date ? formData.date + ':00' : new Date().toISOString().slice(0, 19),
        categoryId: parseInt(formData.categoryId, 10),
        type: formData.type,
      };

      if (editingId) {
        await updateTransaction(editingId, payload);
      } else {
        await createTransaction(payload);
      }

      setShowModal(false);
      fetchTransactions(month, year, filterCategoryId || null, filterType || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la transacción.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta transacción?')) return;
    try {
      await deleteTransaction(id);
      fetchTransactions(month, year, filterCategoryId || null, filterType || null);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar.');
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-2 sm:px-0">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Transacciones</h1>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-lg font-medium hover:from-amber-300 hover:to-amber-400 transition shadow-lg"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nueva</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <input
            type="number"
            min="1"
            max="12"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value, 10))}
            placeholder="Mes"
            className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
          />
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            placeholder="Año"
            className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
          />
          <select
            value={filterCategoryId}
            onChange={(e) => setFilterCategoryId(e.target.value)}
            className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
          >
            <option value="">Todos los tipos</option>
            <option value="INCOME">Ingresos</option>
            <option value="EXPENSE">Gastos</option>
          </select>
        </div>

        {/* Transaction list */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 size={32} className="text-amber-400 animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-3">
            <Calendar size={40} className="opacity-40" />
            <p className="text-sm">Sin transacciones en este período.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 md:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-all duration-200 hover:border-slate-600 hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm md:text-base truncate">{tx.title}</p>
                  <p className="text-slate-400 text-xs md:text-sm">{tx.categoryName}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{formatDate(tx.date)}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
                  <span
                    className={`font-bold text-sm md:text-lg ${
                      tx.type === 'INCOME' ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {tx.type === 'INCOME' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenModal(tx)}
                      className="p-1.5 md:p-2 hover:bg-slate-700 rounded-lg transition text-slate-300 hover:text-white"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="p-1.5 md:p-2 hover:bg-red-900/30 rounded-lg transition text-red-400 hover:text-red-300"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && handleCloseModal()}
          >
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-white">
                  {editingId ? 'Editar' : 'Nueva'} Transacción
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-1.5 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {error && (
                <p className="text-red-400 text-sm mb-4 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Título *"
                  value={formData.title}
                  onChange={handleChange('title')}
                  className={inputCls}
                />
                <textarea
                  placeholder="Descripción (opcional)"
                  value={formData.description}
                  onChange={handleChange('description')}
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Monto *"
                  value={formData.amount}
                  onChange={handleChange('amount')}
                  className={inputCls}
                />
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Fecha y hora *</label>
                  <input
                    type="datetime-local"
                    value={formData.date}
                    onChange={handleChange('date')}
                    className={inputCls}
                  />
                </div>
                <select
                  value={formData.categoryId}
                  onChange={handleChange('categoryId')}
                  className={inputCls}
                >
                  <option value="">Selecciona una categoría *</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <select
                  value={formData.type}
                  onChange={handleChange('type')}
                  className={inputCls}
                >
                  <option value="">Tipo *</option>
                  <option value="INCOME">Ingreso</option>
                  <option value="EXPENSE">Gasto</option>
                </select>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-lg font-medium hover:from-amber-300 hover:to-amber-400 transition disabled:opacity-50"
                  >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    {submitting ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TransactionsPage;
