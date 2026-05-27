import { FiArrowDownLeft, FiArrowUpRight, FiCamera, FiUsers } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { BalanceCard } from '../components/finance/BalanceCard';
import { FinancialSummaryCard } from '../components/finance/FinancialSummaryCard';
import { QuickActionCard } from '../components/finance/QuickActionCard';
import { TransactionItem, type TransactionItemData } from '../components/finance/TransactionItem';
import { Card } from '../components/ui/Card';

const recentTransactions: TransactionItemData[] = [
  { id: 1, title: 'Supermercado Día', category: 'Alimentación', date: 'Hoy', amount: '-$ 4.500', type: 'EXPENSE' },
  { id: 2, title: 'Netflix', category: 'Entretenimiento', date: 'Ayer', amount: '-$ 2.990', type: 'EXPENSE' },
  { id: 3, title: 'Sueldo Mayo', category: 'Ingresos', date: '1 May', amount: '+$ 185.000', type: 'INCOME' },
];

const quickActions = [
  { label: 'Ingresos', icon: <FiArrowDownLeft />, accent: 'sky' as const },
  { label: 'Gastos', icon: <FiArrowUpRight />, accent: 'rose' as const },
  { label: 'Escanear', icon: <FiCamera />, accent: 'gold' as const },
  { label: 'Grupos', icon: <FiUsers />, accent: 'violet' as const },
];

const graphBars = [52, 60, 45, 63, 57, 66, 61, 68, 62, 70];

export function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-5 pb-6">
      <BalanceCard balance="$ 102.510" income="$ 185.000" expenses="$ 52.490" />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {quickActions.map((action) => (
          <QuickActionCard
            key={action.label}
            label={action.label}
            icon={action.icon}
            accent={action.accent}
            onClick={() => navigate(action.label === 'Ingresos' ? '/transactions?type=INCOME' : action.label === 'Gastos' ? '/transactions?type=EXPENSE' : '/transactions')}
          />
        ))}
      </section>

      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-stone-50">Evolución de gastos</h3>
            <p className="text-sm text-stone-400">Últimos 6 meses</p>
          </div>
          <span className="text-sm text-stone-400">Mock data</span>
        </div>

        <div className="relative h-44 overflow-hidden rounded-[24px] bg-gradient-to-b from-white/5 to-transparent p-4">
          <div className="absolute inset-x-0 bottom-0 h-[72%] bg-[radial-gradient(circle_at_top,rgba(214,177,74,0.15),transparent_60%)]" />
          <div className="relative flex h-full items-end gap-3">
            {graphBars.map((height, index) => (
              <div key={index} className="flex-1">
                <div
                  className="mx-auto w-[80%] rounded-t-full bg-gradient-to-t from-gold-500 to-gold-500/30 shadow-glow"
                  style={{ height: `${height}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-xs text-stone-500">
            <span>Ene</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Abr</span>
            <span>May</span>
            <span>Jun</span>
          </div>
        </div>
      </Card>

      <section className="grid grid-cols-2 gap-3">
        <FinancialSummaryCard title="Objetivo de ahorro" value="$ 28.000" note="78% cumplido este mes" />
        <FinancialSummaryCard title="Límite activo" value="$ 50.000" note="Uber / Movilidad" />
      </section>

      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-stone-50">Movimientos recientes</h3>
            <p className="text-sm text-stone-400">Tus últimos registros</p>
          </div>
          <button className="text-sm font-medium text-gold-500">Ver todos</button>
        </div>

        <div className="space-y-3">
          {recentTransactions.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} />
          ))}
        </div>
      </Card>
    </div>
  );
}