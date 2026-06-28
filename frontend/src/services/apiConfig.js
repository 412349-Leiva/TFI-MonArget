const DEFAULT_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

let resolvedBaseUrl = null;
let resolvePromise = null;

export function resolveApiBaseUrl() {
  if (resolvedBaseUrl) {
    return Promise.resolve(resolvedBaseUrl);
  }
  if (resolvePromise) {
    return resolvePromise;
  }

  resolvePromise = (async () => {
    if (import.meta.env.VITE_API_URL) {
      resolvedBaseUrl = import.meta.env.VITE_API_URL.replace(/\/$/, '');
      return resolvedBaseUrl;
    }

    try {
      const response = await fetch('/app-config.json', { cache: 'no-store' });
      if (response.ok) {
        const config = await response.json();
        if (config.apiBaseUrl) {
          resolvedBaseUrl = config.apiBaseUrl.replace(/\/$/, '');
          return resolvedBaseUrl;
        }
      }
    } catch {
      // Sin app-config.json: dev local con proxy de Vite.
    }

    resolvedBaseUrl = DEFAULT_BASE_URL;
    return resolvedBaseUrl;
  })();

  return resolvePromise;
}

export function getApiBaseUrl() {
  return resolvedBaseUrl || DEFAULT_BASE_URL;
}

export function usesNgrok(baseUrl = getApiBaseUrl()) {
  if (baseUrl.includes('ngrok')) {
    return true;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    return host.includes('ngrok-free.app')
      || host.includes('ngrok-free.dev')
      || host.includes('ngrok.io')
      || host.includes('ngrok.app');
  }
  return false;
}
