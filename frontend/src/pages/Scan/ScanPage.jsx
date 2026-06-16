import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { useTransactions } from '../../context/TransactionContext';
import { Plus, Trash2 } from 'lucide-react';

const emptyItem = () => ({
  tempId: crypto.randomUUID(),
  description: '',
  amount: 0,
  suggestedCategory: '',
  categoryId: '',
  type: 'EXPENSE',
  date: '',
});

const ScanPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState(null);

  const { categories, fetchCategories, fetchTransactions } = useTransactions();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const onFileChange = (e) => {
    setPreview(null);
    setSummary(null);
    setError(null);
    const f = e.target.files && e.target.files[0];
    if (f) setFile(f);
  };

  const submit = async () => {
    if (!file) return setError('Seleccioná un archivo primero');
    setLoading(true);
    setError(null);
    setPreview(null);
    setSummary(null);

    try {
      const fd = new FormData();
      fd.append('file', file);

      const resp = await api.post('/imports/extract', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setPreview(resp.data);
      const parsed = (resp.data?.movements || []).map((it) => ({
        tempId: it.tempId || crypto.randomUUID(),
        description: it.description || '',
        amount: Number(it.amount) || 0,
        suggestedCategory: it.suggestedCategory || '',
        categoryId: it.suggestedCategoryId ? String(it.suggestedCategoryId) : '',
        type: it.type || 'EXPENSE',
        date: it.date || '',
      }));
      setItems(parsed.length > 0 ? parsed : [emptyItem()]);
    } catch (e) {
      setError(e?.response?.data?.message || 'Error al procesar el archivo');
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setItems((prev) => [...prev, emptyItem()]);
  };

  const categoriesForType = (type) =>
    categories.filter((c) => c.type === type);

  const confirmImport = async () => {
    if (items.length === 0) {
      return setError('Agregá al menos un movimiento para importar');
    }

    setSaving(true);
    setError(null);
    setSummary(null);

    try {
      const payload = {
        sourceFileName: preview?.sourceFileName || file?.name || 'importacion',
        sourceType: preview?.sourceType || 'IMAGE',
        movements: items.map((it) => {
          const selectedCategory = categories.find((c) => String(c.id) === String(it.categoryId));
          return {
            type: it.type,
            description: it.description,
            amount: Number(it.amount),
            date: it.date || null,
            categoryId: it.categoryId ? Number(it.categoryId) : null,
            categoryName: selectedCategory?.name || it.suggestedCategory || it.description || 'Otros',
          };
        }),
      };

      const resp = await api.post('/imports/confirm', payload);
      setSummary(resp.data);
      setItems([]);
      setPreview(null);
      setFile(null);
      await fetchTransactions();
    } catch (e) {
      setError(e?.response?.data?.message || 'Error al confirmar la importación');
    } finally {
      setSaving(false);
    }
  };

  const cancelImport = () => {
    setItems([]);
    setPreview(null);
    setSummary(null);
    setFile(null);
    setError(null);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto text-slate-100 pb-6">
        <section className="rounded-3xl border border-[#284567] bg-[#0f2543] p-6 mt-4">
          <h2 className="text-2xl font-semibold mb-2">Importar movimientos</h2>
          <p className="text-sm text-slate-400 mb-4">
            Subí una imagen, PDF o Excel. Revisá los movimientos detectados antes de confirmar.
          </p>

          <div className="rounded-xl border border-dashed border-[#2c496d] p-6 text-center">
            <input
              id="fileInput"
              type="file"
              accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              capture="environment"
              onChange={onFileChange}
              className="mx-auto"
            />

            {file && (
              <div className="mt-4 text-left text-sm text-slate-200">
                <p>Archivo: {file.name}</p>
                <p className="text-xs text-slate-400">Tipo: {file.type || 'desconocido'}</p>
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={submit}
                disabled={loading}
                className="rounded-lg bg-amber-400 text-slate-900 px-4 py-2 font-semibold disabled:opacity-60"
              >
                {loading ? 'Procesando...' : 'Extraer movimientos'}
              </button>
            </div>

            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          </div>

          {summary && (
            <div className="mt-6 rounded-xl border border-emerald-700 bg-[#071427] p-4">
              <h3 className="font-semibold text-emerald-300 mb-2">Importación completada</h3>
              <p className="text-sm text-slate-300">
                Total importados: {summary.totalImported} ({summary.incomes} ingresos, {summary.expenses} egresos)
              </p>
              <p className="text-sm text-slate-300">
                Ingresos: ${summary.totalIncome} · Egresos: ${summary.totalExpense}
              </p>
            </div>
          )}

          {preview && (
            <div className="mt-6 rounded-xl border border-[#2c496d] p-4 bg-[#071427]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Previsualización — editá antes de confirmar</h3>
                <button
                  onClick={addItem}
                  className="flex items-center gap-1 text-sm text-amber-300 hover:text-amber-200"
                >
                  <Plus size={16} /> Agregar fila
                </button>
              </div>

              {items.length > 0 ? (
                <div className="space-y-3">
                  <div className="hidden md:grid grid-cols-12 gap-2 text-xs text-slate-400 px-1">
                    <span className="col-span-4">Descripción</span>
                    <span className="col-span-2">Monto</span>
                    <span className="col-span-3">Categoría</span>
                    <span className="col-span-1">Tipo</span>
                    <span className="col-span-1">Fecha</span>
                    <span className="col-span-1" />
                  </div>

                  {items.map((it, idx) => (
                    <div key={it.tempId} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        className="col-span-12 md:col-span-4 rounded px-2 py-1 bg-[#0b2034] text-slate-100"
                        value={it.description}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        placeholder="Descripción"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="col-span-6 md:col-span-2 rounded px-2 py-1 bg-[#0b2034] text-slate-100"
                        value={it.amount}
                        onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                        placeholder="Monto"
                      />
                      <select
                        className="col-span-6 md:col-span-3 rounded px-2 py-1 bg-[#0b2034] text-slate-100"
                        value={it.categoryId}
                        onChange={(e) => updateItem(idx, 'categoryId', e.target.value)}
                      >
                        <option value="">Sugerida: {it.suggestedCategory || 'Otros'}</option>
                        {categoriesForType(it.type).map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <select
                        className="col-span-6 md:col-span-1 rounded px-2 py-1 bg-[#0b2034] text-slate-100"
                        value={it.type}
                        onChange={(e) => updateItem(idx, 'type', e.target.value)}
                      >
                        <option value="EXPENSE">Egreso</option>
                        <option value="INCOME">Ingreso</option>
                      </select>
                      <input
                        type="date"
                        className="col-span-5 md:col-span-1 rounded px-2 py-1 bg-[#0b2034] text-slate-100"
                        value={it.date}
                        onChange={(e) => updateItem(idx, 'date', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="col-span-1 flex justify-center text-red-300 hover:text-red-200"
                        aria-label="Eliminar fila"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={confirmImport}
                      disabled={saving}
                      className="rounded-lg bg-emerald-400 text-slate-900 px-4 py-2 font-semibold disabled:opacity-60"
                    >
                      {saving ? 'Guardando...' : 'Confirmar importación'}
                    </button>
                    <button
                      onClick={cancelImport}
                      className="rounded-lg border border-slate-500 px-4 py-2 text-slate-200"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">No se detectaron movimientos. Podés agregar filas manualmente.</p>
              )}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default ScanPage;
