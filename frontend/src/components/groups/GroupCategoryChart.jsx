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
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius="80%"
            paddingAngle={1}
            stroke="none"
            fillOpacity={1}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {pieData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
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
