import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import apiClient from '../../services/api';
import {
  aggregateExpensesByCategory,
  aggregateExpensesByMonth,
  buildMonthRange,
} from '../../utils/chartData';
import { exportElementToPdf } from '../../utils/pdfExport';

const formatMoney = (amount) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ][index],
}));

const fetchMonthExpenses = async (month, year) => {
  const params = new URLSearchParams({ month, year, type: 'EXPENSE' });
  const { data } = await apiClient.get(`/transactions?${params.toString()}`);
  return data;
};

const ExpenseChartsSection = ({ categories }) => {
  const now = new Date();
  const comparisonRef = useRef(null);
  const pieRef = useRef(null);

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

  const yearOptions = useMemo(() => {
    const currentYear = now.getFullYear();
    return Array.from({ length: 6 }, (_, index) => currentYear - 3 + index);
  }, [now]);

  const handleExportComparison = async () => {
    setExporting('comparison');
    try {
      await exportElementToPdf(comparisonRef.current, 'comparativa-gastos.pdf');
    } finally {
      setExporting('');
    }
  };

  const handleExportPie = async () => {
    setExporting('pie');
    try {
      await exportElementToPdf(pieRef.current, 'gastos-por-categoria.pdf');
    } finally {
      setExporting('');
    }
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      <div className="rounded-3xl border border-[#284567] bg-[#0f2543] p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xl font-semibold">Comparativa de gastos</h3>
            <p className="text-xs text-slate-400 mt-1">Elegí un rango de hasta 24 meses</p>
          </div>
          <button
            type="button"
            onClick={handleExportComparison}
            disabled={exporting === 'comparison' || comparisonData.length === 0}
            className="text-xs px-3 py-2 rounded-lg bg-amber-400 text-slate-900 font-semibold disabled:opacity-50"
          >
            {exporting === 'comparison' ? 'Exportando...' : 'Exportar PDF'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Desde</label>
            <div className="flex gap-2">
              <select
                value={rangeStartMonth}
                onChange={(e) => setRangeStartMonth(Number(e.target.value))}
                className="flex-1 rounded-lg bg-[#162238] border border-[#284567] px-2 py-2"
              >
                {monthOptions.map((option) => (
                  <option key={`start-m-${option.value}`} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select
                value={rangeStartYear}
                onChange={(e) => setRangeStartYear(Number(e.target.value))}
                className="w-24 rounded-lg bg-[#162238] border border-[#284567] px-2 py-2"
              >
                {yearOptions.map((year) => (
                  <option key={`start-y-${year}`} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Hasta</label>
            <div className="flex gap-2">
              <select
                value={rangeEndMonth}
                onChange={(e) => setRangeEndMonth(Number(e.target.value))}
                className="flex-1 rounded-lg bg-[#162238] border border-[#284567] px-2 py-2"
              >
                {monthOptions.map((option) => (
                  <option key={`end-m-${option.value}`} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select
                value={rangeEndYear}
                onChange={(e) => setRangeEndYear(Number(e.target.value))}
                className="w-24 rounded-lg bg-[#162238] border border-[#284567] px-2 py-2"
              >
                {yearOptions.map((year) => (
                  <option key={`end-y-${year}`} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div ref={comparisonRef} className="h-72">
          {selectedMonths.length === 0 ? (
            <p className="text-sm text-slate-400 pt-8 text-center">
              El mes inicial debe ser anterior o igual al mes final.
            </p>
          ) : loadingComparison ? (
            <p className="text-sm text-slate-400 pt-8 text-center">Cargando comparativa...</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#284567" />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => formatMoney(value)}
                  contentStyle={{ backgroundColor: '#162238', border: '1px solid #284567' }}
                />
                <Bar dataKey="total" name="Gastos" fill="#D9B44A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-[#284567] bg-[#0f2543] p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xl font-semibold">Gastos por categoría</h3>
            <p className="text-xs text-slate-400 mt-1">Distribución del mes seleccionado</p>
          </div>
          <button
            type="button"
            onClick={handleExportPie}
            disabled={exporting === 'pie' || pieData.length === 0}
            className="text-xs px-3 py-2 rounded-lg bg-amber-400 text-slate-900 font-semibold disabled:opacity-50"
          >
            {exporting === 'pie' ? 'Exportando...' : 'Exportar PDF'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Mes</label>
            <select
              value={pieMonth}
              onChange={(e) => setPieMonth(Number(e.target.value))}
              className="w-full rounded-lg bg-[#162238] border border-[#284567] px-2 py-2"
            >
              {monthOptions.map((option) => (
                <option key={`pie-m-${option.value}`} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Año</label>
            <select
              value={pieYear}
              onChange={(e) => setPieYear(Number(e.target.value))}
              className="w-full rounded-lg bg-[#162238] border border-[#284567] px-2 py-2"
            >
              {yearOptions.map((year) => (
                <option key={`pie-y-${year}`} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div ref={pieRef} className="h-72">
          {loadingPie ? (
            <p className="text-sm text-slate-400 pt-8 text-center">Cargando gráfico...</p>
          ) : pieData.length === 0 ? (
            <p className="text-sm text-slate-400 pt-8 text-center">No hay gastos en este mes.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatMoney(value)}
                  contentStyle={{ backgroundColor: '#162238', border: '1px solid #284567' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  );
};

export default ExpenseChartsSection;
