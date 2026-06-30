import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { resolveApiBaseUrl } from './services/apiConfig';
import { purgePwaCacheOnOAuthReturn } from './utils/pwa';
import './styles/tailwind.css';

async function bootstrap() {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    try {
      const registrations = await navigator.serviceWorker?.getRegistrations?.() ?? [];
      await Promise.all(registrations.map((registration) => registration.unregister()));
    } catch {
      // ignore — evita pantalla en blanco por SW viejo en desarrollo local
    }
  }

  if (await purgePwaCacheOnOAuthReturn()) {
    return;
  }

  await resolveApiBaseUrl();

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

bootstrap();
