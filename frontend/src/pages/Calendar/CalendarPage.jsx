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
    maximumFractionDigits: 0,
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

  const todayDay =
    now.getFullYear() === selectedYear && now.getMonth() + 1 === selectedMonth
      ? now.getDate()
      : null;

  const upcomingEvents = transactions
    .filter((tx) => tx.type === 'EXPENSE')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3)
    .map((tx) => ({
      title: tx.title,
      day: new Date(tx.date).getDate(),
      amount: tx.amount,
    }));

  const fallbackEvents = [
    { title: 'Netflix · Spotify', day: 25, amount: 5990 },
    { title: 'Vencimiento Visa', day: 28, amount: 42500 },
    { title: 'Sueldo Junio', day: 1, amount: -185000 },
  ];

  const eventsToRender = upcomingEvents.length > 0 ? upcomingEvents : fallbackEvents;

  return (
    <Layout>
      <div className="text-white max-w-xl mx-auto">
        <section className="bg-[#0f2543] border border-[#284567] rounded-3xl p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToPrev}
              className="w-9 h-9 rounded-full bg-[#173459] border border-[#2b4b72] flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-semibold">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </h2>
            <button
              onClick={goToNext}
              className="w-9 h-9 rounded-full bg-[#173459] border border-[#2b4b72] flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {DAY_LABELS.map((label) => (
              <div
                key={label}
                className="py-2 text-center text-xs font-semibold text-slate-400"
              >
                {label}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-y-2">
              {cells.map((day, idx) => {
                const dayTxs = day ? (byDay[day] || []) : [];
                const incomes = dayTxs.filter((t) => t.type === 'INCOME');
                const expenses = dayTxs.filter((t) => t.type === 'EXPENSE');
                const isToday = day === todayDay;
                const hasTxs = dayTxs.length > 0;
                const due = hasTxs && incomes.length === 0 && expenses.length > 0;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (day) {
                        setSelectedDay(day);
                      }
                    }}
                    className={[
                      'min-h-[42px] p-1 flex flex-col items-center justify-start cursor-pointer',
                      selectedDay === day ? 'bg-amber-500/30 rounded-xl' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {day && (
                      <>
                        <span
                          className={[
                            'text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full',
                            isToday
                              ? 'bg-[#2d4667] text-amber-300'
                              : 'text-slate-100',
                          ].join(' ')}
                        >
                          {day}
                        </span>
                        {hasTxs && (
                          <span
                            className={`mt-1 w-1.5 h-1.5 rounded-full ${
                              incomes.length > 0 ? 'bg-yellow-400' : due ? 'bg-orange-400' : 'bg-red-400'
                            }`}
                          />
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="h-px bg-[#2c496d] my-4" />

          <div className="flex items-center justify-center gap-4 text-xs text-slate-300">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" />Ingreso</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" />Gasto</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" />Vencimiento</span>
          </div>
        </section>

        <section className="mt-4">
          <h3 className="text-2xl font-semibold mb-3">Proximos eventos</h3>
          <div className="space-y-2">
            {eventsToRender.map((event, index) => {
              const isIncome = Number(event.amount) < 0;

              return (
                <article
                  key={`${event.title}-${index}`}
                  className="rounded-2xl border border-[#284567] bg-[#0f2543] p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#173459] flex items-center justify-center text-amber-300 font-semibold">
                      {event.day}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{event.title}</p>
                      <p className="text-xs text-slate-400">{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</p>
                    </div>
                  </div>
                  <p className={`font-mono text-xl ${isIncome ? 'text-amber-300' : 'text-red-300'}`}>
                    {isIncome ? '+' : '-'}{formatAmount(Math.abs(Number(event.amount)))}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default CalendarPage;
