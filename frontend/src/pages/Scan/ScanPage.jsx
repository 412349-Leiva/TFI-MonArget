import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { useTransactions } from '../../context/TransactionContext';
import { Plus, Trash2, Camera, Upload, Loader2, X } from 'lucide-react';
import { formatPeso } from '../../utils/format';
import {
  formatAmountFromDigits,
  parseAmountDigits,
  sanitizeAmountDigits,
  digitsFromNumericAmount,
} from '../../utils/currency';
import { compressImageForOcr, fileFingerprint } from '../../utils/imageCompress';
import { notifyFinancesChanged } from '../../utils/financesEvents';

const EXTRACT_TIMEOUT_MS = 90_000;
const OCR_CACHE_KEY = 'monargent:ocr-preview';
const TITLE_MAX = 150;

const todayIsoDate = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const emptyItem = () => ({
  tempId: crypto.randomUUID(),
  description: '',
  amount: '',
  amountDigits: '',
  amountDisplay: '',
  suggestedCategory: '',
  categoryId: '',
  type: 'EXPENSE',
  date: todayIsoDate(),
});

const STAGE_LABELS = {
  compressing: 'Optimizando imagen…',
  uploading: 'Subiendo archivo…',
  processing: 'Extrayendo productos…',
};

const ScanPage = () => {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const abortRef = useRef(null);
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState(null);
  const [compressedHint, setCompressedHint] = useState('');

  const { categories, fetchCategories, fetchTransactions } = useTransactions();
  const loading = stage !== null;

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const onFileChange = (e) => {
    cancelExtraction();
    setPreview(null);
    setSummary(null);
    setError(null);
    setCompressedHint('');
    const f = e.target.files?.[0];
    if (f) setFile(f);
    e.target.value = '';
  };

  const cancelExtraction = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStage(null);
  };

  const mapPreviewToItems = (data) => (data?.movements || []).map((it) => {
    const digits = digitsFromNumericAmount(it.amount);
    const amount = parseAmountDigits(digits) || Number(it.amount) || 0;
    return {
      tempId: it.tempId || crypto.randomUUID(),
      description: (it.description || '').slice(0, TITLE_MAX),
      amount,
      amountDigits: digits,
      amountDisplay: formatAmountFromDigits(digits),
      suggestedCategory: it.suggestedCategory || '',
      categoryId: it.suggestedCategoryId ? String(it.suggestedCategoryId) : '',
      type: it.type || 'EXPENSE',
      date: it.date || todayIsoDate(),
    };
  });

  const applyPreview = (data) => {
    setPreview(data);
    const parsed = mapPreviewToItems(data);
    setItems(parsed.length > 0 ? parsed : [emptyItem()]);
  };

  const submit = async () => {
    if (!file) return setError('Seleccioná un archivo primero');

    const fingerprint = fileFingerprint(file);
    try {
      const cached = sessionStorage.getItem(OCR_CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        if (parsedCache.fingerprint === fingerprint && parsedCache.preview) {
          applyPreview(parsedCache.preview);
          setCompressedHint(parsedCache.compressedHint || 'Resultado en caché (misma imagen).');
          return;
        }
      }
    } catch {
      sessionStorage.removeItem(OCR_CACHE_KEY);
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setPreview(null);
    setSummary(null);
    setCompressedHint('');

    try {
      setStage('compressing');
      const uploadFile = await compressImageForOcr(file);
      if (uploadFile !== file) {
        const savedKb = Math.max(0, Math.round((file.size - uploadFile.size) / 1024));
        setCompressedHint(`Imagen optimizada (−${savedKb} KB) para acelerar el OCR.`);
      }

      if (controller.signal.aborted) return;

      setStage('uploading');
      const fd = new FormData();
      fd.append('file', uploadFile);

      setStage('processing');
      const resp = await api.post('/imports/extract', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: controller.signal,
        timeout: EXTRACT_TIMEOUT_MS,
      });

      applyPreview(resp.data);
      sessionStorage.setItem(OCR_CACHE_KEY, JSON.stringify({
        fingerprint,
        preview: resp.data,
        compressedHint: uploadFile !== file
          ? `Imagen optimizada para acelerar el OCR.`
          : '',
      }));
    } catch (e) {
      if (controller.signal.aborted || e.code === 'ERR_CANCELED') {
        setError('Extracción cancelada.');
        return;
      }
      if (e.code === 'ECONNABORTED') {
        setError('La extracción tardó demasiado. Probá con una foto más nítida o un recorte más chico.');
        return;
      }
      setError(e?.response?.data?.message || 'No pudimos procesar el archivo. Intentá de nuevo.');
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setStage(null);
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
      } else if (field === 'description') {
        copy[index] = { ...copy[index], description: String(value).slice(0, TITLE_MAX) };
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

  const updateItemType = (index, type) => {
    setItems((prev) => {
      const copy = [...prev];
      const current = copy[index];
      const selectedCategory = categories.find((c) => String(c.id) === String(current.categoryId));
      const categoryStillValid = selectedCategory && selectedCategory.type === type;
      copy[index] = {
        ...current,
        type,
        categoryId: categoryStillValid ? current.categoryId : '',
      };
      return copy;
    });
  };

  const confirmImport = async () => {
    if (items.length === 0) {
      return setError('Agregá al menos un movimiento para importar');
    }

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const amount = parseAmountDigits(item.amountDigits) || Number(item.amount) || 0;
      if (!item.description?.trim()) {
        return setError(`Completá la descripción del movimiento ${index + 1}.`);
      }
      if (amount <= 0) {
        return setError(`El monto del movimiento ${index + 1} debe ser mayor a cero.`);
      }
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
          const categoryMatchesType = selectedCategory && selectedCategory.type === it.type;
          const suggested = (it.suggestedCategory || '').trim();
          // Nunca mandar la descripción del producto como categoryName (rompe el backend).
          const categoryName = categoryMatchesType
            ? selectedCategory.name
            : (suggested && suggested.length <= 120 ? suggested : 'Otros');
          return {
            type: it.type,
            description: it.description.trim().slice(0, TITLE_MAX),
            amount: parseAmountDigits(it.amountDigits) || Number(it.amount) || 0,
            date: it.date || todayIsoDate(),
            categoryId: categoryMatchesType && it.categoryId ? Number(it.categoryId) : null,
            categoryName,
          };
        }),
      };

      const resp = await api.post('/imports/confirm', payload);
      setSummary(resp.data);
      setItems([]);
      setPreview(null);
      setFile(null);
      setCompressedHint('');
      sessionStorage.removeItem(OCR_CACHE_KEY);
      const now = new Date();
      await Promise.all([
        fetchTransactions(now.getMonth() + 1, now.getFullYear()),
        fetchCategories(),
      ]);
      notifyFinancesChanged();
    } catch (e) {
      const apiMessage = e?.response?.data?.message
        || e?.response?.data?.error
        || (Array.isArray(e?.response?.data?.errors) && e.response.data.errors[0])
        || 'Error al confirmar la importación';
      setError(apiMessage);
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
    setCompressedHint('');
    sessionStorage.removeItem(OCR_CACHE_KEY);
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
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#E8B923] text-slate-900 px-4 py-3 font-semibold disabled:opacity-50"
              >
                <Camera size={20} />
                Usar cámara
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#284567] px-4 py-3 text-slate-200 disabled:opacity-50"
              >
                <Upload size={20} />
                Subir archivo
              </button>
            </div>

            {file && (
              <div className="mt-4 text-sm text-slate-200 break-all">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-xs text-slate-400">
                  {file.type || 'tipo desconocido'}
                  {' · '}
                  {Math.round(file.size / 1024)} KB
                </p>
              </div>
            )}

            {compressedHint && !loading && (
              <p className="mt-3 text-xs text-emerald-300 text-center">{compressedHint}</p>
            )}

            {loading && (
              <div className="mt-4 rounded-xl border border-[#284567] bg-[#071427] p-4 space-y-3">
                <div className="flex items-center justify-center gap-2 text-amber-300">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm font-medium">{STAGE_LABELS[stage] || 'Procesando…'}</span>
                </div>
                <div className="flex gap-1 justify-center">
                  {['compressing', 'uploading', 'processing'].map((step) => (
                    <span
                      key={step}
                      className={`h-1.5 w-10 rounded-full ${
                        step === stage
                          ? 'bg-amber-400'
                          : ['compressing', 'uploading', 'processing'].indexOf(step)
                            < ['compressing', 'uploading', 'processing'].indexOf(stage)
                            ? 'bg-emerald-500/70'
                            : 'bg-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={cancelExtraction}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-300"
                  >
                    <X size={14} />
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={submit}
                disabled={loading || !file}
                className="rounded-lg bg-emerald-400 text-slate-900 px-5 py-2.5 font-semibold disabled:opacity-50"
              >
                {loading ? 'Procesando…' : 'Extraer movimientos'}
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
                        maxLength={TITLE_MAX}
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
                          onChange={(e) => updateItemType(idx, e.target.value)}
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
