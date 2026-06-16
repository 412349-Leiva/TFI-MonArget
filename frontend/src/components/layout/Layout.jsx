import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  House,
  Calendar,
  Target,
  Sparkles,
  Users,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Inicio', icon: House },
  { path: '/calendar', label: 'Calendario', icon: Calendar },
  { path: '/goals', label: 'Objetivos', icon: Target },
  { path: '/recommendations', label: 'IA', icon: Sparkles },
  { path: '/groups', label: 'Grupos', icon: Users },
];

const PAGE_TITLES = {
  '/dashboard': 'Inicio',
  '/transactions': 'Transacciones',
  '/calendar': 'Calendario',
  '/goals': 'Objetivos',
  '/recommendations': 'Recomendaciones',
  '/groups': 'Grupos',
};

const STORAGE_KEY = 'sidebar_expanded';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [expanded, setExpanded] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  };

  const isActive = (path) => location.pathname === path;

  const handleNav = (path) => {
    navigate(path);
  };

  const getInitials = () => {
    const source = user?.name || user?.email || 'TL';
    if (source.includes('@')) {
      return source.slice(0, 2).toUpperCase();
    }

    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((piece) => piece[0])
      .join('')
      .toUpperCase();
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'Tamara Leiva';
  const mobileTitle = PAGE_TITLES[location.pathname] || 'MonArgent';
  const isDashboard = location.pathname === '/dashboard';

  const activeClass =
    'bg-amber-500/15 text-amber-400 border-l-2 border-amber-400';
  const inactiveClass =
    'text-slate-400 hover:bg-slate-800 hover:text-slate-200 hover:translate-x-1';
  const baseNavClass =
    'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 text-sm font-medium';

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 transition-all duration-300 ease-in-out flex-shrink-0 ${
          expanded ? 'w-64' : 'w-16'
        }`}
      >
        {/* Logo */}
        <div
          className={`h-14 flex items-center border-b border-slate-700/50 cursor-pointer hover:opacity-80 transition-opacity overflow-hidden ${
            expanded ? 'px-5 gap-3' : 'justify-center'
          }`}
          onClick={() => navigate('/dashboard')}
        >
          <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-amber-600 rounded-md flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-slate-900 font-black text-xs">MA</span>
          </div>
          {expanded && (
            <span className="whitespace-nowrap font-bold text-base">
              <span className="text-white">Mon</span>
              <span className="text-amber-400">Argent</span>
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 overflow-hidden">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <div key={path} className={expanded ? 'px-3' : 'px-2'}>
              <button
                onClick={() => handleNav(path)}
                title={!expanded ? label : undefined}
                className={`${baseNavClass} ${
                  isActive(path) ? activeClass : inactiveClass
                } ${!expanded ? 'justify-center px-0' : ''}`}
              >
                <Icon size={18} className="flex-shrink-0" />
                {expanded && <span className="truncate">{label}</span>}
              </button>
            </div>
          ))}
        </nav>

        {/* Toggle button */}
        <div className="border-t border-slate-700/50 p-3 flex justify-center">
          <button
            onClick={toggleExpanded}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all duration-150"
            title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {expanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-4 md:px-6 bg-[#081b33] border-b border-[#234063]/50">
          <div className="md:hidden">
            {isDashboard ? (
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400">Buen dIa.</p>
                <p className="text-lg font-semibold text-slate-100 leading-tight">{displayName}</p>
              </div>
            ) : (
              <p className="text-2xl font-semibold text-slate-100 leading-tight">{mobileTitle}</p>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <span className="text-xl font-semibold text-slate-100">{mobileTitle}</span>
          </div>

          {/* Spacer for desktop */}
          <div className="hidden md:block flex-1" />

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="w-9 h-9 rounded-full border border-[#2a4466] bg-[#102946] text-amber-300 flex items-center justify-center"
              aria-label="Notificaciones"
            >
              <Bell size={16} />
            </button>
            <button
              type="button"
              className="w-9 h-9 rounded-full border border-[#2a4466] bg-[#102946] text-slate-100 text-xs font-semibold flex items-center justify-center"
              aria-label="Perfil"
            >
              {getInitials()}
            </button>
            <span className="hidden sm:inline-block text-sm text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full truncate max-w-xs">
              {user?.email || ''}
            </span>
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="hidden md:inline-flex p-2 rounded-lg text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-all duration-150"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main
          className="flex-1 overflow-auto bg-gradient-to-b from-[#071b34] to-[#06162b] p-4 pb-24 md:pb-6 md:p-6 lg:p-8"
          style={{
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#26415f] bg-[#081b33]/95 backdrop-blur-xl px-2 py-2 pb-safe">
          <div className="grid grid-cols-5 gap-1">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const active = isActive(path);

              return (
                <button
                  key={path}
                  onClick={() => handleNav(path)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 transition-colors ${
                    active
                      ? 'text-amber-400 bg-amber-500/10'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-[10px] leading-none">{label}</span>
                  <span className={`h-1 w-1 rounded-full ${active ? 'bg-amber-400' : 'bg-transparent'}`} />
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Layout;
