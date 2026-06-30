import { X } from 'lucide-react';
import MobileModal from './MobileModal';

export const modalInputClass =
  'w-full bg-slate-700/50 border border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors';

export const modalLabelClass = 'block text-sm text-slate-300 mb-1.5';

export default function AppModal({
  open,
  onClose,
  title,
  children,
  zIndex = 'z-50',
}) {
  if (!open) return null;

  return (
    <MobileModal open={open} onClose={onClose} zIndex={zIndex}>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full shadow-2xl overflow-hidden">
        <div className="relative px-6 pt-5 pb-2">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
          <h2 className="text-center text-lg font-semibold text-[#E8B923] pr-8">{title}</h2>
        </div>
        <div className="px-6 pb-6 pt-3">{children}</div>
      </div>
    </MobileModal>
  );
}

export function ModalField({ label, children }) {
  return (
    <div>
      <label className={modalLabelClass}>{label}</label>
      {children}
    </div>
  );
}

export function ModalActions({ onCancel, submitLabel, loading, submitType = 'submit', disabled }) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2.5 rounded-xl text-sm font-medium transition-colors"
      >
        Cancelar
      </button>
      <button
        type={submitType}
        disabled={loading || disabled}
        className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 py-2.5 rounded-xl text-sm font-semibold transition-colors"
      >
        {loading ? 'Guardando...' : submitLabel}
      </button>
    </div>
  );
}
