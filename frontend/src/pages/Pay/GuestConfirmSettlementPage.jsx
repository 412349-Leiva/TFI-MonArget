import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import api from '../../services/api';

export default function GuestConfirmSettlementPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('El enlace de confirmación no es válido.');
      return;
    }

    api.post('/public/groups/guest-settlements/confirm', { token })
      .then((response) => {
        setStatus('ok');
        setMessage(response.data?.message || 'Pago confirmado correctamente.');
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error.response?.data?.message || 'No pudimos confirmar el pago.');
      });
  }, [token]);

  return (
    <AuthLayout
      title="Confirmar cobro"
      subtitle="Gastos grupales"
      footer={(
        <p className="text-sm text-on-surface-variant">
          ¿Querés ver tus grupos en la app?{' '}
          <Link to="/register" className="text-primary hover:underline">
            Crear cuenta
          </Link>
        </p>
      )}
    >
      {status === 'loading' && (
        <p className="text-sm text-slate-300 text-center">Confirmando pago…</p>
      )}
      {status === 'ok' && (
        <p className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-center">
          {message}
        </p>
      )}
      {status === 'error' && (
        <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-center">
          {message}
        </p>
      )}
    </AuthLayout>
  );
}
