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

function buildWebTransferUrl(alias, amount) {
  const query = new URLSearchParams();
  if (alias?.trim()) query.set('alias', alias.trim());
  if (amount != null && !Number.isNaN(Number(amount))) {
    query.set('amount', Number(amount).toFixed(2));
  }
  const qs = query.toString();
  return qs ? `${MP_TRANSFER_WEB}?${qs}` : MP_TRANSFER_WEB;
}

/** Copia el alias y abre Mercado Pago (web o app si el SO lo ofrece). */
export function openMercadoPagoTransfer(alias, amount) {
  const webUrl = buildWebTransferUrl(alias, amount);

  if (!isMobileDevice()) {
    openExternalUrl(webUrl);
    return;
  }

  window.location.assign(webUrl);
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
    ? `Alias copiado. En Mercado Pago: Transferir → pegá ${trimmed} → ${amountLabel}.`
    : `Alias de ${creditorNick} copiado (${trimmed}). Abrí Mercado Pago y elegí Transferir.`;
}
