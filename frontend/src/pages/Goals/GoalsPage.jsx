import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Loader2, Target, TrendingUp } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import apiClient from '../../services/api';

const STATUS_CONFIG = {
  ACTIVE: { label: 'Activa', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  PAUSED: { label: 'Pausada', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  COMPLETED: { label: 'Completada', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  CANCELLED: { label: 'Cancelada', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const EMPTY_FORM = {
  title: '',
  description: '',
  targetAmount: '',
  targetDate: '',
  status: 'ACTIVE',
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value ?? 0);

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

const ProgressBar = ({ current, target, status }) => {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const pulse = status === 'ACTIVE' && pct < 100;
  return (
    <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
      <div
        className={`bg-amber-500 h-2 rounded-full transition-all duration-500${pulse ? ' animate-pulse' : ''}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

const GoalCard = ({ goal, onDeposit, onEdit, onDelete }) => {
  const status = STATUS_CONFIG[goal.status] ?? STATUS_CONFIG.ACTIVE;
  const pct =
    goal.targetAmount > 0
      ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
      : 0;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-slate-600">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center">
            <Target size={18} className="text-amber-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-semibold truncate">{goal.title}</h3>
            {goal.description && (
              <p className="text-slate-400 text-sm line-clamp-2">{goal.description}</p>
            )}
          </div>
        </div>
        <span
          className={`flex-shrink-0 text-xs font-medium px-2 py-1 rounded-full border ${status.color}`}
        >
          {status.label}
        </span>
      </div>

      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-400">Progress</span>
          <span className="text-amber-400 font-medium">{pct}%</span>
        </div>
        <ProgressBar current={goal.currentAmount} target={goal.targetAmount} status={goal.status} />
        <div className="flex justify-between text-sm mt-1">
          <span className="text-white">{formatCurrency(goal.currentAmount)}</span>
          <span className="text-slate-400">{formatCurrency(goal.targetAmount)}</span>
        </div>
      </div>

      {goal.targetDate && (
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <TrendingUp size={12} />
          <span>Target date: {formatDate(goal.targetDate)}</span>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onDeposit(goal)}
          className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-semibold py-2 px-3 rounded-lg transition-colors"
        >
          Depositar
        </button>
        <button
          onClick={() => onEdit(goal)}
          className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
          title="Edit"
        >
          <Edit2 size={15} />
        </button>
        <button
          onClick={() => onDelete(goal)}
          className="p-2 bg-slate-700 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-lg transition-colors"
          title="Delete"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
};

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <h2 className="text-white font-semibold text-lg">{title}</h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xl leading-none transition-colors"
        >
          ×
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  </div>
);

const inputClass =
  'w-full bg-slate-700/50 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors';

const labelClass = 'block text-sm text-slate-300 mb-1';

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [depositGoal, setDepositGoal] = useState(null);
  const [deleteGoal, setDeleteGoal] = useState(null);

  // Form state
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Deposit state
  const [depositAmount, setDepositAmount] = useState('');
  const [depositError, setDepositError] = useState(null);
  const [depositLoading, setDepositLoading] = useState(false);

  // Delete state
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/saving-goals');
      setGoals(res.data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to load goals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const openCreate = () => {
    setEditingGoal(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (goal) => {
    setEditingGoal(goal);
    setForm({
      title: goal.title,
      description: goal.description ?? '',
      targetAmount: String(goal.targetAmount),
      targetDate: goal.targetDate ?? '',
      status: goal.status,
    });
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingGoal(null);
    setFormError(null);
  };

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      targetAmount: parseFloat(form.targetAmount),
      targetDate: form.targetDate || null,
      status: form.status,
    };

    if (!payload.title) return setFormError('Title is required.');
    if (isNaN(payload.targetAmount) || payload.targetAmount <= 0)
      return setFormError('Target amount must be greater than 0.');

    try {
      setFormLoading(true);
      if (editingGoal) {
        await apiClient.put(`/saving-goals/${editingGoal.id}`, payload);
      } else {
        await apiClient.post('/saving-goals', payload);
      }
      closeForm();
      await fetchGoals();
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'An error occurred. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const openDeposit = (goal) => {
    setDepositGoal(goal);
    setDepositAmount('');
    setDepositError(null);
  };

  const closeDeposit = () => {
    setDepositGoal(null);
    setDepositError(null);
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    setDepositError(null);

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 0.01) return setDepositError('Amount must be at least 0.01.');

    try {
      setDepositLoading(true);
      await apiClient.patch(`/saving-goals/${depositGoal.id}/deposit`, { amount });
      closeDeposit();
      await fetchGoals();
    } catch (err) {
      setDepositError(err.response?.data?.message ?? 'Deposit failed. Please try again.');
    } finally {
      setDepositLoading(false);
    }
  };

  const openDelete = (goal) => {
    setDeleteGoal(goal);
  };

  const closeDelete = () => {
    setDeleteGoal(null);
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      await apiClient.delete(`/saving-goals/${deleteGoal.id}`);
      closeDelete();
      await fetchGoals();
    } catch (err) {
      closeDelete();
      setError(err.response?.data?.message ?? 'Failed to delete goal.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Layout>
      <div className="text-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Saving Goals</h1>
            <p className="text-slate-400 text-sm mt-1">Seguí tus objetivos financieros</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Plus size={16} />
            Nueva Meta
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={32} className="text-amber-400 animate-spin" />
            <p className="text-slate-400 text-sm">Loading goals...</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center">
              <Target size={28} className="text-amber-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">No goals yet</p>
              <p className="text-slate-400 text-sm mt-1">Create your first saving goal to get started.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onDeposit={openDeposit}
                onEdit={openEdit}
                onDelete={openDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <Modal title={editingGoal ? 'Editar Meta' : 'Nueva Meta'} onClose={closeForm}>
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>Título *</label>
              <input
                className={inputClass}
                name="title"
                value={form.title}
                onChange={handleFormChange}
                placeholder="Fondo de emergencia"
                maxLength={150}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Descripción</label>
              <textarea
                className={`${inputClass} resize-none`}
                name="description"
                value={form.description}
                onChange={handleFormChange}
                placeholder="Descripción opcional"
                maxLength={500}
                rows={3}
              />
            </div>
            <div>
              <label className={labelClass}>Monto objetivo *</label>
              <input
                className={inputClass}
                name="targetAmount"
                type="number"
                min="0.01"
                step="0.01"
                value={form.targetAmount}
                onChange={handleFormChange}
                placeholder="1000.00"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Fecha objetivo</label>
              <input
                className={inputClass}
                name="targetDate"
                type="date"
                value={form.targetDate}
                onChange={handleFormChange}
              />
            </div>
            <div>
              <label className={labelClass}>Estado *</label>
              <select
                className={inputClass}
                name="status"
                value={form.status}
                onChange={handleFormChange}
              >
                <option value="ACTIVE">Activa</option>
                <option value="PAUSED">Pausada</option>
                <option value="COMPLETED">Completada</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </div>

            {formError && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                {formError}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={closeForm}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {formLoading && <Loader2 size={14} className="animate-spin" />}
                {editingGoal ? 'Guardar' : 'Crear Meta'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Deposit Modal */}
      {depositGoal && (
        <Modal title={`Deposit to "${depositGoal.title}"`} onClose={closeDeposit}>
          <form onSubmit={handleDeposit} className="flex flex-col gap-4">
            <div className="bg-slate-700/40 border border-slate-600 rounded-xl px-4 py-3 text-sm">
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Saldo actual</span>
                <span className="text-white">{formatCurrency(depositGoal.currentAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Objetivo</span>
                <span className="text-white">{formatCurrency(depositGoal.targetAmount)}</span>
              </div>
            </div>

            <div>
              <label className={labelClass}>Monto a depositar *</label>
              <input
                className={inputClass}
                type="number"
                min="0.01"
                step="0.01"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="50.00"
                autoFocus
                required
              />
            </div>

            {depositError && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                {depositError}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={closeDeposit}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={depositLoading}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {depositLoading && <Loader2 size={14} className="animate-spin" />}
                Depositar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteGoal && (
        <Modal title="Eliminar Meta" onClose={closeDelete}>
          <div className="flex flex-col gap-5">
            <p className="text-slate-300 text-sm">
              ¿Estás seguro de que querés eliminar{' '}
              <span className="text-white font-semibold">"{deleteGoal.title}"</span>? Esta acción
              no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeDelete}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {deleteLoading && <Loader2 size={14} className="animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
