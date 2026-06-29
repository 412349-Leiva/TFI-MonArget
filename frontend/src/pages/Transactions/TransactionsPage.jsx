import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTransactions } from '../../context/TransactionContext';
import Layout from '../../components/layout/Layout';
import MonthYearPicker from '../../components/ui/MonthYearPicker';
import { Plus, Trash2, Edit2, Loader2, X, Calendar } from 'lucide-react';
import {
  captureDeviceDateTime,
  formatArgentineDate,
  toDatetimeLocalValue,
  toIsoLocalDateTime,
} from '../../utils/datetime';
import {
  digitsFromNumericAmount,
  formatAmountFromDigits,
  parseAmountDigits,
  sanitizeAmountDigits,
} from '../../utils/currency';
import { formatPesoSigned } from '../../utils/format';

const formatDate = (dateStr) => formatArgentineDate(dateStr);

const inputCls =
  'w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition';

const emptyForm = () => {
  const deviceNow = captureDeviceDateTime();
  return {
    title: '',
    description: '',
    amountDigits: '',
    amountDisplay: '',
    date: toIsoLocalDateTime(deviceNow),
    dateDisplay: formatArgentineDate(deviceNow),
    dateLocal: toDatetimeLocalValue(deviceNow),
    categoryId: '',
    type: '',
  };
};

const TransactionsPage = () => {
  const {
    transactions,
    categories,
    loading,
    fetchTransactions,
    fetchCategories,
    createCategory,
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
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState('EXPENSE');

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const location = useLocation();
  const isIncomeRoute = location.pathname.includes('/transactions/income');
  const isExpenseRoute = location.pathname.includes('/transactions/expense');
  const isReadOnlyList = location.pathname === '/transactions';
  const lockedType = isIncomeRoute ? 'INCOME' : isExpenseRoute ? 'EXPENSE' : '';

  useEffect(() => {
    if (isIncomeRoute) setFilterType('INCOME');
    else if (isExpenseRoute) setFilterType('EXPENSE');
    else setFilterType('');
  }, [isIncomeRoute, isExpenseRoute]);

  useEffect(() => {
    if (!filterCategoryId || !filterType) return;
    const selected = categories.find((cat) => String(cat.id) === String(filterCategoryId));
    if (selected && selected.type !== filterType) {
      setFilterCategoryId('');
    }
  }, [filterType, filterCategoryId, categories]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await createCategory({ name: newCategoryName.trim(), type: newCategoryType });
      setNewCategoryName('');
      setShowCategoryModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al crear categoría');
    }
  };

  useEffect(() => {
    fetchTransactions(month, year, filterCategoryId || null, filterType || null);
  }, [month, year, filterCategoryId, filterType, fetchTransactions]);

  const categoriesForType = (type) => {
    if (!type) return [];
    return categories.filter((category) => category.type === type);
  };

  const handleOpenModal = (transaction = null) => {
    if (transaction) {
      setEditingId(transaction.id);
      const transactionDate = transaction.date ? new Date(transaction.date) : captureDeviceDateTime();
      const amountDigits = digitsFromNumericAmount(transaction.amount);
      setFormData({
        title: transaction.title || '',
        description: transaction.description || '',
        amountDigits,
        amountDisplay: formatAmountFromDigits(amountDigits),
        date: toIsoLocalDateTime(transactionDate),
        dateDisplay: formatArgentineDate(transactionDate),
        dateLocal: toDatetimeLocalValue(transactionDate),
        categoryId: transaction.categoryId ?? '',
        type: transaction.type || '',
      });
    } else {
      setEditingId(null);
      const deviceNow = captureDeviceDateTime();
      setFormData({
        ...emptyForm(),
        type: filterType || '',
        date: toIsoLocalDateTime(deviceNow),
        dateDisplay: formatArgentineDate(deviceNow),
        dateLocal: toDatetimeLocalValue(deviceNow),
      });
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

  const handleTypeChange = (e) => {
    const type = e.target.value;
    setFormData((prev) => {
      const selectedCategory = categories.find((c) => String(c.id) === String(prev.categoryId));
      const categoryStillValid = selectedCategory && selectedCategory.type === type;
      return {
        ...prev,
        type,
        categoryId: categoryStillValid ? prev.categoryId : '',
      };
    });
  };

  const handleAmountChange = (e) => {
    const digits = sanitizeAmountDigits(e.target.value);
    setFormData((prev) => ({
      ...prev,
      amountDigits: digits,
      amountDisplay: formatAmountFromDigits(digits),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const parsedAmount = parseAmountDigits(formData.amountDigits);
    if (!formData.title || !formData.categoryId || !formData.type || !formData.date) {
      setError('Completa todos los campos requeridos.');
      return;
    }
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Ingresá un monto válido mayor a cero.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const payload = {
        title: formData.title,
        description: null,
        amount: parsedAmount,
        date: formData.date,
        categoryId: parseInt(formData.categoryId, 10),
        type: lockedType || formData.type,
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
        <div className={`flex mb-6 ${lockedType ? 'justify-end' : 'justify-between items-center'}`}>
          {!lockedType && (
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Movimientos</h1>
          )}
          {!isReadOnlyList && (
            <button
              onClick={() => handleOpenModal()}
              className={`flex items-center justify-center bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-full font-medium hover:from-amber-300 hover:to-amber-400 transition shadow-lg ${
                lockedType ? 'w-11 h-11' : 'gap-2 px-4 py-2 rounded-lg'
              }`}
              aria-label={lockedType === 'INCOME' ? 'Registrar ingreso' : lockedType === 'EXPENSE' ? 'Registrar gasto' : 'Nueva transacción'}
            >
              <Plus size={lockedType ? 22 : 18} />
              {!lockedType && <span className="hidden sm:inline">Nueva</span>}
            </button>
          )}
        </div>

        {/* Filters */}
        <div className={`grid gap-3 mb-6 ${lockedType ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
          <MonthYearPicker
            label="Período"
            month={month}
            year={year}
            onChange={(m, y) => { setMonth(m); setYear(y); }}
          />
          <div className="flex items-end gap-2">
            <select
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
            >
              <option value="">Todas las categorías</option>
              {(filterType
                ? categories.filter((cat) => cat.type === filterType)
                : categories
              ).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {!isReadOnlyList && !lockedType && (
            <button
              onClick={() => { setNewCategoryType(filterType || 'EXPENSE'); setShowCategoryModal(true); }}
              title="Agregar categoría"
              className="px-3 py-2 bg-amber-500 text-slate-900 rounded-lg hover:opacity-90"
            >
              <Plus size={16} />
            </button>
            )}
          </div>
          {!lockedType && (
            filterType ? (
              <div className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white flex items-center justify-center">
                {filterType === 'INCOME' ? 'Ingresos' : 'Gastos'}
              </div>
            ) : (
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
              >
                <option value="">Todos los tipos</option>
                <option value="INCOME">Ingresos</option>
                <option value="EXPENSE">Gastos</option>
              </select>
            )
          )}
        </div>

        {/* Category creation modal */}
        {showCategoryModal && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowCategoryModal(false)}
          >
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Agregar categoría</h3>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="p-1.5 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nombre de la categoría"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className={inputCls}
                />
                {filterType ? (
                  <div className={`${inputCls} flex items-center`}> 
                    <span className="text-sm text-slate-200">Tipo:</span>
                    <span className="ml-2 font-medium">
                      {filterType === 'INCOME' ? 'Ingresos' : 'Gastos'}
                    </span>
                    <input type="hidden" value={newCategoryType} />
                  </div>
                ) : (
                  <select
                    value={newCategoryType}
                    onChange={(e) => setNewCategoryType(e.target.value)}
                    className={inputCls}
                  >
                    <option value="INCOME">Ingresos</option>
                    <option value="EXPENSE">Gastos</option>
                  </select>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCreateCategory}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-lg font-medium hover:from-amber-300 hover:to-amber-400 transition"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setShowCategoryModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  <p className="text-white text-item-title truncate">{tx.title}</p>
                  <p className="text-item-meta">{tx.categoryName}</p>
                  <p className="text-item-caption mt-0.5">{formatDate(tx.date)}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
                  <span
                    className={`font-amount text-sm md:text-lg ${
                      tx.type === 'INCOME' ? 'text-money-income' : 'text-money-expense'
                    }`}
                  >
                    {formatPesoSigned(tx.amount, tx.type)}
                  </span>
                  {!isReadOnlyList && (
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
                  )}
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
                  {editingId
                    ? 'Editar'
                    : lockedType === 'INCOME'
                      ? 'Registrar ingreso'
                      : lockedType === 'EXPENSE'
                        ? 'Registrar gasto'
                        : 'Nueva transacción'}
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
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Monto *"
                  value={formData.amountDisplay}
                  onChange={handleAmountChange}
                  className={inputCls}
                />
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Fecha *</label>
                  <input
                    type="date"
                    value={formData.dateLocal?.slice(0, 10) || ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        dateLocal: v ? `${v}T12:00` : prev.dateLocal,
                        date: v ? `${v}T12:00:00` : prev.date,
                        dateDisplay: v || prev.dateDisplay,
                      }));
                    }}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-2">
                  <select
                    value={formData.categoryId}
                    onChange={handleChange('categoryId')}
                    className={inputCls}
                    disabled={!(formData.type || lockedType)}
                  >
                    <option value="">
                      {(formData.type || lockedType) ? 'Categoría *' : 'Seleccioná el tipo primero'}
                    </option>
                    {categoriesForType(formData.type || lockedType).map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {(formData.type || lockedType) && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewCategoryType(formData.type || lockedType);
                        setShowCategoryModal(true);
                      }}
                      className="text-xs text-amber-400 hover:underline"
                    >
                      + Agregar categoría nueva
                    </button>
                  )}
                </div>
                {lockedType ? (
                  <input type="hidden" value={lockedType} readOnly />
                ) : (
                  <select
                    value={formData.type}
                    onChange={handleTypeChange}
                    className={inputCls}
                  >
                    <option value="">Tipo *</option>
                    <option value="INCOME">Ingreso</option>
                    <option value="EXPENSE">Gasto</option>
                  </select>
                )}

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
