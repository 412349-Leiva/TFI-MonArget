import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatPeso } from '../../utils/format';
import Bar3DShape from './Bar3DShape';

export default function InteractiveBarChart3D({ data = [], className = 'h-full w-full' }) {
  const items = useMemo(
    () => data.map((row) => ({
      label: row.label || row.name,
      total: Number(row.total ?? row.value ?? 0),
    })),
    [data],
  );

  if (!items.length) return null;

  return (
    <div className={`w-full overflow-hidden ${className}`} style={{ minHeight: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={items} barCategoryGap="22%" margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="bar3d-gold" x1="0" y1="0" x2="0" y2="1">
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
            width={56}
            tickFormatter={(v) => `$${Number(v).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
          />
          <Tooltip
            formatter={(value) => formatPeso(value)}
            contentStyle={{ backgroundColor: '#162238', border: '1px solid #284567' }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Bar
            dataKey="total"
            name="Gastos"
            fill="url(#bar3d-gold)"
            shape={<Bar3DShape />}
            maxBarSize={54}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
