import AppModal from './AppModal';

/**
 * Confirmación centrada con el mismo diseño que AppModal (reemplazo de window.confirm).
 */
export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Confirmar',
  message,
  confirmLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
  loading = false,
  danger = false,
}) {
  return (
    <AppModal open={open} onClose={loading ? undefined : onClose} title={title} zIndex="z-[60]">
      <p className="text-sm text-slate-300 text-center leading-relaxed mb-5 whitespace-pre-line">
        {message}
      </p>
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 disabled:opacity-50 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            danger
              ? 'bg-red-500 hover:bg-red-400 text-white'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-900'
          }`}
        >
          {loading ? 'Esperá…' : confirmLabel}
        </button>
      </div>
    </AppModal>
  );
}
