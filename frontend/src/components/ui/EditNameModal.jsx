import React, { useEffect, useRef } from 'react';
import { Loader2, X } from 'lucide-react';

const EditNameModal = ({
  open,
  value,
  onChange,
  onClose,
  onSubmit,
  saving,
  error,
  suggestion,
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border border-[#284567] bg-[#0f2543] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-section-title">Tu nombre</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1 text-slate-400 hover:text-white disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={50}
          placeholder={suggestion ? `Sugerencia: ${suggestion}` : 'Ej: Tami Leiva'}
          disabled={saving}
          className="w-full rounded-xl bg-[#0b2034] border border-[#284567] px-4 py-3 text-white placeholder:text-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 outline-none transition"
        />

        {error && (
          <p className="mt-3 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl border border-[#284567] text-slate-300 text-sm font-medium hover:bg-[#1a3457] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !value.trim()}
            className="flex-1 py-2.5 rounded-xl bg-amber-400 text-slate-900 text-sm font-semibold hover:bg-amber-300 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditNameModal;
