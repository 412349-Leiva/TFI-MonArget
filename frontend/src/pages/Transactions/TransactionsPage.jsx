import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useTransactions } from '../../context/TransactionContext';
import Layout from '../../components/layout/Layout';
import MonthYearPicker from '../../components/ui/MonthYearPicker';
import useLiveRefresh from '../../hooks/useLiveRefresh';
import { Plus, Trash2, Edit2, Loader2, Calendar } from 'lucide-react';
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
import AppModal, { ModalActions, ModalField, modalInputClass } from '../../components/ui/AppModal';

const transactionModalTitle = (editingId, lockedType) => {
  if (editingId) return 'Editar transacción';
  if (lockedType === 'INCOME') return 'Registrar ingreso';
  if (lockedType === 'EXPENSE') return 'Registrar gasto';
  return 'Nueva transacción';
};

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
  const effectiveFilterType = lockedType || filterType;

  useEffect(() => {
    if (isIncomeRoute) setFilterType('INCOME');
    else if (isExpenseRoute) setFilterType('EXPENSE');
    else setFilterType('');
  }, [isIncomeRoute, isExpenseRoute]);

  useEffect(() => {
    if (!filterCategoryId) return;
    const selected = categories.find((cat) => String(cat.id) === String(filterCategoryId));
    if (selected && effectiveFilterType && selected.type !== effectiveFilterType) {
      setFilterCategoryId('');
    }
  }, [effectiveFilterType, filterCategoryId, categories]);

  const visibleTransactions = effectiveFilterType
    ? transactions.filter((tx) => tx.type === effectiveFilterType)
    : transactions;

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const created = await createCategory({ name: newCategoryName.trim(), type: newCategoryType });
      setNewCategoryName('');
      setShowCategoryModal(false);
      if (showModal && created?.id) {
        setFormData((prev) => ({
          ...prev,
          categoryId: created.id,
          type: created.type || prev.type || lockedType,
        }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error al crear categoría');
    }
  };

  useEffect(() => {
    fetchTransactions(month, year, filterCategoryId || null, effectiveFilterType || null);
  }, [month, year, filterCategoryId, effectiveFilterType, fetchTransactions]);

  const refreshSilently = useCallback(
    () => fetchTransactions(month, year, filterCategoryId || null, effectiveFilterType || null, { silent: true }),
    [month, year, filterCategoryId, effectiveFilterType, fetchTransactions],
  );

  useLiveRefresh(refreshSilently, { intervalMs: 6000 });

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
        type: lockedType || filterType || '',
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
      fetchTransactions(month, year, filterCategoryId || null, effectiveFilterType || null);
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
      fetchTransactions(month, year, filterCategoryId || null, effectiveFilterType || null);
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
              {(effectiveFilterType
                ? categories.filter((cat) => cat.type === effectiveFilterType)
                : categories
              ).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {!isReadOnlyList && !lockedType && (
            <button
              onClick={() => { setNewCategoryType(effectiveFilterType || 'EXPENSE'); setShowCategoryModal(true); }}
              title="Agregar categoría"
              className="px-3 py-2 bg-amber-500 text-slate-900 rounded-lg hover:opacity-90"
            >
              <Plus size={16} />
            </button>
            )}
          </div>
          {!lockedType && (
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  if (e.target.value === '') setFilterCategoryId('');
                }}
                className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
              >
                <option value="">Todos los tipos</option>
                <option value="INCOME">Ingresos</option>
                <option value="EXPENSE">Gastos</option>
              </select>
          )}
        </div>

        {showCategoryModal && (
          <AppModal
            open
            title="Nueva categoría"
            onClose={() => setShowCategoryModal(false)}
            zIndex="z-[100]"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateCategory();
              }}
              className="space-y-4"
            >
              <ModalField label="Nombre">
                <input
                  type="text"
                  placeholder={
                    (effectiveFilterType || newCategoryType) === 'INCOME'
                      ? 'Ejemplo: Sueldo'
                      : 'Ejemplo: Comida'
                  }
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className={modalInputClass}
                  required
                />
              </ModalField>
              {effectiveFilterType ? (
                <ModalField label="Tipo">
                  <div className={`${modalInputClass} flex items-center text-sm`}>
                    {effectiveFilterType === 'INCOME' ? 'Ingresos' : 'Gastos'}
                  </div>
                </ModalField>
              ) : (
                <ModalField label="Tipo">
                  <select
                    value={newCategoryType}
                    onChange={(e) => setNewCategoryType(e.target.value)}
                    className={modalInputClass}
                  >
                    <option value="INCOME">Ingresos</option>
                    <option value="EXPENSE">Gastos</option>
                  </select>
                </ModalField>
              )}
              <ModalActions onCancel={() => setShowCategoryModal(false)} submitLabel="Guardar" />
            </form>
          </AppModal>
        )}

        {/* Transaction list */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 size={32} className="text-amber-400 animate-spin" />
          </div>
        ) : visibleTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-3">
            <Calendar size={40} className="opacity-40" />
            <p className="text-sm">
              {lockedType === 'INCOME'
                ? 'Sin ingresos en este período.'
                : lockedType === 'EXPENSE'
                  ? 'Sin gastos en este período.'
                  : 'Sin transacciones en este período.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleTransactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 md:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-all duration-200 hover:border-slate-600 hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white text-item-title truncate">{tx.title}</p>
                  <p className="text-item-meta">{tx.categoryName}</p>
                  <p className="text-item-caption mt-0.5">{formatArgentineDate(tx.date)}</p>
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

        {showModal && (
          <AppModal
            open
            title={transactionModalTitle(editingId, lockedType)}
            onClose={handleCloseModal}
          >
            {error && (
              <p className="text-red-400 text-sm mb-4 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <ModalField label="Título">
                <input
                  type="text"
                  placeholder={
                    lockedType === 'INCOME'
                      ? 'Ejemplo: Sueldo de junio'
                      : lockedType === 'EXPENSE'
                        ? 'Ejemplo: Panadería'
                        : formData.type === 'INCOME'
                          ? 'Ejemplo: Sueldo de junio'
                          : formData.type === 'EXPENSE'
                            ? 'Ejemplo: Panadería'
                            : 'Ejemplo: Título'
                  }
                  value={formData.title}
                  onChange={handleChange('title')}
                  className={modalInputClass}
                  required
                />
              </ModalField>
              <ModalField label="Monto">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="$ 1.000"
                  value={formData.amountDisplay}
                  onChange={handleAmountChange}
                  className={`${modalInputClass} font-amount`}
                  required
                />
              </ModalField>
              <ModalField label="Fecha">
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
                  className={modalInputClass}
                  required
                />
              </ModalField>
              {!lockedType && (
                <ModalField label="Tipo">
                  <select
                    value={formData.type}
                    onChange={handleTypeChange}
                    className={modalInputClass}
                    required
                  >
                    <option value="">Seleccioná tipo</option>
                    <option value="INCOME">Ingreso</option>
                    <option value="EXPENSE">Gasto</option>
                  </select>
                </ModalField>
              )}
              <ModalField label="Categoría">
                <div className="space-y-2">
                  {(formData.type || lockedType) && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewCategoryType(formData.type || lockedType);
                        setShowCategoryModal(true);
                      }}
                      className="text-xs text-amber-400 hover:underline"
                    >
                      + Agregar categoría
                    </button>
                  )}
                  <select
                    value={formData.categoryId}
                    onChange={handleChange('categoryId')}
                    className={modalInputClass}
                    disabled={!(formData.type || lockedType)}
                    required
                  >
                    <option value="">
                      {(formData.type || lockedType) ? 'Seleccioná categoría' : 'Elegí el tipo primero'}
                    </option>
                    {categoriesForType(formData.type || lockedType).map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </ModalField>

              <ModalActions
                onCancel={handleCloseModal}
                submitLabel={editingId ? 'Guardar' : 'Aceptar'}
                loading={submitting}
              />
            </form>
          </AppModal>
        )}
      </div>
    </Layout>
  );
};

export default TransactionsPage;
