import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { useTransactions } from '../../context/TransactionContext';
import { Plus, Trash2, Camera, Upload } from 'lucide-react';
import { formatPeso } from '../../utils/format';
import {
  formatAmountFromDigits,
  parseAmountDigits,
  sanitizeAmountDigits,
  digitsFromNumericAmount,
} from '../../utils/currency';

const emptyItem = () => ({
  tempId: crypto.randomUUID(),
  description: '',
  amount: '',
  amountDigits: '',
  amountDisplay: '',
  suggestedCategory: '',
  categoryId: '',
  type: 'EXPENSE',
  date: '',
});

const ScanPage = () => {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
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
    const f = e.target.files?.[0];
    if (f) setFile(f);
    e.target.value = '';
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
      const parsed = (resp.data?.movements || []).map((it) => {
        const digits = digitsFromNumericAmount(it.amount);
        const amount = parseAmountDigits(digits) || Number(it.amount) || 0;
        return {
          tempId: it.tempId || crypto.randomUUID(),
          description: it.description || '',
          amount,
          amountDigits: digits,
          amountDisplay: formatAmountFromDigits(digits),
          suggestedCategory: it.suggestedCategory || '',
          categoryId: it.suggestedCategoryId ? String(it.suggestedCategoryId) : '',
          type: it.type || 'EXPENSE',
          date: it.date || '',
        };
      });
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
      if (field === 'amountDisplay') {
        const digits = sanitizeAmountDigits(value);
        copy[index] = {
          ...copy[index],
          amountDigits: digits,
          amountDisplay: formatAmountFromDigits(digits),
          amount: parseAmountDigits(digits) || 0,
        };
      } else {
        copy[index] = { ...copy[index], [field]: value };
      }
      return copy;
    });
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setItems((prev) => [...prev, emptyItem()]);
  };

  const categoriesForType = (type) => categories.filter((c) => c.type === type);

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
            amount: parseAmountDigits(it.amountDigits) || Number(it.amount) || 0,
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

  const fieldClass =
    'w-full min-w-0 rounded-lg px-3 py-2 bg-[#0b2034] border border-[#284567] text-slate-100 text-sm';

  return (
    <Layout>
      <div className="max-w-4xl mx-auto text-slate-100 pb-6 px-1">
        <section className="rounded-3xl border border-[#284567] bg-[#0f2543] p-4 sm:p-6 mt-4">
          <h2 className="text-xl sm:text-2xl font-semibold mb-2">Importar movimientos</h2>
          <p className="text-sm text-slate-400 mb-4">
            Sacá una foto o subí un archivo. Revisá los movimientos antes de confirmar.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={onFileChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFileChange}
            className="hidden"
          />

          <div className="rounded-xl border border-dashed border-[#2c496d] p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#E8B923] text-slate-900 px-4 py-3 font-semibold"
              >
                <Camera size={20} />
                Usar cámara
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#284567] px-4 py-3 text-slate-200"
              >
                <Upload size={20} />
                Subir archivo
              </button>
            </div>

            {file && (
              <div className="mt-4 text-sm text-slate-200 break-all">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-xs text-slate-400">{file.type || 'tipo desconocido'}</p>
              </div>
            )}

            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={submit}
                disabled={loading || !file}
                className="rounded-lg bg-emerald-400 text-slate-900 px-5 py-2.5 font-semibold disabled:opacity-50"
              >
                {loading ? 'Procesando...' : 'Extraer movimientos'}
              </button>
            </div>

            {error && <p className="mt-3 text-sm text-red-300 text-center break-words">{error}</p>}
          </div>

          {summary && (
            <div className="mt-6 rounded-xl border border-emerald-700 bg-[#071427] p-4">
              <h3 className="font-semibold text-emerald-300 mb-2">Importación completada</h3>
              <p className="text-sm text-slate-300">
                Total: {summary.totalImported} ({summary.incomes} ingresos, {summary.expenses} egresos)
              </p>
            </div>
          )}

          {preview && (
            <div className="mt-6 rounded-xl border border-[#2c496d] p-3 sm:p-4 bg-[#071427] overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="font-semibold text-sm sm:text-base">Revisá antes de confirmar</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1 text-sm text-[#E8B923]"
                >
                  <Plus size={16} /> Agregar
                </button>
              </div>

              {items.length > 0 ? (
                <div className="space-y-3">
                  {items.map((it, idx) => (
                    <div
                      key={it.tempId}
                      className="rounded-xl border border-[#284567] bg-[#0f2543] p-3 space-y-2"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs text-slate-400">Movimiento {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-red-300 shrink-0"
                          aria-label="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <input
                        className={fieldClass}
                        value={it.description}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        placeholder="Descripción"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          className={fieldClass}
                          value={it.amountDisplay || formatPeso(it.amount, { decimals: 2 })}
                          onChange={(e) => updateItem(idx, 'amountDisplay', e.target.value)}
                          placeholder="$ 1.000,00"
                        />
                        <select
                          className={fieldClass}
                          value={it.type}
                          onChange={(e) => updateItem(idx, 'type', e.target.value)}
                        >
                          <option value="EXPENSE">Egreso</option>
                          <option value="INCOME">Ingreso</option>
                        </select>
                      </div>
                      <select
                        className={fieldClass}
                        value={it.categoryId}
                        onChange={(e) => updateItem(idx, 'categoryId', e.target.value)}
                      >
                        <option value="">Sugerida: {it.suggestedCategory || 'Otros'}</option>
                        {categoriesForType(it.type).map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <input
                        type="date"
                        className={fieldClass}
                        value={it.date}
                        onChange={(e) => updateItem(idx, 'date', e.target.value)}
                      />
                    </div>
                  ))}

                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <button
                      type="button"
                      onClick={cancelImport}
                      className="flex-1 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 py-2.5 text-sm font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={confirmImport}
                      disabled={saving}
                      className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 py-2.5 text-sm font-semibold disabled:opacity-60"
                    >
                      {saving ? 'Guardando...' : 'Aceptar'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">No se detectaron movimientos.</p>
              )}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default ScanPage;
