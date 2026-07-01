import { formatPeso } from './format';

const MP_TRANSFER_WEB = 'https://www.mercadopago.com.ar/money-out/transfer';

function isMobileDevice() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  const input = document.createElement('textarea');
  input.value = text;
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(input);
  return ok;
}

/** Solo copia el alias al portapapeles (sin abrir Mercado Pago). */
export async function copyMpAlias(alias) {
  const trimmed = alias?.trim();
  if (!trimmed) {
    throw new Error('No hay alias para copiar.');
  }
  await copyText(trimmed);
  return trimmed;
}

function buildWebTransferUrl(alias, amount) {
  const query = new URLSearchParams();
  if (alias?.trim()) query.set('alias', alias.trim());
  if (amount != null && !Number.isNaN(Number(amount))) {
    query.set('amount', Number(amount).toFixed(2));
  }
  const qs = query.toString();
  return qs ? `${MP_TRANSFER_WEB}?${qs}` : MP_TRANSFER_WEB;
}

function buildAppTransferUrl(alias, amount) {
  const query = new URLSearchParams();
  if (alias?.trim()) query.set('alias', alias.trim());
  if (amount != null && !Number.isNaN(Number(amount))) {
    query.set('amount', Number(amount).toFixed(2));
  }
  const qs = query.toString();
  return qs ? `mercadopago://money-out/transfer?${qs}` : 'mercadopago://home';
}

/** Abre la app de Mercado Pago en móvil o la web en desktop. */
export function openMercadoPagoTransfer(alias, amount) {
  const webUrl = buildWebTransferUrl(alias, amount);

  if (!isMobileDevice()) {
    window.open(webUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  const appUrl = buildAppTransferUrl(alias, amount);
  const start = Date.now();
  window.location.href = appUrl;

  setTimeout(() => {
    if (Date.now() - start < 2500) {
      window.location.href = webUrl;
    }
  }, 1200);
}

/**
 * Copia el alias, abre Mercado Pago y devuelve mensaje breve.
 */
export async function payViaMpAlias(alias, creditorNick, amount) {
  const trimmed = alias?.trim();
  if (!trimmed) {
    throw new Error('El cobrador no tiene alias de Mercado Pago.');
  }

  await copyText(trimmed);
  openMercadoPagoTransfer(trimmed, amount);

  const amountLabel = amount != null ? formatPeso(amount, { decimals: 2 }) : null;
  return amountLabel
    ? `Abrimos Mercado Pago. Transferí ${amountLabel} a ${creditorNick} (alias: ${trimmed}).`
    : `Abrimos Mercado Pago. Transferí a ${creditorNick} (alias: ${trimmed}).`;
}
