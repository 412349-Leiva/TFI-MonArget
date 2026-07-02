import React, { useMemo } from 'react';
import { Chart3DPie } from '../charts/Chart3DWrapper';
import { pickChartColor, PIE_3D_PALETTE } from '../../utils/chart3dPalette';

export default function GroupCategoryChart({ expensesByCategory = [] }) {
  const pieData = useMemo(
    () => expensesByCategory.map((row, index) => ({
      name: row.categoryName,
      value: Number(row.total || 0),
      color: pickChartColor(index, PIE_3D_PALETTE, row.categoryColor),
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
    <div className="h-72 overflow-hidden rounded-xl bg-gradient-to-b from-[#132a4a]/40 to-transparent">
      <Chart3DPie data={pieData} className="h-full w-full" />
    </div>
  );
}
