export const CANONICAL_APP_ORIGIN = 'https://frontend-beta-ten-40.vercel.app';

const LEGACY_HOST_PATTERNS = [
  /ngrok-free\.dev$/i,
  /ngrok-free\.app$/i,
  /monargent-taupe/i,
  /frontend-mon-argent/i,
];

export function isLegacyAppHost(hostname = window.location.hostname) {
  if (!hostname) return false;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return false;
  if (hostname === 'frontend-beta-ten-40.vercel.app') return false;
  return LEGACY_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
}

/** Redirige URLs viejas (ngrok, Vercel antiguo) a la app oficial en Vercel. */
export function redirectLegacyHostIfNeeded() {
  if (typeof window === 'undefined' || !isLegacyAppHost()) {
    return false;
  }

  const target = `${CANONICAL_APP_ORIGIN}${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.replace(target);
  return true;
}
