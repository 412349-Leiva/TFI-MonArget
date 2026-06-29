import React, { useEffect, useRef, useState } from 'react';
import { Calendar } from 'lucide-react';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const formatLabel = (month, year) => `${MONTHS[month - 1]} ${year}`;

const MonthYearPicker = ({ month, year, onChange, label, className = '' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const years = Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - 3 + i);

  return (
    <div className={`relative ${className}`} ref={ref}>
      {label && (
        <label className="block text-xs text-slate-400 mb-1 font-medium">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 rounded-xl bg-[#162238] border border-[#284567] px-3 py-2.5 text-sm text-slate-100 hover:border-amber-400/50 transition-colors"
      >
        <span className="truncate">{formatLabel(month, year)}</span>
        <Calendar size={16} className="text-amber-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full min-w-[220px] rounded-xl border border-[#284567] bg-[#0f2543] p-3 shadow-xl">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Mes</p>
              <select
                value={month}
                onChange={(e) => onChange(Number(e.target.value), year)}
                className="w-full rounded-lg bg-[#162238] border border-[#284567] px-2 py-2 text-sm"
              >
                {MONTHS.map((name, i) => (
                  <option key={name} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Año</p>
              <select
                value={year}
                onChange={(e) => onChange(month, Number(e.target.value))}
                className="w-full rounded-lg bg-[#162238] border border-[#284567] px-2 py-2 text-sm"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 w-full py-2 rounded-lg bg-amber-400/90 text-slate-900 text-sm font-semibold"
          >
            Listo
          </button>
        </div>
      )}
    </div>
  );
};

export default MonthYearPicker;
