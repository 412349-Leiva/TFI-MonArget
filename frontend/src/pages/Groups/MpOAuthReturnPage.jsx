import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hasValidSession } from '../../utils/authRedirect';
import { isLegacyAppHost, toCanonicalUrl } from '../../utils/canonicalApp';
import { purgePwaCacheOnOAuthReturn } from '../../utils/pwa';

const MpOAuthReturnPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [ready, setReady] = useState(false);

  const mpStatus = searchParams.get('mp');
  const mpMessage = searchParams.get('mpMessage');
  const hasSession = hasValidSession();

  useEffect(() => {
    if (isLegacyAppHost()) {
      window.location.replace(toCanonicalUrl(`/mp-return?${searchParams.toString()}`));
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await purgePwaCacheOnOAuthReturn();
      if (cancelled) return;

      if (mpStatus === 'connected' && hasSession) {
        await refreshUser?.();
        navigate('/groups', { replace: true, state: { mpConnected: true } });
        return;
      }

      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [mpStatus, hasSession, navigate, refreshUser]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#0B1528] flex items-center justify-center text-slate-300">
        Procesando conexión con Mercado Pago...
      </div>
    );
  }

  if (mpStatus === 'connected') {
    return (
      <div className="min-h-screen bg-[#0B1528] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-emerald-400/30 bg-[#0f2543] p-6 space-y-4 text-center">
          <h1 className="text-xl font-semibold text-emerald-200">Mercado Pago conectado</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            La autorización se completó en Mercado Pago. Volvé a la app oficial de MonArgent
            (no uses la URL de ngrok) para ver el estado en Gastos grupales.
          </p>
          <a
            href={toCanonicalUrl('/login')}
            className="inline-flex w-full items-center justify-center rounded-lg bg-[#009ee3] text-white py-3 font-semibold"
          >
            Abrir MonArgent e iniciar sesión
          </a>
          <Link to="/groups" className="block text-sm text-sky-300 underline">
            Ya tengo sesión abierta en esta pestaña
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1528] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-red-400/30 bg-[#0f2543] p-6 space-y-4 text-center">
        <h1 className="text-xl font-semibold text-red-200">No se pudo conectar</h1>
        <p className="text-sm text-slate-400">{mpMessage || 'Intentá de nuevo desde Gastos grupales.'}</p>
        <Link
          to={hasSession ? '/groups' : '/login'}
          className="inline-flex w-full items-center justify-center rounded-lg border border-[#284567] py-3"
        >
          Volver a MonArgent
        </Link>
      </div>
    </div>
  );
};

export default MpOAuthReturnPage;
