import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { resolveApiBaseUrl } from './services/apiConfig';
import './styles/tailwind.css';

async function bootstrap() {
  await resolveApiBaseUrl();

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

bootstrap();
