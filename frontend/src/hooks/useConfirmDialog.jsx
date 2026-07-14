import { useCallback, useState } from 'react';
import ConfirmModal from '../components/ui/ConfirmModal';

/**
 * Reemplazo async de window.confirm con el modal de la app.
 * const { confirm, confirmDialog } = useConfirmDialog();
 * if (!(await confirm({ title, message, danger: true }))) return;
 */
export default function useConfirmDialog() {
  const [state, setState] = useState(null);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setState({
        title: options.title || 'Confirmar',
        message: options.message || '¿Continuar?',
        confirmLabel: options.confirmLabel || 'Aceptar',
        cancelLabel: options.cancelLabel || 'Cancelar',
        danger: Boolean(options.danger),
        resolve,
      });
    });
  }, []);

  const handleClose = () => {
    state?.resolve(false);
    setState(null);
  };

  const handleConfirm = () => {
    state?.resolve(true);
    setState(null);
  };

  const confirmDialog = (
    <ConfirmModal
      open={Boolean(state)}
      title={state?.title}
      message={state?.message}
      confirmLabel={state?.confirmLabel}
      cancelLabel={state?.cancelLabel}
      danger={state?.danger}
      onClose={handleClose}
      onConfirm={handleConfirm}
    />
  );

  return { confirm, confirmDialog };
}
