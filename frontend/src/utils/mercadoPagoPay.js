import { formatPeso } from './format';

const MP_ANDROID_PACKAGE = 'com.mercadopago.wallet';
const MP_PLAY_STORE = `https://play.google.com/store/apps/details?id=${MP_ANDROID_PACKAGE}`;
const MP_APP_STORE = 'https://apps.apple.com/ar/app/mercado-pago-cuenta-digital/id925750276';

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isMobileDevice() {
  return isAndroid() || isIOS();
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

function tryOpenWithHiddenFrame(url) {
  const frame = document.createElement('iframe');
  frame.style.display = 'none';
  frame.src = url;
  document.body.appendChild(frame);
  window.setTimeout(() => frame.remove(), 2500);
}

/**
 * Abre la app nativa de Mercado Pago. MP no expone un deep link público
 * confiable para transferir a un alias; el alias ya queda copiado para pegar.
 */
export function openMercadoPagoTransfer() {
  if (!isMobileDevice()) {
    window.open('https://www.mercadopago.com.ar/', '_blank', 'noopener,noreferrer');
    return;
  }

  if (isAndroid()) {
    // Intent nativo: evita la web intermedia "ingresá a la app..."
    const intentUrl = `intent://home#Intent;scheme=mercadopago;package=${MP_ANDROID_PACKAGE};end`;
    window.location.href = intentUrl;
    window.setTimeout(() => {
      if (document.visibilityState === 'visible') {
        window.location.href = `mercadopago://home`;
      }
    }, 700);
    window.setTimeout(() => {
      if (document.visibilityState === 'visible') {
        window.location.href = MP_PLAY_STORE;
      }
    }, 2200);
    return;
  }

  // iOS: custom scheme (Safari no permite prellenar alias en transferencia)
  window.location.href = 'mercadopago://';
  tryOpenWithHiddenFrame('mercadopago://home');
  window.setTimeout(() => {
    if (document.visibilityState === 'visible') {
      window.location.href = MP_APP_STORE;
    }
  }, 2200);
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
  openMercadoPagoTransfer();

  const amountLabel = amount != null ? formatPeso(amount, { decimals: 2 }) : null;
  if (amountLabel) {
    return `Alias copiado (${trimmed}). En Mercado Pago: Transferir → pegá el alias → ${amountLabel} a ${creditorNick}.`;
  }
  return `Alias copiado (${trimmed}). En Mercado Pago elegí Transferir y pegá el alias de ${creditorNick}.`;
}
