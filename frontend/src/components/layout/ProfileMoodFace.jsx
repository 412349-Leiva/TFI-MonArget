import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { financialMoodService } from '../../services/financialMoodService';
import MoodFaceIcon from './MoodFaceIcon';
import HelpTip from '../ui/HelpTip';
import { HELP } from '../../content/helpContent';
import useLiveRefresh from '../../hooks/useLiveRefresh';
import { onFinancesChanged } from '../../utils/financesEvents';

const TIER_STYLE = {
  GOOD: 'border-emerald-500/35 bg-emerald-400/10 text-emerald-100',
  MEDIUM: 'border-amber-400/35 bg-amber-400/10 text-amber-100',
  LOW: 'border-red-500/35 bg-red-400/10 text-red-200',
};

const TIER_DOT = {
  GOOD: 'bg-emerald-400',
  MEDIUM: 'bg-amber-400',
  LOW: 'bg-red-400',
};

const DEFAULT_MOOD = {
  level: 'ON_TRACK',
  score: 50,
  maxScore: 100,
  statusTitle: 'En camino',
  statusDescription: 'Cargando tu salud financiera...',
  factors: [],
};

export default function ProfileMoodFace() {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState(DEFAULT_MOOD);

  const loadMood = useCallback(async (options = {}) => {
    const { silent = false } = options;
    try {
      const { data } = await financialMoodService.getMood();
      setMood(data);
    } catch {
      setMood({
        ...DEFAULT_MOOD,
        statusDescription: 'No pudimos calcular tu salud financiera.',
      });
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadMood();
  }, [loadMood]);

  useLiveRefresh(
    () => loadMood({ silent: true }),
    { intervalMs: 6000 },
  );

  useEffect(() => onFinancesChanged(() => loadMood({ silent: true })), [loadMood]);

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
        className="flex items-center gap-1.5 min-h-8 px-1.5 rounded-full hover:bg-white/5 transition-colors"
        aria-label="Salud financiera del mes"
      >
        <MoodFaceIcon level={mood.level} size={26} />
        <span className="text-xs font-semibold text-amber-200/90 hidden sm:inline">
          {mood.score}/{mood.maxScore}
        </span>
      </button>

      {open && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 flex flex-col bg-[#0f2543] border-t border-[#284567] shadow-2xl md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:bottom-auto md:w-[26rem] md:max-h-[75vh] md:rounded-xl md:border md:overflow-hidden">
          <div className="px-4 py-3 border-b border-[#284567] shrink-0">
            <div className="flex items-center gap-3">
              <MoodFaceIcon level={mood.level} size={32} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-100">{mood.statusTitle}</p>
                <p className="text-xs text-amber-300">Puntaje: {mood.score} / {mood.maxScore}</p>
              </div>
              <HelpTip title={HELP.mood.title} body={HELP.mood.body} align="right" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
            <p className="text-sm text-slate-300 leading-relaxed">{mood.statusDescription}</p>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Detalle por factor</p>
              {(mood.factors || []).map((factor) => (
                <div
                  key={factor.key}
                  className={`rounded-lg border px-3 py-2.5 ${TIER_STYLE[factor.tier] || TIER_STYLE.MEDIUM}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${TIER_DOT[factor.tier]}`} />
                      <p className="text-sm font-medium truncate">{factor.label}</p>
                    </div>
                    <p className="text-xs font-semibold shrink-0">
                      {factor.points}/{factor.maxPoints} pts
                    </p>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90 pl-4">{factor.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
