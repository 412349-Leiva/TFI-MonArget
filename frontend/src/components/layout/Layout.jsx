import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Wallet,
  CalendarDays,
  Target,
  Users,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transacciones', icon: Wallet },
  { path: '/calendar', label: 'Calendario', icon: CalendarDays },
  { path: '/goals', label: 'Metas', icon: Target },
  { path: '/groups', label: 'Grupos', icon: Users },
];

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

  const [mobileOpen, setMobileOpen] = useState(false);
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
    setMobileOpen(false);
  };

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

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 flex flex-col transition-all">
            {/* Mobile Logo */}
            <div className="h-14 flex items-center px-5 gap-3 border-b border-slate-700/50">
              <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-amber-600 rounded-md flex items-center justify-center shadow-md">
                <span className="text-slate-900 font-black text-xs">MA</span>
              </div>
              <span className="font-bold text-base">
                <span className="text-white">Mon</span>
                <span className="text-amber-400">Argent</span>
              </span>
            </div>

            {/* Mobile Nav */}
            <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
              {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
                <button
                  key={path}
                  onClick={() => handleNav(path)}
                  className={`${baseNavClass} ${
                    isActive(path) ? activeClass : inactiveClass
                  }`}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            {/* Mobile Logout */}
            <div className="border-t border-slate-700/50 p-3">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-all duration-150 text-sm"
              >
                <LogOut size={18} />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 md:px-6 bg-slate-900/80 backdrop-blur border-b border-slate-700/50">
          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all"
          >
            <Menu size={20} />
          </button>

          {/* Mobile app name */}
          <span className="md:hidden font-bold text-base absolute left-1/2 -translate-x-1/2">
            <span className="text-white">Mon</span>
            <span className="text-amber-400">Argent</span>
          </span>

          {/* Spacer for desktop */}
          <div className="hidden md:block flex-1" />

          {/* Right: email chip + logout */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-sm text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full truncate max-w-xs">
              {user?.email || ''}
            </span>
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="p-2 rounded-lg text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-all duration-150"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main
          className="flex-1 overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6 lg:p-8"
          style={{
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
