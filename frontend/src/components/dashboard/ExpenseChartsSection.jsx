import React, { useEffect, useMemo, useRef, useState } from 'react';
import apiClient from '../../services/api';
import MonthYearPicker from '../ui/MonthYearPicker';
import InteractiveBarChart3D from '../charts/InteractiveBarChart3D';
import InteractivePieChart3D from '../charts/InteractivePieChart3D';
import {
  aggregateExpensesByCategory,
  aggregateExpensesByMonth,
  buildMonthRange,
  formatMonthLabelLong,
} from '../../utils/chartData';
import {
  exportComparisonReportPdf,
  exportCategoryReportPdf,
  formatPercent,
  formatRankingPosition,
} from '../../utils/pdfExport';

import { formatPeso } from '../../utils/format';

const fetchMonthExpenses = async (month, year) => {
  const params = new URLSearchParams({ month, year, type: 'EXPENSE' });
  const { data } = await apiClient.get(`/transactions?${params.toString()}`);
  return data;
};

const ExpenseChartsSection = ({ categories }) => {
  const now = new Date();
  const comparisonRef = useRef(null);
  const comparisonChartRef = useRef(null);
  const pieRef = useRef(null);
  const pieChartRef = useRef(null);

  const [rangeStartMonth, setRangeStartMonth] = useState(1);
  const [rangeStartYear, setRangeStartYear] = useState(now.getFullYear());
  const [rangeEndMonth, setRangeEndMonth] = useState(now.getMonth() + 1);
  const [rangeEndYear, setRangeEndYear] = useState(now.getFullYear());

  const [pieMonth, setPieMonth] = useState(now.getMonth() + 1);
  const [pieYear, setPieYear] = useState(now.getFullYear());

  const [comparisonData, setComparisonData] = useState([]);
  const [pieTransactions, setPieTransactions] = useState([]);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [loadingPie, setLoadingPie] = useState(false);
  const [exporting, setExporting] = useState('');

  const selectedMonths = useMemo(
    () => buildMonthRange(rangeStartMonth, rangeStartYear, rangeEndMonth, rangeEndYear, 24),
    [rangeStartMonth, rangeStartYear, rangeEndMonth, rangeEndYear],
  );

  useEffect(() => {
    if (selectedMonths.length === 0) {
      setComparisonData([]);
      return;
    }

    let cancelled = false;
    const loadComparison = async () => {
      setLoadingComparison(true);
      try {
        const monthlyData = await Promise.all(
          selectedMonths.map(async ({ month, year, label }) => ({
            month,
            year,
            label,
            transactions: await fetchMonthExpenses(month, year),
          })),
        );
        if (!cancelled) {
          setComparisonData(aggregateExpensesByMonth(monthlyData));
        }
      } finally {
        if (!cancelled) setLoadingComparison(false);
      }
    };

    loadComparison();
    return () => { cancelled = true; };
  }, [selectedMonths]);

  useEffect(() => {
    let cancelled = false;
    const loadPie = async () => {
      setLoadingPie(true);
      try {
        const data = await fetchMonthExpenses(pieMonth, pieYear);
        if (!cancelled) setPieTransactions(data);
      } finally {
        if (!cancelled) setLoadingPie(false);
      }
    };

    loadPie();
    return () => { cancelled = true; };
  }, [pieMonth, pieYear]);

  const pieData = useMemo(
    () => aggregateExpensesByCategory(pieTransactions, categories),
    [pieTransactions, categories],
  );

  const buildPercent = (value, total) => formatPercent(value, total);

  const handleExportComparison = async () => {
    setExporting('comparison');
    try {
      const total = comparisonData.reduce((sum, row) => sum + row.total, 0);
      const avg = comparisonData.length ? total / comparisonData.length : 0;
      const sorted = [...comparisonData].sort((a, b) => b.total - a.total);
      const maxMonth = sorted[0];
      const minMonth = [...comparisonData].sort((a, b) => a.total - b.total)[0];
      const periodLabel = comparisonData.length === 1
        ? formatMonthLabelLong(comparisonData[0].month, comparisonData[0].year)
        : `${formatMonthLabelLong(comparisonData[0].month, comparisonData[0].year)} - ${formatMonthLabelLong(
          comparisonData[comparisonData.length - 1].month,
          comparisonData[comparisonData.length - 1].year,
        )}`;

      await exportComparisonReportPdf({
        chartElement: comparisonChartRef.current || comparisonRef.current,
        filename: 'comparativa-gastos.pdf',
        periodLabel,
        summaryRows: [
          { label: 'Total gastado', value: formatPeso(total) },
          { label: 'Promedio mensual', value: formatPeso(avg) },
          { label: 'Mes con mayor gasto', value: maxMonth ? formatMonthLabelLong(maxMonth.month, maxMonth.year) : '—' },
          { label: 'Mes con menor gasto', value: minMonth ? formatMonthLabelLong(minMonth.month, minMonth.year) : '—' },
        ],
        monthlyRows: comparisonData.map((row) => [
          formatMonthLabelLong(row.month, row.year),
          formatPeso(row.total),
        ]),
        analysisLines: [
          `El gasto total durante el período fue de ${formatPeso(total)}.`,
          `El promedio mensual fue de ${formatPeso(avg)}.`,
          maxMonth ? `El mayor gasto se registró en ${formatMonthLabelLong(maxMonth.month, maxMonth.year)}.` : '',
          minMonth ? `El menor gasto se registró en ${formatMonthLabelLong(minMonth.month, minMonth.year)}.` : '',
        ].filter(Boolean),
      });
    } finally {
      setExporting('');
    }
  };

  const handleExportPie = async () => {
    setExporting('pie');
    try {
      const total = pieData.reduce((sum, row) => sum + row.value, 0);
      const sorted = [...pieData].sort((a, b) => b.value - a.value);
      const top = sorted[0];
      const bottom = sorted[sorted.length - 1];
      const periodLabel = formatMonthLabelLong(pieMonth, pieYear);

      await exportCategoryReportPdf({
        chartElement: pieChartRef.current || pieRef.current,
        filename: 'gastos-por-categoria.pdf',
        periodLabel,
        summaryRows: [
          { label: 'Total gastado', value: formatPeso(total) },
          { label: 'Categorías con gastos', value: String(pieData.length) },
          { label: 'Categoría con mayor gasto', value: top?.name || '—' },
          { label: 'Categoría con menor gasto', value: bottom?.name || '—' },
        ],
        categoryRows: pieData.map((row) => [
          row.name,
          formatPeso(row.value),
          buildPercent(row.value, total),
        ]),
        rankingRows: sorted.slice(0, 3).map((row, index) => [
          formatRankingPosition(index),
          row.name,
          formatPeso(row.value),
        ]),
        analysisLines: [
          top ? `La categoría con mayor gasto fue ${top.name}, representando el ${buildPercent(top.value, total)} del total.` : '',
          bottom ? `La categoría con menor gasto fue ${bottom.name}, con el ${buildPercent(bottom.value, total)}.` : '',
          `Se registraron gastos en ${pieData.length} categorías durante el período.`,
        ].filter(Boolean),
      });
    } finally {
      setExporting('');
    }
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      <div className="rounded-3xl border border-[#284567] bg-[#0f2543] p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-section-title">Comparativa de gastos</h3>
            <p className="text-xs text-slate-400 mt-1">Elegí el rango de meses · arrastrá para girar</p>
          </div>
          <button
            type="button"
            onClick={handleExportComparison}
            disabled={exporting === 'comparison' || comparisonData.length === 0}
            className="text-xs px-3 py-2 rounded-lg bg-amber-400 text-slate-900 font-semibold disabled:opacity-50"
          >
            {exporting === 'comparison' ? 'Exportando...' : 'PDF'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <MonthYearPicker
            label="Desde"
            month={rangeStartMonth}
            year={rangeStartYear}
            onChange={(m, y) => { setRangeStartMonth(m); setRangeStartYear(y); }}
          />
          <MonthYearPicker
            label="Hasta"
            month={rangeEndMonth}
            year={rangeEndYear}
            onChange={(m, y) => { setRangeEndMonth(m); setRangeEndYear(y); }}
          />
        </div>

        <div ref={comparisonRef} className="h-80">
          {selectedMonths.length === 0 ? (
            <p className="text-sm text-slate-400 pt-8 text-center">
              El mes inicial debe ser anterior o igual al final.
            </p>
          ) : loadingComparison ? (
            <p className="text-sm text-slate-400 pt-8 text-center">Cargando...</p>
          ) : (
            <div ref={comparisonChartRef} className="h-full w-full rounded-xl bg-gradient-to-b from-[#132a4a]/40 to-transparent">
              <InteractiveBarChart3D data={comparisonData} className="h-full w-full" />
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-[#284567] bg-[#0f2543] p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-section-title">Gastos por categoría</h3>
            <p className="text-xs text-slate-400 mt-1">Distribución del período · arrastrá para girar</p>
          </div>
          <button
            type="button"
            onClick={handleExportPie}
            disabled={exporting === 'pie' || pieData.length === 0}
            className="text-xs px-3 py-2 rounded-lg bg-amber-400 text-slate-900 font-semibold disabled:opacity-50"
          >
            {exporting === 'pie' ? 'Exportando...' : 'PDF'}
          </button>
        </div>

        <MonthYearPicker
          label="Período"
          month={pieMonth}
          year={pieYear}
          onChange={(m, y) => { setPieMonth(m); setPieYear(y); }}
          className="mb-4 max-w-xs"
        />

        <div ref={pieRef} className="h-80">
          {loadingPie ? (
            <p className="text-sm text-slate-400 pt-8 text-center">Cargando...</p>
          ) : pieData.length === 0 ? (
            <p className="text-sm text-slate-400 pt-8 text-center">No hay gastos en este mes.</p>
          ) : (
            <div ref={pieChartRef} className="h-full w-full rounded-xl bg-gradient-to-b from-[#132a4a]/40 to-transparent">
              <InteractivePieChart3D data={pieData} className="h-full w-full" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ExpenseChartsSection;
