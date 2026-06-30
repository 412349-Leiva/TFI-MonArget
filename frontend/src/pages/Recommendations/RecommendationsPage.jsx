import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import apiClient from '../../services/api';
import { Sparkles, Loader2, Plus, Trash2, RefreshCw, X } from 'lucide-react';
import { formatPeso } from '../../utils/format';
import { getErrorMessage } from '../../utils/apiErrors';
import MobileModal from '../../components/ui/MobileModal';
import {
  formatAmountFromDigits,
  parseAmountDigits,
  sanitizeAmountDigits,
} from '../../utils/currency';

const typeBorder = {
  SPENDING: 'border-l-red-500',
  SAVINGS: 'border-l-emerald-500',
  GOAL: 'border-l-[#E8B923]',
  ALERT: 'border-l-orange-500',
  GENERAL: 'border-l-sky-500',
};

const recommendationTypeLabels = {
  SPENDING: 'Gastos',
  SAVINGS: 'Ahorro',
  GOAL: 'Objetivo',
  ALERT: 'Alerta',
  GENERAL: 'General',
};

const limitThresholdLabel = (pct) => {
  if (pct >= 100) return { text: '100% — superaste el límite', className: 'text-red-300' };
  if (pct >= 75) return { text: '75% del límite usado', className: 'text-orange-300' };
  if (pct >= 50) return { text: '50% del límite usado', className: 'text-amber-300' };
  return null;
};

const RecommendationsPage = () => {
  const now = new Date();
  const [recommendations, setRecommendations] = useState([]);
  const [limits, setLimits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [limitForm, setLimitForm] = useState({ categoryId: '', amountDigits: '', amountDisplay: '' });
  const [limitSaving, setLimitSaving] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categorySaving, setCategorySaving] = useState(false);

  const loadCategories = async () => {
    const { data } = await apiClient.get('/categories');
    setCategories((data || []).filter((c) => c.type === 'EXPENSE'));
  };

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [recRes, limRes] = await Promise.all([
        apiClient.get('/recommendations'),
        apiClient.get('/spending-limits'),
      ]);
      setRecommendations(recRes.data || []);
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      setLimits((limRes.data || []).filter(
        (l) => l.month === currentMonth && l.year === currentYear
      ));
      await loadCategories();
    } catch (e) {
      setError(getErrorMessage(e, 'No se pudieron cargar los datos.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const { data } = await apiClient.post('/recommendations/generate');
      setRecommendations(data || []);
    } catch (e) {
      setError(getErrorMessage(e, 'No se pudieron generar recomendaciones. Verificá la conexión con la IA.'));
    } finally {
      setGenerating(false);
    }
  };

  const handleAddLimit = async (e) => {
    e.preventDefault();
    const parsed = parseAmountDigits(limitForm.amountDigits);
    if (!limitForm.categoryId || Number.isNaN(parsed) || parsed <= 0) return;
    setLimitSaving(true);
    try {
      await apiClient.post('/spending-limits', {
        categoryId: Number(limitForm.categoryId),
        amountLimit: parsed,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });
      setLimitForm({ categoryId: '', amountDigits: '', amountDisplay: '' });
      const { data } = await apiClient.get('/spending-limits');
      setLimits(data || []);
    } catch (e) {
      setError(getErrorMessage(e, 'No se pudo guardar el límite.'));
    } finally {
      setLimitSaving(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    setCategorySaving(true);
    try {
      const { data } = await apiClient.post('/categories', { name, type: 'EXPENSE' });
      await loadCategories();
      setLimitForm((f) => ({ ...f, categoryId: String(data.id) }));
      setNewCategoryName('');
      setShowCategoryModal(false);
    } catch (e) {
      setError(getErrorMessage(e, 'No se pudo crear la categoría.'));
    } finally {
      setCategorySaving(false);
    }
  };

  const handleDeleteLimit = async (id) => {
    try {
      await apiClient.delete(`/spending-limits/${id}`);
      setLimits((prev) => prev.filter((l) => l.id !== id));
    } catch {
      setError('No se pudo eliminar el límite.');
    }
  };

  const monthLabel = `${['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][now.getMonth()]} ${now.getFullYear()}`;

  return (
    <Layout>
      <div className="text-slate-100 max-w-xl mx-auto pb-8">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-section-title flex items-center gap-2">
              <Sparkles size={20} className="text-[#E8B923]" />
              Modo IA
            </h2>
            <p className="text-xs text-slate-400 mt-1">Límites de gasto y consejos personalizados · {monthLabel}</p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 text-sm bg-[#E8B923] text-slate-900 px-3 py-2 rounded-lg font-semibold disabled:opacity-60"
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {generating ? 'Generando...' : 'Nuevos tips'}
          </button>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">{error}</p>
        )}

        <section className="bg-[#102744] border border-[#274466] rounded-2xl p-4 mb-4">
          <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 mb-3">Límites por categoría</p>
          <form onSubmit={handleAddLimit} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 mb-3">
            <div className="flex items-end gap-2">
              <select
                value={limitForm.categoryId}
                onChange={(e) => setLimitForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="flex-1 rounded-lg bg-[#0b2034] border border-[#284567] px-3 py-2 text-sm"
                required
              >
                <option value="">Categoría de egreso</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                title="Nueva categoría"
                className="px-3 py-2 rounded-lg bg-amber-500 text-slate-900 hover:opacity-90"
              >
                <Plus size={16} />
              </button>
            </div>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Límite mensual"
              value={limitForm.amountDisplay}
              onChange={(e) => {
                const digits = sanitizeAmountDigits(e.target.value);
                setLimitForm((f) => ({
                  ...f,
                  amountDigits: digits,
                  amountDisplay: formatAmountFromDigits(digits),
                }));
              }}
              className="rounded-lg bg-[#0b2034] border border-[#284567] px-3 py-2 text-sm font-amount"
              required
            />
            <button
              type="submit"
              disabled={limitSaving}
              className="flex items-center justify-center gap-1 rounded-lg bg-[#173459] border border-[#284567] py-2 text-sm font-medium"
            >
              <Plus size={16} /> Agregar
            </button>
          </form>

          {limits.length === 0 ? (
            <p className="text-sm text-slate-400">Sin límites este mes. Agregá uno para recibir alertas.</p>
          ) : (
            <div className="space-y-2">
              {limits.map((lim) => {
                const pct = lim.amountLimit > 0
                  ? Math.min(100, Math.round((Number(lim.currentAmount) / Number(lim.amountLimit)) * 100))
                  : 0;
                const threshold = limitThresholdLabel(pct);
                const barColor = pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-orange-500' : pct >= 50 ? 'bg-amber-400' : 'bg-[#E8B923]';
                return (
                  <article key={lim.id} className="rounded-xl bg-[#0f2440] border border-[#203d60] p-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="font-medium">{lim.categoryName}</p>
                        <p className="text-xs text-slate-400 font-amount">
                          {formatPeso(lim.currentAmount)} / {formatPeso(lim.amountLimit)}
                        </p>
                      </div>
                      <button type="button" onClick={() => handleDeleteLimit(lim.id)} className="text-red-300">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-[#2e4c72] overflow-hidden">
                      <div
                        className={`h-full ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {threshold && (
                      <p className={`text-xs mt-1 ${threshold.className}`}>{threshold.text}</p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-[#E8B923]" size={32} />
          </div>
        ) : recommendations.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">
            Sin recomendaciones aún. Tocá &quot;Nuevos tips&quot; para analizar tus gastos con IA.
          </p>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <article
                key={rec.id}
                className={`rounded-2xl border border-[#203d60] ${typeBorder[rec.type] || typeBorder.GENERAL} bg-[#0f2440] px-4 py-4`}
              >
                <p className="text-xs uppercase tracking-wide text-[#E8B923] mb-1">
                  {recommendationTypeLabels[rec.type] || recommendationTypeLabels.GENERAL}
                </p>
                <p className="text-sm text-slate-200 leading-relaxed">{rec.message}</p>
                {rec.estimatedImpact != null && (
                  <p className="text-xs text-slate-400 mt-2 font-amount">
                    Impacto estimado: {formatPeso(rec.estimatedImpact)}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}

        <MobileModal open={showCategoryModal} onClose={() => setShowCategoryModal(false)} zIndex="z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Nueva categoría de egreso</h3>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <input
                type="text"
                placeholder="Ej: Comida, Higiene..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                autoFocus
                required
              />
              <button
                type="submit"
                disabled={categorySaving}
                className="w-full py-2.5 rounded-lg bg-amber-500 text-slate-900 font-semibold disabled:opacity-60"
              >
                {categorySaving ? 'Guardando...' : 'Crear categoría'}
              </button>
            </form>
          </div>
        </MobileModal>
      </div>
    </Layout>
  );
};

export default RecommendationsPage;
