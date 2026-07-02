import React, { useMemo, useRef, useState, useCallback } from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { formatPeso } from '../../utils/format';
import { pickChartColor, PIE_3D_PALETTE } from '../../utils/chart3dPalette';
import { buildPieSlices, getFrontPieIndex } from '../../utils/chart3dGeometry';

export default function PieChart2DFallback({ data = [], className = 'h-full w-full' }) {
  const dragRef = useRef({ active: false, lastX: 0, pointerId: null });
  const [rotation, setRotation] = useState(0);

  const coloredData = useMemo(
    () => data.map((item, index) => ({
      ...item,
      color: pickChartColor(index, PIE_3D_PALETTE, item.color),
    })),
    [data],
  );

  const slices = useMemo(() => buildPieSlices(coloredData), [coloredData]);
  const total = useMemo(
    () => coloredData.reduce((sum, item) => sum + item.value, 0),
    [coloredData],
  );
  const frontIndex = useMemo(
    () => getFrontPieIndex(slices, rotation),
    [slices, rotation],
  );
  const focused = coloredData[frontIndex] || coloredData[0];

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

  if (!coloredData.length) return null;

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
          <PieChart>
            <Pie
              data={coloredData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="48%"
              innerRadius="38%"
              outerRadius="76%"
              paddingAngle={3}
              stroke="#1e3a5f"
              strokeWidth={2}
            >
              {coloredData.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                  opacity={index === frontIndex ? 1 : 0.72}
                  stroke={index === frontIndex ? '#F5C542' : '#1e3a5f'}
                  strokeWidth={index === frontIndex ? 3 : 2}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatPeso(value)}
              contentStyle={{ backgroundColor: '#162238', border: '1px solid #284567' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {focused && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-3 pb-1">
          <div className="rounded-2xl border border-amber-400/30 bg-[#0a1525]/90 px-4 py-3 text-center backdrop-blur-sm">
            <p className="text-sm font-semibold text-amber-300 truncate">{focused.name}</p>
            <p className="text-lg font-bold text-white">{formatPeso(focused.value)}</p>
            <p className="text-xs text-slate-400">
              {total > 0 ? `${((focused.value / total) * 100).toFixed(1)}% del total` : '0% del total'}
            </p>
          </div>
          <p className="mt-2 text-center text-[10px] text-slate-500">Arrastrá para girar</p>
        </div>
      )}
    </div>
  );
}
