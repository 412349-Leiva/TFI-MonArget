import React from 'react';
import { Link } from 'react-router-dom';
import LegalLayout from '../../components/legal/LegalLayout';

const Section = ({ title, children }) => (
  <section>
    <h2 className="text-base font-semibold text-white mb-2">{title}</h2>
    {children}
  </section>
);

const PrivacyPage = () => (
  <LegalLayout title="Política de privacidad y seguridad">
    <p>
      Esta política explica qué datos usamos, para qué, con quién los compartimos y cómo los
      cuidamos. Las reglas de uso de la app están en los{' '}
      <Link to="/terminos" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">
        Términos de servicio
      </Link>
      (edad mínima, cuenta y límites de uso).
    </p>

    <Section title="1. Datos que recopilamos">
      <ul className="list-disc pl-5 space-y-1">
        <li><strong className="text-slate-200">Cuenta:</strong> nombre, correo y contraseña (guardada cifrada).</li>
        <li><strong className="text-slate-200">Financieros:</strong> movimientos, categorías, objetivos, límites y perfil.</li>
        <li><strong className="text-slate-200">Grupos:</strong> grupos, integrantes, gastos compartidos y comprobantes de liquidación.</li>
        <li><strong className="text-slate-200">Tickets:</strong> fotos o archivos que subís para importar gastos.</li>
        <li><strong className="text-slate-200">Pagos en grupos:</strong> el alias público de Mercado Pago que configurás (no pedimos ni guardamos tu contraseña de MP).</li>
        <li><strong className="text-slate-200">Técnicos:</strong> registros básicos de uso y errores para mantener el servicio.</li>
      </ul>
    </Section>

    <Section title="2. Para qué los usamos">
      <p>
        Para que la app funcione: iniciar sesión, mostrar tu información, armar balances de grupos,
        gráficos, códigos de verificación y, cuando lo pedís, recomendaciones o lectura de tickets.
      </p>
    </Section>

    <Section title="3. Con quién se comparten">
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong className="text-slate-200">Proveedor de IA:</strong> solo cuando pedís recomendaciones
          o importar un ticket; se envía lo mínimo necesario para esa función.
        </li>
        <li>
          <strong className="text-slate-200">Mercado Pago:</strong> no compartimos datos bancarios
          completos; en grupos se muestra el alias que vos cargaste.
        </li>
        <li>
          <strong className="text-slate-200">Correo:</strong> proveedor SMTP para códigos de
          verificación y recuperación de contraseña.
        </li>
      </ul>
      <p className="mt-2">
        No vendemos tu información personal.
      </p>
    </Section>

    <Section title="4. Seguridad">
      <p>
        Aplicamos medidas razonables de seguridad: contraseñas cifradas, tráfico por HTTPS,
        acceso restringido a la base de datos y tokens de sesión con vencimiento. Ningún sistema
        es infalible: usá una contraseña única y no la compartas.
      </p>
    </Section>

    <Section title="5. Conservación">
      <p>
        Guardamos tus datos mientras tu cuenta esté activa. Podés pedir el cierre de cuenta y la
        eliminación de datos asociados escribiéndonos.
      </p>
    </Section>

    <Section title="6. Tus derechos">
      <p>
        Según la normativa argentina aplicable, podés acceder, rectificar, actualizar o pedir la
        eliminación de tus datos personales, y oponerte al tratamiento en los casos que la ley
        prevé.
      </p>
    </Section>

    <Section title="7. Cambios">
      <p>
        Podemos actualizar esta política. La versión vigente queda publicada en la app con la
        fecha de última actualización.
      </p>
    </Section>

    <Section title="8. Contacto">
      <p>
        Para ejercer derechos o consultar sobre privacidad y seguridad:{' '}
        <a href="mailto:monargent2026@gmail.com" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">
          monargent2026@gmail.com
        </a>
        .
      </p>
    </Section>
  </LegalLayout>
);

export default PrivacyPage;
