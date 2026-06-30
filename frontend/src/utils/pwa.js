export function isStandalonePwa() {
  return (
    window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
  );
}

export function isMobileDevice() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/** PWA instalada o celular: OAuth debe ir al navegador del sistema, no al webview de la PWA. */
export function shouldOpenOAuthInSystemBrowser() {
  return isStandalonePwa() || isMobileDevice();
}

export function openInSystemBrowser(url) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export async function refreshPwaAfterOAuth() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.update()));
  } catch {
    // ignore — best effort
  }
}

const OAUTH_PURGE_KEY = 'ma_oauth_cache_purged';

/** Tras volver de Mercado Pago, limpia SW/caché una vez y recarga la app nueva. */
export async function purgePwaCacheOnOAuthReturn() {
  const params = new URLSearchParams(window.location.search);
  const mpStatus = params.get('mp');
  if (!mpStatus) return false;

  const purgeToken = params.get('mpTs') || mpStatus;
  if (sessionStorage.getItem(OAUTH_PURGE_KEY) === purgeToken) {
    return false;
  }

  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // ignore
  }

  sessionStorage.setItem(OAUTH_PURGE_KEY, purgeToken);
  window.location.reload();
  return true;
}
