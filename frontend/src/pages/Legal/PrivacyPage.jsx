import React from 'react';
import LegalLayout from '../../components/legal/LegalLayout';

const Section = ({ title, children }) => (
  <section>
    <h2 className="text-base font-semibold text-white mb-2">{title}</h2>
    {children}
  </section>
);

const PrivacyPage = () => (
  <LegalLayout title="Política de privacidad">
    <p>
      En MonArgent respetamos tu privacidad. Esta política describe qué datos recopilamos,
      para qué los usamos y cuáles son tus derechos.
    </p>

    <Section title="1. Datos que recopilamos">
      <ul className="list-disc pl-5 space-y-1">
        <li><strong className="text-slate-200">Cuenta:</strong> nombre, correo electrónico y contraseña (almacenada de forma cifrada).</li>
        <li><strong className="text-slate-200">Financieros:</strong> transacciones, categorías, metas, límites de gasto y perfil financiero.</li>
        <li><strong className="text-slate-200">Grupos:</strong> nombres de grupos, miembros, gastos compartidos y comprobantes de liquidación.</li>
        <li><strong className="text-slate-200">Comprobantes:</strong> imágenes o archivos que subís para escaneo OCR.</li>
        <li><strong className="text-slate-200">Mercado Pago:</strong> alias público para facilitar pagos en grupos (no almacenamos credenciales OAuth de MP en esta función).</li>
        <li><strong className="text-slate-200">Técnicos:</strong> registros básicos de uso y errores para mantener el servicio.</li>
      </ul>
    </Section>

    <Section title="2. Finalidad del tratamiento">
      <p>
        Usamos tus datos para operar la aplicación: autenticarte, mostrar tu información
        financiera, calcular balances en grupos, generar gráficos, enviar códigos de
        verificación y, cuando lo solicitás, obtener recomendaciones o extraer datos de
        comprobantes.
      </p>
    </Section>

    <Section title="3. Terceros">
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong className="text-slate-200">Google Gemini:</strong> procesa texto e imágenes de
          comprobantes y contexto financiero anonimizado para recomendaciones y extracción OCR.
          Solo se envía lo necesario para cada función solicitada.
        </li>
        <li>
          <strong className="text-slate-200">Mercado Pago:</strong> utilizamos únicamente el alias
          que configurás para mostrar datos de pago entre miembros de un grupo. No compartimos tu
          contraseña ni datos bancarios completos.
        </li>
        <li>
          <strong className="text-slate-200">Correo electrónico:</strong> proveedor SMTP para
          enviar códigos de verificación y recuperación de contraseña.
        </li>
      </ul>
    </Section>

    <Section title="4. Seguridad">
      <p>
        Aplicamos medidas técnicas y organizativas razonables: contraseñas cifradas, comunicación
        cifrada (HTTPS), acceso restringido a la base de datos y tokens de sesión con expiración.
        Ningún sistema es 100 % infalible; te recomendamos usar una contraseña única y fuerte.
      </p>
    </Section>

    <Section title="5. Conservación">
      <p>
        Conservamos tus datos mientras mantengas una cuenta activa. Podés solicitar la eliminación
        de tu cuenta y datos asociados contactándonos.
      </p>
    </Section>

    <Section title="6. Tus derechos">
      <p>
        De acuerdo con la normativa aplicable en Argentina, podés acceder, rectificar,
        actualizar o solicitar la eliminación de tus datos personales. También podés oponerte al
        tratamiento en los casos previstos por ley.
      </p>
    </Section>

    <Section title="7. Menores">
      <p>
        MonArgent no está dirigido a menores de 18 años. No recopilamos datos de menores de forma
        intencional.
      </p>
    </Section>

    <Section title="8. Cambios">
      <p>
        Podemos actualizar esta política. Publicaremos la versión vigente en la aplicación con la
        fecha de última actualización.
      </p>
    </Section>

    <Section title="9. Contacto">
      <p>
        Para ejercer tus derechos o realizar consultas sobre privacidad, escribinos a{' '}
        <a href="mailto:monargent2026@gmail.com" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">
          monargent2026@gmail.com
        </a>
        .
      </p>
    </Section>
  </LegalLayout>
);

export default PrivacyPage;
