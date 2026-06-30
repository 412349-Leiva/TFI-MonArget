import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { financialMoodService } from '../../services/financialMoodService';
import { formatNotificationMessage } from '../../utils/notificationFormat';
import MoodFaceIcon from './MoodFaceIcon';

const MOOD_LABELS = {
  ANGRY: 'Te deben plata',
  SAD: 'Atención con gastos o deudas',
  YELLOW: 'Objetivos flojos este mes',
  OK: 'Límites bajo control',
  HAPPY: '¡Mes excelente!',
};

const MOOD_PANEL_STYLE = {
  ANGRY: 'border border-red-500/35 bg-red-400/20 text-red-200',
  SAD: 'border border-red-400/30 bg-red-400/10 text-red-200',
  YELLOW: 'border border-amber-400/35 bg-amber-400/20 text-amber-100',
  OK: 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
  HAPPY: 'border border-emerald-500/35 bg-emerald-400/20 text-emerald-100',
};

const FACE_SIZE = 24;

function normalizeItems(data) {
  if (Array.isArray(data?.items) && data.items.length > 0) {
    return data.items;
  }
  const level = data?.level || 'OK';
  const messages = data?.messages?.length ? data.messages : ['Sin alertas este mes. Seguí así.'];
  return [{ level, messages }];
}

export default function ProfileMoodFace() {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const loadMood = useCallback(async () => {
    try {
      const { data } = await financialMoodService.getMood();
      setItems(normalizeItems(data));
    } catch {
      setItems([{ level: 'OK', messages: ['Sin alertas este mes. Seguí así.'] }]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMood();
    const interval = setInterval(loadMood, 60000);
    return () => clearInterval(interval);
  }, [loadMood]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="w-8 h-8 flex items-center justify-center">
        <Loader2 size={14} className="animate-spin text-amber-400/70" />
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-0.5 min-h-8 px-1 rounded-full hover:bg-white/5 transition-colors"
        aria-label="Estado financiero del mes"
      >
        {items.map((item) => (
          <MoodFaceIcon key={item.level} level={item.level} size={FACE_SIZE} />
        ))}
      </button>

      {open && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 flex flex-col bg-[#0f2543] border-t border-[#284567] shadow-2xl md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:bottom-auto md:w-96 md:max-h-[70vh] md:rounded-xl md:border md:overflow-hidden">
          <div className="px-4 py-3 border-b border-[#284567] shrink-0">
            <p className="text-sm font-semibold text-slate-100">Estado del mes</p>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-4 space-y-3">
            {items.map((item) => (
              <div key={item.level} className="space-y-2">
                <div className="flex items-center gap-2">
                  <MoodFaceIcon level={item.level} size={22} />
                  <p className="text-sm font-semibold text-amber-300">{MOOD_LABELS[item.level]}</p>
                </div>
                <ul className="space-y-2">
                  {item.messages.map((msg) => (
                    <li
                      key={`${item.level}-${msg}`}
                      className={`rounded-lg px-3 py-2.5 text-sm leading-relaxed ${MOOD_PANEL_STYLE[item.level] || MOOD_PANEL_STYLE.OK}`}
                    >
                      {formatNotificationMessage(msg)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
