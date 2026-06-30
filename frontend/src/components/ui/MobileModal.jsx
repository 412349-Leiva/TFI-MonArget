import { useEffect, useState } from 'react';

/**
 * Modal que se ajusta cuando aparece el teclado virtual en móvil.
 */
export default function MobileModal({ open, onClose, children, zIndex = 'z-50', align = 'center' }) {
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    if (!open || typeof window === 'undefined' || !window.visualViewport) {
      setKeyboardOffset(0);
      return undefined;
    }

    const update = () => {
      const viewport = window.visualViewport;
      const gap = window.innerHeight - viewport.height - viewport.offsetTop;
      setKeyboardOffset(gap > 40 ? gap : 0);
    };

    update();
    window.visualViewport.addEventListener('resize', update);
    window.visualViewport.addEventListener('scroll', update);
    return () => {
      window.visualViewport.removeEventListener('resize', update);
      window.visualViewport.removeEventListener('scroll', update);
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const alignClass = align === 'end' ? 'items-end' : 'items-center';

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex ${alignClass} sm:items-center justify-center ${zIndex} p-4 overflow-y-auto`}
      style={{ paddingBottom: keyboardOffset ? `${keyboardOffset + 16}px` : undefined }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
