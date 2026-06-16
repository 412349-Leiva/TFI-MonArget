import Layout from '../../components/layout/Layout';
import { Building2, Plane, ChevronRight } from 'lucide-react';

const groups = [
  {
    id: 1,
    title: 'Departamento',
    members: 3,
    total: 45000,
    balance: -2000,
    icon: Building2,
  },
  {
    id: 2,
    title: 'Viaje Mendoza',
    members: 5,
    total: 120000,
    balance: 8500,
    icon: Plane,
  },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Math.abs(value));

const GroupsPage = () => (
  <Layout>
    <div className="text-white max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-semibold">Gastos grupales</h2>
        <button className="rounded-full bg-amber-400 text-slate-900 px-5 py-2 font-semibold text-sm">
          + Nuevo grupo
        </button>
      </div>

      <div className="space-y-3">
        {groups.map((group) => {
          const Icon = group.icon;

          return (
            <article
              key={group.id}
              className="rounded-2xl border border-[#284567] bg-[#0f2543] p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1a3457] flex items-center justify-center">
                    <Icon size={17} className="text-slate-100" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{group.title}</p>
                    <p className="text-sm text-slate-400">{group.members} miembros</p>
                  </div>
                </div>

                <ChevronRight size={16} className="text-slate-500" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Total</p>
                  <p className="text-3xl font-mono text-amber-100 mt-1">{formatCurrency(group.total)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Balance</p>
                  <p className={`text-3xl font-mono mt-1 ${group.balance >= 0 ? 'text-amber-300' : 'text-red-300'}`}>
                    {group.balance >= 0 ? '+' : '-'} {formatCurrency(group.balance)}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <section className="mt-4 rounded-2xl border border-[#284567] bg-[#0f2543] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-3">Resumen</p>
        <div className="grid grid-cols-2 divide-x divide-[#284567]">
          <div className="pr-3">
            <p className="text-xs text-slate-400">Te deben</p>
            <p className="text-4xl font-mono text-amber-300 mt-1">+ {formatCurrency(8500)}</p>
          </div>
          <div className="pl-3 text-right">
            <p className="text-xs text-slate-400">Debes</p>
            <p className="text-4xl font-mono text-red-300 mt-1">- {formatCurrency(2000)}</p>
          </div>
        </div>
      </section>
    </div>
  </Layout>
);

export default GroupsPage;