import React, { useMemo, useRef, useState, useCallback } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatPeso } from '../../utils/format';
import { pickChartColor, BAR_3D_PALETTE } from '../../utils/chart3dPalette';
import { getFrontBarIndex } from '../../utils/chart3dGeometry';

const BAR_SPACING = 1.15;

export default function BarChart2DFallback({ data = [], className = 'h-full w-full' }) {
  const dragRef = useRef({ active: false, lastX: 0, pointerId: null });
  const [rotation, setRotation] = useState(0);

  const items = useMemo(
    () => data.map((row, index) => ({
      label: row.label || row.name,
      total: Number(row.total ?? row.value ?? 0),
      color: pickChartColor(index, BAR_3D_PALETTE, row.color),
    })),
    [data],
  );

  const frontIndex = useMemo(
    () => getFrontBarIndex(items.length, BAR_SPACING, rotation),
    [items.length, rotation],
  );
  const focused = items[frontIndex] || items[0];

  const handlePointerDown = useCallback((event) => {
    dragRef.current = { active: true, lastX: event.clientX, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const handlePointerMove = useCallback((event) => {
    if (!dragRef.current.active || dragRef.current.pointerId !== event.pointerId) return;
    const delta = event.clientX - dragRef.current.lastX;
    dragRef.current.lastX = event.clientX;
    setRotation((current) => current + delta * 0.012);
  }, []);

  const stopDrag = useCallback((event) => {
    if (dragRef.current.pointerId === event.pointerId) {
      dragRef.current.active = false;
      dragRef.current.pointerId = null;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  if (!items.length) return null;

  return (
    <div
      className={`relative touch-none select-none cursor-grab active:cursor-grabbing ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
    >
      <div
        className="h-full min-h-[240px] w-full transition-transform duration-150"
        style={{ transform: `perspective(900px) rotateY(${rotation * 28}deg)` }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={items} barCategoryGap="22%">
            <defs>
              <linearGradient id="bar2d-gold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFF3B0" />
                <stop offset="55%" stopColor="#F5C542" />
                <stop offset="100%" stopColor="#A67C00" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#284567" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickCount={6}
              tickFormatter={(v) => `$${Number(v).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
            />
            <Tooltip
              formatter={(value) => formatPeso(value)}
              contentStyle={{ backgroundColor: '#162238', border: '1px solid #284567' }}
            />
            <Bar dataKey="total" radius={[14, 14, 5, 5]} maxBarSize={54}>
              {items.map((entry, index) => (
                <Cell
                  key={entry.label}
                  fill={index === frontIndex ? entry.color : 'url(#bar2d-gold)'}
                  opacity={index === frontIndex ? 1 : 0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {focused && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-3 pb-1">
          <div className="rounded-2xl border border-amber-400/30 bg-[#0a1525]/90 px-4 py-3 text-center backdrop-blur-sm">
            <p className="text-sm font-semibold text-amber-300 truncate">{focused.label}</p>
            <p className="text-lg font-bold text-white">{formatPeso(focused.total)}</p>
          </div>
          <p className="mt-2 text-center text-[10px] text-slate-500">Arrastrá para girar</p>
        </div>
      )}
    </div>
  );
}
