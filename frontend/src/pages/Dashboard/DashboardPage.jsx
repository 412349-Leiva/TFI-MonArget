import React, { useEffect, useMemo } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import Layout from '../../components/layout/Layout';
import ExpenseChartsSection from '../../components/dashboard/ExpenseChartsSection';
import { CircleDollarSign, Wallet, ScanLine, Users, ShoppingCart, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const formatMoney = (amount) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const DashboardPage = () => {
  const navigate = useNavigate();
  const { transactions, categories, fetchTransactions, fetchCategories } = useTransactions();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  useEffect(() => {
    fetchCategories();
    fetchTransactions(month, year);
  }, [fetchTransactions, fetchCategories, month, year]);

  const stats = useMemo(() => {
    const income = transactions
      .filter((tx) => tx.type === 'INCOME')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const expenses = transactions
      .filter((tx) => tx.type === 'EXPENSE')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }, [transactions]);

  const recentTransactions = useMemo(
    () => [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3),
    [transactions],
  );

  const quickActions = [
    { label: 'Ingresos', icon: CircleDollarSign, onClick: () => navigate('/transactions/income') },
    { label: 'Gastos', icon: Wallet, onClick: () => navigate('/transactions/expense') },
    { label: 'Escanear', icon: ScanLine, onClick: () => navigate('/scan') },
    { label: 'Grupos', icon: Users, onClick: () => navigate('/groups') },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto text-slate-100 pb-4">
        <section className="rounded-3xl border border-[#284567] bg-[#0f2543] p-5 max-w-xl">
          <p className="text-[10px] tracking-[0.25em] uppercase text-slate-400">Saldo disponible</p>
          <h2 className="text-5xl font-serif text-amber-100 mt-2">{formatMoney(stats.balance)}</h2>

          <div className="mt-4 h-px bg-[#2c496d]" />

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Ingresos</p>
              <p className="text-2xl font-mono text-cyan-100 mt-1">{formatMoney(stats.income)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Gastos</p>
              <p className="text-2xl font-mono text-amber-100 mt-1">{formatMoney(stats.expenses)}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-4 gap-3 mt-4 max-w-xl">
          {quickActions.map(({ label, icon: Icon, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="rounded-2xl border border-[#284567] bg-[#0f2543] py-4 px-2 text-center hover:border-amber-400/60"
            >
              <Icon size={16} className="mx-auto text-slate-200" />
              <p className="text-xs mt-2 text-slate-200">{label}</p>
            </button>
          ))}
        </section>

        <ExpenseChartsSection categories={categories} />

        <section className="mt-4 max-w-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-2xl font-semibold">Movimientos recientes</h3>
            <button
              onClick={() => navigate('/transactions')}
              className="text-amber-300 text-sm font-semibold"
            >
              Ver todos
            </button>
          </div>

          <div className="space-y-2">
            {recentTransactions.length === 0 && (
              <div className="rounded-2xl border border-[#284567] bg-[#0f2543] p-4 text-slate-300 text-sm">
                No hay movimientos para mostrar este mes.
              </div>
            )}

            {recentTransactions.map((tx, index) => {
              const expense = tx.type === 'EXPENSE';
              const CategoryIcon = tx.title?.toLowerCase().includes('netflix') ? Play : ShoppingCart;

              return (
                <article
                  key={tx.id ?? `${tx.title}-${index}`}
                  className="rounded-2xl border border-[#284567] bg-[#0f2543] p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#1a3457] flex items-center justify-center text-slate-200">
                      <CategoryIcon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{tx.title || 'Movimiento'}</p>
                      <p className="text-xs text-slate-400 truncate">{tx.categoryName || 'Sin categoría'}</p>
                    </div>
                  </div>

                  <p className={`font-mono text-lg ${expense ? 'text-red-300' : 'text-emerald-300'}`}>
                    {expense ? '-' : '+'} {formatMoney(Number(tx.amount))}
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

export default DashboardPage;
