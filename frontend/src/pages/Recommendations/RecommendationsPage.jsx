import Layout from '../../components/layout/Layout';
import { Sparkles, TrendingUp, CircleAlert, ShieldAlert, Trophy } from 'lucide-react';

const cards = [
  {
    id: 1,
    title: 'Restaurantes al alza',
    description:
      'Gastaste 35% mas en restaurantes este mes respecto a abril. Gasto extra de $8.200.',
    border: 'border-l-red-500',
    icon: TrendingUp,
  },
  {
    id: 2,
    title: 'Oportunidad de ahorro',
    description:
      'Reduciendo $2.000/semana en entretenimiento, alcanzas tu meta de Brasil 2 meses antes.',
    border: 'border-l-yellow-500',
    icon: Sparkles,
  },
  {
    id: 3,
    title: 'Vencimiento proximo',
    description:
      'Tu tarjeta Visa vence el 28 de mayo por $42.500. Tenes saldo para cubrirlo.',
    border: 'border-l-orange-500',
    icon: ShieldAlert,
  },
  {
    id: 4,
    title: 'iExcelente habito!',
    description:
      'Ahorraste el 28% de tus ingresos este mes, superando tu objetivo historico del 20%.',
    border: 'border-l-yellow-500',
    icon: Trophy,
  },
];

const RecommendationsPage = () => {
  return (
    <Layout>
      <div className="text-slate-100 max-w-xl mx-auto">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-slate-50 flex items-center gap-2">
            <Sparkles size={18} className="text-amber-400" />
            Recomendaciones IA
          </h2>
          <p className="text-xs text-slate-400 mt-1">Basadas en tus habitos de mayo 2026</p>
        </div>

        <section className="bg-[#102744] border border-[#274466] rounded-2xl p-4 mb-4">
          <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400">Salud financiera del mes</p>
          <div className="mt-2 flex items-end gap-3">
            <span className="text-5xl leading-none font-serif text-amber-300">72</span>
            <div>
              <p className="text-xl font-semibold">Buena</p>
              <p className="text-xs text-sky-200">+ 5 puntos vs. abril</p>
            </div>
          </div>
          <div className="mt-4 h-1.5 rounded-full bg-[#2e4c72] overflow-hidden">
            <div className="h-full w-[68%] bg-amber-400" />
          </div>
          <div className="mt-2 grid grid-cols-4 text-[10px] text-slate-400">
            <span>Critico</span>
            <span>Regular</span>
            <span>Buena</span>
            <span className="text-right">Excelente</span>
          </div>
        </section>

        <div className="space-y-3">
          {cards.map(({ id, title, description, border, icon: Icon }) => (
            <article
              key={id}
              className={`rounded-2xl border border-[#203d60] ${border} bg-[#0f2440] px-4 py-4`}
            >
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Icon size={16} className="text-slate-300" />
                {title}
              </h3>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">{description}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-[#355675] bg-[#102744] p-4">
          <p className="text-sm text-slate-200 flex items-center gap-2">
            <CircleAlert size={16} className="text-amber-400" />
            Estas recomendaciones son visuales por ahora. La logica IA real se integra en la siguiente fase.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default RecommendationsPage;
