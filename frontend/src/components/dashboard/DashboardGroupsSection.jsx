import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Users } from 'lucide-react';
import { groupService } from '../../services/groupService';

const formatMoney = (amount) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Math.abs(Number(amount) || 0));

const DashboardGroupsSection = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    groupService.list()
      .then((res) => setGroups(res.data || []))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="mt-6 max-w-xl">
        <p className="text-sm text-slate-400">Cargando grupos...</p>
      </section>
    );
  }

  if (groups.length === 0) return null;

  return (
    <section className="mt-6 max-w-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Users size={20} className="text-amber-400" />
          Gastos grupales
        </h3>
        <button
          type="button"
          onClick={() => navigate('/groups')}
          className="text-amber-300 text-sm font-semibold"
        >
          Ver todos
        </button>
      </div>

      <div className="space-y-2">
        {groups.map((g) => {
          const balance = Number(g.myBalance) || 0;
          const members = g.memberCount || 0;
          const total = Number(g.totalExpenses) || 0;
          const perPerson = members > 0 ? total / members : 0;

          return (
            <button
              key={g.id}
              type="button"
              onClick={() => navigate('/groups')}
              className="w-full text-left rounded-2xl border border-[#284567] bg-[#0f2543] p-4 hover:border-amber-400/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-100 truncate">{g.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {members} {members === 1 ? 'miembro' : 'miembros'}
                  </p>
                </div>
                <ChevronRight size={18} className="text-slate-500 shrink-0 mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-xs">
                <div>
                  <span className="text-slate-500">Total </span>
                  <span className="text-slate-200 font-mono">{formatMoney(total)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Por persona </span>
                  <span className="text-slate-200 font-mono">{formatMoney(perPerson)}</span>
                </div>
              </div>

              <p className={`mt-2 text-sm font-semibold font-mono ${
                balance > 0 ? 'text-money-income' : balance < 0 ? 'text-money-expense' : 'text-slate-400'
              }`}>
                Balance: {balance > 0 ? '+' : balance < 0 ? '-' : ''}
                {balance !== 0 ? formatMoney(balance) : '$ 0'}
                {balance > 0 && ' (te deben)'}
                {balance < 0 && ' (debés)'}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default DashboardGroupsSection;
