import { formatPeso } from './format';

const MP_TRANSFER_WEB = 'https://www.mercadopago.com.ar/money-out/transfer';

function isMobileDevice() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
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

function openExternalUrl(url) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function buildAppTransferUrl(alias, amount) {
  const trimmedAlias = alias?.trim();
  const amountParam = amount != null && !Number.isNaN(Number(amount))
    ? Number(amount).toFixed(2)
    : null;

  const query = new URLSearchParams();
  if (trimmedAlias) query.set('alias', trimmedAlias);
  if (amountParam) query.set('amount', amountParam);
  const qs = query.toString();
  const suffix = qs ? `?${qs}` : '';

  if (isAndroid() && trimmedAlias) {
    return `intent://money-out/transfer${suffix}#Intent;scheme=mercadopago;package=com.mercadopago.wallet;end`;
  }

  if (trimmedAlias) {
    return `mercadopago://money-out/transfer${suffix}`;
  }

  return 'mercadopago://money-out/transfer';
}

/**
 * En celu: solo abre la app (nunca la web de MP, que pide login en el navegador).
 * En PC: abre transferencia en nueva pestaña.
 */
export function openMercadoPagoTransfer(alias, amount) {
  if (!isMobileDevice()) {
    const query = new URLSearchParams();
    if (alias?.trim()) query.set('alias', alias.trim());
    if (amount != null && !Number.isNaN(Number(amount))) {
      query.set('amount', Number(amount).toFixed(2));
    }
    const qs = query.toString();
    openExternalUrl(qs ? `${MP_TRANSFER_WEB}?${qs}` : MP_TRANSFER_WEB);
    return;
  }

  openExternalUrl(buildAppTransferUrl(alias, amount));
}

/** @deprecated Usar openMercadoPagoTransfer */
export function openMercadoPagoApp() {
  openMercadoPagoTransfer();
}

/**
 * Copia el alias, abre la app de Mercado Pago y devuelve mensaje breve.
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
    ? `Alias copiado. En la app de Mercado Pago: Transferir → pegá ${trimmed} → ${amountLabel}.`
    : `Alias de ${creditorNick} copiado (${trimmed}). Abrí Mercado Pago y elegí Transferir.`;
}

/** Abre checkout MP en pestaña aparte para no perder MonArgent ni caer en login web. */
export function openCheckoutUrl(url) {
  if (!url) return;
  openExternalUrl(url);
}

export function isCheckoutUrl(url) {
  return Boolean(url && /mercadopago|mpago\.la/i.test(url));
}
