import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import { formatPeso } from '../../utils/format';

const GuestPayPage = () => {
  const [params] = useSearchParams();
  const alias = params.get('alias') || '';
  const creditor = params.get('to') || 'el cobrador';
  const amount = params.get('amount');
  const group = params.get('group') || 'gastos grupales';
  const status = params.get('status');
  const formattedAmount = amount != null && !Number.isNaN(Number(amount)) ? formatPeso(amount, { decimals: 2 }) : null;

  const copyAlias = () => {
    if (!alias) return;
    navigator.clipboard?.writeText(alias);
    alert(`Alias copiado: ${alias}`);
  };

  const openMercadoPago = () => {
    window.open('https://www.mercadopago.com.ar/home', '_blank', 'noopener,noreferrer');
  };

  const statusMessage = {
    ok: 'Pago registrado en Mercado Pago. Gracias.',
    pending: 'Tu pago está pendiente de confirmación.',
    error: 'El pago no se completó. Podés intentar de nuevo.',
  }[status];

  return (
    <AuthLayout
      title="Pagar deuda"
      subtitle={group ? `Grupo: ${group}` : undefined}
      footer={
        <p className="text-sm text-on-surface-variant">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Iniciar sesión
          </Link>
        </p>
      }
    >
      {statusMessage && (
        <p className="text-sm text-amber-300 bg-amber-400/10 border border-amber-400/30 rounded-lg px-3 py-2">
          {statusMessage}
        </p>
      )}

      {formattedAmount ? (
        <div className="text-center space-y-1">
          <p className="text-on-surface-variant text-sm">Monto a transferir</p>
          <p className="text-3xl font-semibold text-primary">{formattedAmount}</p>
          <p className="text-on-surface-variant text-sm">a {creditor}</p>
        </div>
      ) : (
        <p className="text-sm text-on-surface-variant text-center">
          Revisá el monto en el correo que recibiste.
        </p>
      )}

      {alias && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
          <p className="text-xs text-on-surface-variant uppercase tracking-wide">Alias Mercado Pago</p>
          <p className="text-lg font-amount break-all">{alias}</p>
          <button
            type="button"
            onClick={copyAlias}
            className="w-full rounded-lg border border-primary/40 text-primary py-2 text-sm hover:bg-primary/10 transition-colors"
          >
            Copiar alias
          </button>
        </div>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={openMercadoPago}
          className="w-full rounded-lg bg-primary text-slate-900 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Abrir Mercado Pago para pagar
        </button>
        <p className="text-xs text-on-surface-variant text-center">
          En Mercado Pago elegí &quot;Transferir&quot; y pegá el alias del cobrador.
        </p>
      </div>

      <div className="pt-2 border-t border-white/10 space-y-2">
        <p className="text-sm text-on-surface-variant text-center">
          Registrate en MonArgent para ver tus grupos y gastos en un solo lugar.
        </p>
        <Link
          to="/register"
          className="block w-full text-center rounded-lg border border-white/20 py-2 text-sm hover:bg-white/5 transition-colors"
        >
          Crear cuenta gratis
        </Link>
      </div>
    </AuthLayout>
  );
};

export default GuestPayPage;
