import React from 'react';
import LegalLayout from '../../components/legal/LegalLayout';

const Section = ({ title, children }) => (
  <section>
    <h2 className="text-base font-semibold text-white mb-2">{title}</h2>
    {children}
  </section>
);

const TermsPage = () => (
  <LegalLayout title="Términos de servicio">
    <p>
      Bienvenido a MonArgent. Al crear una cuenta o utilizar la aplicación, aceptás estos
      términos. Si no estás de acuerdo, no uses el servicio.
    </p>

    <Section title="1. Descripción del servicio">
      <p>
        MonArgent es una aplicación de finanzas personales que te permite registrar ingresos y
        gastos, definir metas de ahorro, gestionar gastos compartidos en grupos, escanear
        comprobantes, recibir recomendaciones financieras asistidas por IA y facilitar pagos
        entre miembros mediante alias de Mercado Pago.
      </p>
    </Section>

    <Section title="2. Cuenta y elegibilidad">
      <p>
        Debés ser mayor de 18 años y proporcionar información veraz al registrarte. Sos
        responsable de mantener la confidencialidad de tu contraseña y de toda actividad en tu
        cuenta.
      </p>
    </Section>

    <Section title="3. Uso permitido">
      <p>
        Te comprometés a usar MonArgent de forma lícita y personal. No podés intentar acceder
        a cuentas ajenas, interferir con el funcionamiento del servicio ni utilizar la
        plataforma para actividades fraudulentas.
      </p>
    </Section>

    <Section title="4. Datos financieros">
      <p>
        Los montos, categorías y demás información que cargues son responsabilidad tuya.
        MonArgent ofrece herramientas de organización y análisis, pero no constituye asesoramiento
        financiero, contable ni legal. Las recomendaciones generadas por IA son orientativas.
      </p>
    </Section>

    <Section title="5. Grupos y pagos">
      <p>
        En gastos compartidos, los acuerdos entre participantes son responsabilidad de los
        usuarios. MonArgent puede mostrar alias de Mercado Pago para facilitar transferencias,
        pero no procesa pagos ni custodia fondos en tu nombre.
      </p>
    </Section>

    <Section title="6. Disponibilidad y cambios">
      <p>
        Podemos actualizar, suspender o discontinuar funciones del servicio. Te notificaremos
        cambios relevantes cuando sea razonable. El uso continuado tras una actualización implica
        aceptación de los nuevos términos.
      </p>
    </Section>

    <Section title="7. Limitación de responsabilidad">
      <p>
        MonArgent se ofrece &quot;tal cual&quot;. No garantizamos que el servicio esté libre de
        errores ni interrupciones. En la medida permitida por la ley, no seremos responsables por
        pérdidas indirectas derivadas del uso de la aplicación.
      </p>
    </Section>

    <Section title="8. Contacto">
      <p>
        Para consultas sobre estos términos, escribinos a{' '}
        <a href="mailto:monargent2026@gmail.com" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">
          monargent2026@gmail.com
        </a>
        .
      </p>
    </Section>
  </LegalLayout>
);

export default TermsPage;
