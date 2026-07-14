import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { resolveApiBaseUrl } from './services/apiConfig';
import { redirectLegacyHostIfNeeded } from './utils/canonicalApp';
import './styles/tailwind.css';

function renderBootError(message) {
  const root = document.getElementById('root');
  if (!root) return;
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0B1528;color:#e2e8f0;font-family:system-ui,sans-serif;padding:24px;text-align:center">
      <div>
        <p style="font-size:18px;font-weight:600;margin-bottom:8px">No se pudo iniciar MonArgent</p>
        <p style="font-size:14px;color:#94a3b8;margin-bottom:16px">${message}</p>
        <button type="button" onclick="location.reload()" style="background:#D9B44A;color:#0f172a;border:none;border-radius:8px;padding:10px 16px;font-weight:600;cursor:pointer">
          Reintentar
        </button>
      </div>
    </div>
  `;
}

async function bootstrap() {
  try {
    if (redirectLegacyHostIfNeeded()) {
      return;
    }

    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      try {
        const registrations = await navigator.serviceWorker?.getRegistrations?.() ?? [];
        await Promise.all(registrations.map((registration) => registration.unregister()));
      } catch {
        // ignore — evita pantalla en blanco por SW viejo en desarrollo local
      }
    } else {
      // Una sola vez: limpia PWA/caché vieja que seguía mostrando window.confirm
      const SW_BUST = 'monargent-confirm-modal-v2';
      try {
        if (localStorage.getItem('sw-bust') !== SW_BUST) {
          const registrations = await navigator.serviceWorker?.getRegistrations?.() ?? [];
          await Promise.all(registrations.map((registration) => registration.unregister()));
          if (typeof caches !== 'undefined') {
            const keys = await caches.keys();
            await Promise.all(keys.map((key) => caches.delete(key)));
          }
          localStorage.setItem('sw-bust', SW_BUST);
          window.location.reload();
          return;
        }
      } catch {
        // si falla el bust, seguimos con el boot normal
      }
    }

    await resolveApiBaseUrl();

    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } catch (error) {
    console.error('Error al iniciar la app:', error);
    renderBootError('Recargá la página. Si usás la app instalada, borrá caché o reinstalala.');
  }
}

bootstrap();
