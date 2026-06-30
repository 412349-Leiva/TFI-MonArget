import React from 'react';

const OFFICIAL_HOSTS = new Set([
  'frontend-beta-ten-40.vercel.app',
  'localhost',
  '127.0.0.1',
]);

function isLegacyHost(host) {
  return host.includes('ngrok') || host.includes('monargent-taupe');
}

export default function MpHostWarning() {
  const host = window.location.hostname;

  if (OFFICIAL_HOSTS.has(host)) {
    return null;
  }

  if (!isLegacyHost(host)) {
    return null;
  }

  return (
    <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 space-y-2">
      <p className="font-medium">Estás en una URL vieja o incorrecta ({host})</p>
      <p className="text-amber-100/80 text-xs leading-relaxed">
        Borrá el ícono de MonArgent del celu y abrí la app desde:
        {' '}
        <a
          href="https://frontend-beta-ten-40.vercel.app"
          className="underline text-sky-300"
          target="_blank"
          rel="noopener noreferrer"
        >
          frontend-beta-ten-40.vercel.app
        </a>
        .         Si usás <code className="text-amber-50">monargent-taupe.vercel.app</code> o un ícono viejo,
        podés tener datos desactualizados.
      </p>
    </div>
  );
}
