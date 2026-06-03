import React, { useEffect, useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import Layout from '../../components/layout/Layout';
import { TrendingUp, TrendingDown, Wallet, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { transactions, fetchTransactions, fetchCategories } = useTransactions();
  const [stats, setStats] = useState({ income: 0, expenses: 0, balance: 0 });

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  useEffect(() => {
    fetchCategories();
    fetchTransactions(month, year);
  }, [fetchTransactions, fetchCategories, month, year]);

  useEffect(() => {
    const income = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const expenses = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    setStats({
      income,
      expenses,
      balance: income - expenses,
    });
  }, [transactions]);

  const recentTransactions = transactions.slice(0, 5);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8">Dashboard</h1>

        {/* Tarjetas de Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Saldo Total */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-lg p-6 shadow-lg hover:border-amber-400/50 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-2">Saldo Total</p>
                <p className="text-2xl md:text-3xl font-bold text-amber-400">
                  ${stats.balance.toFixed(2)}
                </p>
              </div>
              <Wallet size={32} className="text-amber-400" />
            </div>
          </div>

          {/* Ingresos */}
          <div className="bg-gradient-to-br from-slate-800/50 to-emerald-900/30 border border-emerald-700/50 rounded-lg p-6 shadow-lg hover:border-emerald-600 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-2">Ingresos</p>
                <p className="text-2xl md:text-3xl font-bold text-emerald-400">
                  +${stats.income.toFixed(2)}
                </p>
              </div>
              <TrendingUp size={32} className="text-emerald-400" />
            </div>
          </div>

          {/* Gastos */}
          <div className="bg-gradient-to-br from-slate-800/50 to-red-900/30 border border-red-700/50 rounded-lg p-6 shadow-lg hover:border-red-600 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-2">Gastos</p>
                <p className="text-2xl md:text-3xl font-bold text-red-400">
                  -${stats.expenses.toFixed(2)}
                </p>
              </div>
              <TrendingDown size={32} className="text-red-400" />
            </div>
          </div>
        </div>

        {/* Últimas Transacciones */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-white">Últimas Transacciones</h2>
            <button
              onClick={() => navigate('/transactions')}
              className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition w-fit"
            >
              Ver todas <ArrowRight size={18} />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <p className="text-slate-400 text-center py-8 text-sm">Sin transacciones en este mes</p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-slate-600 transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm md:text-base truncate">{tx.title}</p>
                    <p className="text-slate-400 text-xs md:text-sm">{tx.category.name}</p>
                  </div>
                  <span
                    className={`text-lg font-bold ml-4 flex-shrink-0 ${
                      tx.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {tx.type === 'INCOME' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Período Mostrado */}
        <p className="text-slate-400 text-sm mt-8 text-center">
          Datos del período: {month}/{year}
        </p>
      </div>
    </Layout>
  );
};

export default DashboardPage;