import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Target,
  Plane,
  Car,
  Gift,
  Heart,
  Pencil,
  Banknote,
  Home,
  Star,
  Wallet,
} from 'lucide-react';
import Layout from '../../components/layout/Layout';
import apiClient from '../../services/api';
import { formatPeso } from '../../utils/format';
import { formatArgentineDate } from '../../utils/datetime';
import {
  digitsFromNumericAmount,
  formatAmountFromDigits,
  parseAmountDigits,
  sanitizeAmountDigits,
} from '../../utils/currency';
import AppModal, { ModalActions, ModalField, modalInputClass } from '../../components/ui/AppModal';

const GOAL_ICONS = [
  { key: 'plane', label: 'Viaje', Icon: Plane },
  { key: 'car', label: 'Auto', Icon: Car },
  { key: 'gift', label: 'Regalo', Icon: Gift },
  { key: 'heart', label: 'Especial', Icon: Heart },
  { key: 'pencil', label: 'Estudio', Icon: Pencil },
  { key: 'banknote', label: 'Ahorro', Icon: Banknote },
  { key: 'home', label: 'Hogar', Icon: Home },
  { key: 'star', label: 'Meta', Icon: Star },
  { key: 'wallet', label: 'Fondo', Icon: Wallet },
  { key: 'target', label: 'Objetivo', Icon: Target },
];

const DEFAULT_ICON_KEY = 'plane';

const resolveGoalIcon = (iconKey) => {
  const match = GOAL_ICONS.find((item) => item.key === iconKey);
  return match?.Icon ?? Plane;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
  title: '',
  iconKey: DEFAULT_ICON_KEY,
  targetAmountDigits: '',
  targetAmountDisplay: '',
  startDate: todayIso(),
  endDate: '',
  status: 'ACTIVE',
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

const IconPicker = ({ value, onChange }) => (
  <div className="grid grid-cols-5 gap-2">
    {GOAL_ICONS.map(({ key, label, Icon }) => {
      const selected = value === key;
      return (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          title={label}
          className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 px-1 transition-colors ${
            selected
              ? 'border-amber-400 bg-amber-400/15 text-amber-200'
              : 'border-slate-600 bg-slate-700/40 text-slate-300 hover:border-slate-500'
          }`}
        >
          <Icon size={18} />
          <span className="text-[10px] leading-tight text-center">{label}</span>
        </button>
      );
    })}
  </div>
);

const GoalCard = ({ goal, onDeposit, onEdit, onDelete }) => {
  const pct =
    goal.targetAmount > 0
      ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
      : 0;

  const GoalIcon = resolveGoalIcon(goal.iconKey);

  return (
    <div className="bg-[#0f2543] border border-[#284567] rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 bg-[#1a3457] rounded-full flex items-center justify-center">
            <GoalIcon size={17} className="text-slate-100" />
          </div>
          <div className="min-w-0">
            <h3 className="text-white text-item-title truncate">{goal.title}</h3>
            <p className="text-slate-400 text-sm">Vence {formatArgentineDate(goal.targetDate) || 'sin fecha'}</p>
          </div>
        </div>
        <span className="text-2xl font-amount text-amber-300">{pct}%</span>
      </div>

      <div>
        <ProgressBar current={goal.currentAmount} target={goal.targetAmount} status={goal.status} />
        <div className="flex justify-between text-sm mt-2 font-amount">
          <span className="text-cyan-100">{formatPeso(goal.currentAmount)}</span>
          <span className="text-slate-400">{formatPeso(goal.targetAmount)}</span>
        </div>
      </div>

      <div className="flex gap-2 pt-1 justify-end">
        <button
          onClick={() => onDeposit(goal)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors"
        >
          Depositar
        </button>
        <button
          onClick={() => onEdit(goal)}
          className="p-2 bg-[#1a3457] hover:bg-[#22456f] text-slate-300 rounded-lg transition-colors"
          title="Editar"
        >
          <Edit2 size={15} />
        </button>
        <button
          onClick={() => onDelete(goal)}
          className="p-2 bg-[#1a3457] hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-lg transition-colors"
          title="Eliminar"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
};

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
  const [depositAmountDigits, setDepositAmountDigits] = useState('');
  const [depositAmountDisplay, setDepositAmountDisplay] = useState('');
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
      setError(err.response?.data?.message ?? 'No se pudieron cargar los objetivos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const openCreate = () => {
    setEditingGoal(null);
    setForm({ ...EMPTY_FORM, startDate: todayIso() });
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (goal) => {
    const digits = digitsFromNumericAmount(goal.targetAmount);
    setEditingGoal(goal);
    setForm({
      title: goal.title,
      iconKey: goal.iconKey || DEFAULT_ICON_KEY,
      targetAmountDigits: digits,
      targetAmountDisplay: formatAmountFromDigits(digits),
      startDate: goal.createdAt ? goal.createdAt.slice(0, 10) : todayIso(),
      endDate: goal.targetDate ?? '',
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
    const { name, value } = e.target;
    if (name === 'targetAmountDisplay') {
      const digits = sanitizeAmountDigits(value);
      setForm((prev) => ({
        ...prev,
        targetAmountDigits: digits,
        targetAmountDisplay: formatAmountFromDigits(digits),
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const parsedAmount = parseAmountDigits(form.targetAmountDigits);
    const payload = {
      title: form.title.trim(),
      iconKey: form.iconKey || DEFAULT_ICON_KEY,
      targetAmount: parsedAmount,
      targetDate: form.endDate || null,
      status: editingGoal ? form.status : 'ACTIVE',
    };

    if (!payload.title) return setFormError('El título es obligatorio.');
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0)
      return setFormError('El monto objetivo debe ser mayor a 0.');

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
      setFormError(err.response?.data?.message ?? 'Ocurrió un error. Intentá de nuevo.');
    } finally {
      setFormLoading(false);
    }
  };

  const openDeposit = (goal) => {
    setDepositGoal(goal);
    setDepositAmountDigits('');
    setDepositAmountDisplay('');
    setDepositError(null);
  };

  const closeDeposit = () => {
    setDepositGoal(null);
    setDepositError(null);
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    setDepositError(null);

    const amount = parseAmountDigits(depositAmountDigits);
    if (Number.isNaN(amount) || amount < 0.01) return setDepositError('El monto mínimo es $0,01.');

    try {
      setDepositLoading(true);
      await apiClient.patch(`/saving-goals/${depositGoal.id}/deposit`, { amount });
      closeDeposit();
      await fetchGoals();
    } catch (err) {
      setDepositError(err.response?.data?.message ?? 'No se pudo registrar el depósito.');
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
      setError(err.response?.data?.message ?? 'No se pudo eliminar el objetivo.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const activeGoals = goals.filter((goal) => goal.status !== 'COMPLETED');
  const completedGoals = goals.filter((goal) => goal.status === 'COMPLETED');

  return (
    <Layout>
      <div className="text-white max-w-xl mx-auto">
        {/* Header — sin título duplicado en objetivos (está en layout) */}
        <div className="flex justify-end mb-5">
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2 rounded-full transition-colors text-sm"
          >
            <Plus size={16} />
            Nuevo objetivo
          </button>
        </div>

        {/* Stats inline */}
        {!loading && goals.length > 0 && (
          <p className="text-item-meta mb-4 -mt-2">
            {activeGoals.length} activos · {completedGoals.length} completados
          </p>
        )}

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
            <p className="text-slate-400 text-sm">Cargando objetivos...</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center">
              <Target size={28} className="text-amber-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">Todavía no tenés objetivos</p>
              <p className="text-slate-400 text-sm mt-1">Creá tu primer objetivo de ahorro para empezar.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3">
              {activeGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onDeposit={openDeposit}
                  onEdit={openEdit}
                  onDelete={openDelete}
                />
              ))}
            </div>

            {completedGoals.length > 0 && (
              <section className="mt-8">
                <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 mb-3">Completados</p>
                <div className="space-y-3">
                  {completedGoals.map((goal) => {
                    const CompletedIcon = resolveGoalIcon(goal.iconKey);
                    return (
                      <article
                        key={goal.id}
                        className="bg-[#0f2543] border border-[#284567] rounded-2xl p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-[#1a3457] flex items-center justify-center">
                            <CompletedIcon size={16} className="text-amber-300" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{goal.title}</p>
                            <p className="text-sm text-amber-300">Completado · {formatArgentineDate(goal.targetDate) || 'Sin fecha'}</p>
                          </div>
                        </div>
                        <span className="text-amber-300">✓</span>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {showForm && (
        <AppModal title={editingGoal ? 'Editar objetivo' : 'Nuevo objetivo'} open onClose={closeForm}>
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
            <ModalField label="Título">
              <input
                className={modalInputClass}
                name="title"
                value={form.title}
                onChange={handleFormChange}
                placeholder="Ejemplo: Vacaciones"
                maxLength={150}
                required
              />
            </ModalField>
            <ModalField label="Ícono">
              <IconPicker
                value={form.iconKey}
                onChange={(iconKey) => setForm((prev) => ({ ...prev, iconKey }))}
              />
            </ModalField>
            <ModalField label="Monto">
              <input
                className={`${modalInputClass} font-amount`}
                name="targetAmountDisplay"
                type="text"
                inputMode="decimal"
                value={form.targetAmountDisplay}
                onChange={handleFormChange}
                placeholder="$ 1.000"
                required
              />
            </ModalField>
            <div className="grid grid-cols-2 gap-3">
              <ModalField label="Desde">
                <input
                  className={`${modalInputClass} opacity-70`}
                  name="startDate"
                  type="date"
                  value={form.startDate}
                  readOnly
                />
              </ModalField>
              <ModalField label="Hasta">
                <input
                  className={modalInputClass}
                  name="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={handleFormChange}
                  min={form.startDate}
                />
              </ModalField>
            </div>
            {editingGoal && (
              <ModalField label="Estado">
                <select className={modalInputClass} name="status" value={form.status} onChange={handleFormChange}>
                  <option value="ACTIVE">Activa</option>
                  <option value="PAUSED">Pausada</option>
                  <option value="COMPLETED">Completada</option>
                  <option value="CANCELLED">Cancelada</option>
                </select>
              </ModalField>
            )}

            {formError && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                {formError}
              </p>
            )}

            <ModalActions
              onCancel={closeForm}
              submitLabel={editingGoal ? 'Guardar' : 'Crear objetivo'}
              loading={formLoading}
            />
          </form>
        </AppModal>
      )}

      {depositGoal && (
        <AppModal title={`Depositar en "${depositGoal.title}"`} open onClose={closeDeposit}>
          <form onSubmit={handleDeposit} className="flex flex-col gap-4">
            <div className="bg-slate-700/40 border border-slate-600 rounded-xl px-4 py-3 text-sm">
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Saldo actual</span>
                <span className="text-white font-amount">{formatPeso(depositGoal.currentAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Objetivo</span>
                <span className="text-white font-amount">{formatPeso(depositGoal.targetAmount)}</span>
              </div>
            </div>

            <ModalField label="Monto a depositar">
              <input
                className={`${modalInputClass} font-amount`}
                type="text"
                inputMode="decimal"
                value={depositAmountDisplay}
                onChange={(e) => {
                  const digits = sanitizeAmountDigits(e.target.value);
                  setDepositAmountDigits(digits);
                  setDepositAmountDisplay(formatAmountFromDigits(digits));
                }}
                placeholder="$ 500"
                required
              />
            </ModalField>

            {depositError && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                {depositError}
              </p>
            )}

            <ModalActions onCancel={closeDeposit} submitLabel="Depositar" loading={depositLoading} />
          </form>
        </AppModal>
      )}

      {deleteGoal && (
        <AppModal title="Eliminar objetivo" open onClose={closeDelete}>
          <div className="flex flex-col gap-5">
            <p className="text-slate-300 text-sm">
              ¿Estás seguro de que querés eliminar{' '}
              <span className="text-white font-semibold">&ldquo;{deleteGoal.title}&rdquo;</span>? Esta acción
              no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeDelete}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {deleteLoading && <Loader2 size={14} className="animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </AppModal>
      )}
    </Layout>
  );
}
