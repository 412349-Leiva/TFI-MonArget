import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { FiBarChart2, FiCalendar, FiDollarSign, FiMessageCircle, FiPieChart, FiUsers } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const navigation = [
  { to: '/dashboard', label: 'Inicio', icon: FiBarChart2 },
  { to: '/transactions', label: 'Movs', icon: FiDollarSign },
  { to: '/calendar', label: 'Calendario', icon: FiCalendar },
  { to: '/goals', label: 'Objetivos', icon: FiPieChart },
  { to: '/groups', label: 'Grupos', icon: FiUsers },
];

export function MainLayout() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <main className="min-h-screen bg-navy-950 text-stone-100">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-navy-950 px-4 pb-24 pt-4 md:max-w-6xl md:px-6 md:pb-8">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Buen día</p>
            <h1 className="mt-1 text-2xl font-semibold text-stone-50 md:text-3xl">
              {user?.name ?? 'MonArgent'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 text-stone-200 shadow-soft transition hover:bg-white/10">
              <FiCalendar />
            </button>
            <div className="grid h-11 w-11 place-items-center rounded-full bg-gold-500 text-sm font-semibold text-navy-950 shadow-glow">
              {user?.name?.slice(0, 1) ?? 'M'}{user?.lastname?.slice(0, 1) ?? 'A'}
            </div>
          </div>
        </header>

        <section className="flex-1 pb-4">
          <Outlet />
        </section>

        <nav className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-navy-950/95 px-3 py-2 backdrop-blur md:static md:mt-8 md:border md:border-white/10 md:rounded-3xl md:bg-white/5">
          <div className="mx-auto grid max-w-[430px] grid-cols-5 gap-1 md:max-w-none">
            {navigation.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-xs transition ${
                    active ? 'text-gold-500' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Icon className={`text-lg ${active ? 'text-gold-500' : ''}`} />
                  <span>{label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </main>
  );
}