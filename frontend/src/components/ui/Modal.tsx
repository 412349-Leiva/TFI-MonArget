import type { ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export function Modal({ open, title, children, onClose }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-4 pt-16 backdrop-blur-sm sm:items-center sm:pb-0">
      <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-navy-900 p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-stone-100">{title}</h3>
          <button className="text-stone-400 transition hover:text-stone-100" onClick={onClose}>
            Cerrar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}