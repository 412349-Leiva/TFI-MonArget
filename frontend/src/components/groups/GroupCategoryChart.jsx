import React, { useMemo } from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { formatPeso } from '../../utils/format';

const pieGradients = [
  ['#FFE566', '#F5C542', '#A67C00'],
  ['#6EE7B7', '#34D399', '#047857'],
  ['#93C5FD', '#60A5FA', '#1D4ED8'],
  ['#F9A8D4', '#F472B6', '#BE185D'],
  ['#C4B5FD', '#A78BFA', '#5B21B6'],
  ['#FDBA74', '#FB923C', '#C2410C'],
];

const palette = [
  '#D9B44A', '#38BDF8', '#34D399', '#F87171', '#A78BFA',
  '#FB923C', '#F472B6', '#2DD4BF', '#818CF8', '#FACC15',
];

export default function GroupCategoryChart({ expensesByCategory = [] }) {
  const pieData = useMemo(
    () => expensesByCategory.map((row, index) => ({
      name: row.categoryName,
      value: Number(row.total || 0),
      color: row.categoryColor || palette[index % palette.length],
    })),
    [expensesByCategory],
  );

  if (pieData.length === 0) {
    return (
      <p className="text-sm text-slate-400 pt-4 text-center">
        Todavía no hay gastos categorizados en este grupo.
      </p>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            {pieData.map((entry, i) => {
              const [light, mid, dark] = pieGradients[i % pieGradients.length];
              return (
                <linearGradient key={`grad-${entry.name}`} id={`groupPieGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={light} stopOpacity={1} />
                  <stop offset="45%" stopColor={mid} stopOpacity={1} />
                  <stop offset="100%" stopColor={dark} stopOpacity={1} />
                </linearGradient>
              );
            })}
          </defs>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="48%"
            innerRadius={36}
            outerRadius={72}
            paddingAngle={3}
            stroke="#0f2543"
            strokeWidth={2}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {pieData.map((entry, index) => (
              <Cell key={entry.name} fill={`url(#groupPieGrad${index})`} />
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
  );
}
