import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import apiClient from '../../services/api';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function buildCalendarGrid(year, month) {
  // month is 1-indexed
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function groupByDay(transactions) {
  const map = {};
  for (const tx of transactions) {
    const d = new Date(tx.date).getDate();
    if (!map[d]) map[d] = [];
    map[d].push(tx);
  }
  return map;
}

function formatAmount(amount) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount);
}

const CalendarPage = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [transactions, setTransactions] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setSelectedDay(null);
      try {
        const res = await apiClient.get('/transactions', {
          params: { month: selectedMonth, year: selectedYear },
        });
        setTransactions(res.data || []);
      } catch {
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [selectedMonth, selectedYear]);

  const goToPrev = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const goToNext = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const cells = buildCalendarGrid(selectedYear, selectedMonth);
  const byDay = groupByDay(transactions);

  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const todayDay =
    now.getFullYear() === selectedYear && now.getMonth() + 1 === selectedMonth
      ? now.getDate()
      : null;

  const selectedDayTxs = selectedDay ? (byDay[selectedDay] || []) : [];

  return (
    <Layout>
      <div className="text-white">
        <h1 className="text-3xl font-bold mb-6">Calendario</h1>

        {/* Monthly summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <p className="text-slate-400 text-sm mb-1">Ingresos del mes</p>
            <p className="text-green-400 text-2xl font-bold">{formatAmount(totalIncome)}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <p className="text-slate-400 text-sm mb-1">Gastos del mes</p>
            <p className="text-red-400 text-2xl font-bold">{formatAmount(totalExpense)}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPrev}
            className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-amber-500 hover:text-amber-400 transition-colors hover:scale-105 transition-transform"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-amber-400">
            {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </h2>
          <button
            onClick={goToNext}
            className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-amber-500 hover:text-amber-400 transition-colors hover:scale-105 transition-transform"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar grid */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden mb-6">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-700">
            {DAY_LABELS.map((label) => (
              <div
                key={label}
                className="py-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide"
              >
                {label}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {cells.map((day, idx) => {
                const dayTxs = day ? (byDay[day] || []) : [];
                const incomes = dayTxs.filter((t) => t.type === 'INCOME');
                const expenses = dayTxs.filter((t) => t.type === 'EXPENSE');
                const isToday = day === todayDay;
                const isSelected = day === selectedDay;
                const hasTxs = dayTxs.length > 0;

                // dots to show: up to 2 visible, rest as "+N"
                const visibleDots = [];
                let remaining = 0;
                if (incomes.length > 0) visibleDots.push('income');
                if (expenses.length > 0) visibleDots.push('expense');
                const allDots = [
                  ...incomes.map(() => 'income'),
                  ...expenses.map(() => 'expense'),
                ];
                const shown = allDots.slice(0, 2);
                remaining = allDots.length > 2 ? allDots.length - 2 : 0;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (day && hasTxs) {
                        setSelectedDay(isSelected ? null : day);
                      }
                    }}
                    className={[
                      'min-h-[60px] md:min-h-[90px] p-1 md:p-2 border-b border-r border-slate-700/50 flex flex-col transition-colors',
                      day ? 'cursor-pointer hover:bg-slate-700/50' : '',
                      isSelected ? '' : '',
                      isSelected ? 'bg-amber-500/10 border-amber-500/30' : '',
                      !day ? 'bg-slate-900/20' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {day && (
                      <>
                        <span
                          className={[
                            'text-xs md:text-sm font-medium w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full mb-1',
                            isToday
                              ? 'bg-amber-500 text-slate-900 font-bold'
                              : 'text-slate-300',
                          ].join(' ')}
                        >
                          {day}
                        </span>
                        {/* Dots */}
                        {shown.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-auto">
                            {shown.map((type, i) => (
                              <span
                                key={i}
                                className={[
                                  'w-2 h-2 rounded-full',
                                  type === 'income' ? 'bg-green-400' : 'bg-red-400',
                                ].join(' ')}
                              />
                            ))}
                            {remaining > 0 && (
                              <span className="text-xs text-slate-400">
                                +{remaining}
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Day detail panel */}
        {selectedDay && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-amber-400 mb-4">
              {selectedDay} de {MONTH_NAMES[selectedMonth - 1]} — {selectedDayTxs.length}{' '}
              {selectedDayTxs.length === 1 ? 'transacción' : 'transacciones'}
            </h3>
            <div className="space-y-3">
              {selectedDayTxs.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between bg-slate-900/40 border border-slate-700 rounded-lg px-4 py-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-white">{tx.title}</span>
                    <span className="text-xs text-slate-400">{tx.categoryName}</span>
                  </div>
                  <span
                    className={[
                      'font-bold text-base',
                      tx.type === 'INCOME' ? 'text-green-400' : 'text-red-400',
                    ].join(' ')}
                  >
                    {tx.type === 'INCOME' ? '+' : '-'}
                    {formatAmount(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CalendarPage;
