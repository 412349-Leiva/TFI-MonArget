import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import apiClient from '../../services/api';
import { Sparkles, Loader2, Plus, Trash2, RefreshCw } from 'lucide-react';
import { formatPeso } from '../../utils/format';
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

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [recRes, limRes, catRes] = await Promise.all([
        apiClient.get('/recommendations'),
        apiClient.get('/spending-limits'),
        apiClient.get('/categories'),
      ]);
      setRecommendations(recRes.data || []);
      setLimits(limRes.data || []);
      setCategories((catRes.data || []).filter((c) => c.type === 'EXPENSE'));
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudieron cargar los datos.');
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
      setError(e.response?.data?.message || 'No se pudieron generar recomendaciones. Verificá la API de Gemini.');
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
      setError(e.response?.data?.message || 'No se pudo guardar el límite.');
    } finally {
      setLimitSaving(false);
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
            <p className="text-xs text-slate-400 mt-1">Límites y tips personalizados · {monthLabel}</p>
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
          <form onSubmit={handleAddLimit} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
            <select
              value={limitForm.categoryId}
              onChange={(e) => setLimitForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="rounded-lg bg-[#0b2034] border border-[#284567] px-3 py-2 text-sm"
              required
            >
              <option value="">Categoría de egreso</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
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

          {categories.length === 0 && (
            <p className="text-sm text-amber-200/80 mb-3">Creá categorías de egreso en Gastos para poder definir límites.</p>
          )}

          {limits.length === 0 ? (
            <p className="text-sm text-slate-400">Sin límites este mes. Agregá uno para recibir alertas.</p>
          ) : (
            <div className="space-y-2">
              {limits.map((lim) => {
                const pct = lim.amountLimit > 0
                  ? Math.min(100, Math.round((Number(lim.currentAmount) / Number(lim.amountLimit)) * 100))
                  : 0;
                const over = pct >= 100;
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
                        className={`h-full ${over ? 'bg-red-500' : 'bg-[#E8B923]'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {over && <p className="text-xs text-red-300 mt-1">Superaste el límite</p>}
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
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">{rec.type}</p>
                <p className="text-sm text-slate-200 leading-relaxed">{rec.message}</p>
                {rec.estimatedImpact != null && (
                  <p className="text-xs text-[#E8B923] mt-2 font-amount">Impacto estimado: {formatPeso(rec.estimatedImpact)}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RecommendationsPage;
