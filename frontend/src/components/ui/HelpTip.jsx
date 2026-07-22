import { useEffect, useId, useRef, useState } from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * Botón “?” + panel chico de ayuda (popover glass / tono agua).
 */
export default function HelpTip({
  title,
  body = [],
  align = 'right',
  className = '',
  panelClassName = '',
  ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown, { passive: true });
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const paragraphs = Array.isArray(body) ? body : [body];

  return (
    <div className={`relative inline-flex shrink-0 ${className}`} ref={rootRef}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-cyan-400/25 bg-cyan-950/30 backdrop-blur-sm text-slate-300 hover:text-amber-300 hover:border-amber-400/35 transition-colors"
        aria-label={ariaLabel || `Ayuda: ${title}`}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <HelpCircle size={15} strokeWidth={2.2} />
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={title}
          className={`absolute top-full mt-2 w-[min(18.5rem,calc(100vw-2rem))] rounded-2xl border border-cyan-200/20 bg-cyan-950/45 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,20,40,0.35)] p-3.5 ring-1 ring-white/10 ${
            align === 'left' ? 'left-0' : 'right-0'
          } z-[80] ${panelClassName}`}
          onClick={(event) => event.stopPropagation()}
        >
          <p className="text-sm font-semibold text-amber-300/95 mb-2 pr-1">{title}</p>
          <div className="space-y-2 max-h-[min(50vh,20rem)] overflow-y-auto">
            {paragraphs.filter(Boolean).map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="text-xs text-slate-200/90 leading-relaxed whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
