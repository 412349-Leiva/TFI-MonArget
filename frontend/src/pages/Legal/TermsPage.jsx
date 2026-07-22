import React from 'react';
import { Link } from 'react-router-dom';
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
      Bienvenido a MonArgent. Al crear una cuenta o usar la app, aceptás estos términos.
      Si no estás de acuerdo, no uses el servicio.
    </p>
    <p>
      Lo relacionado con datos personales, seguridad y privacidad está en la{' '}
      <Link to="/privacidad" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">
        Política de privacidad
      </Link>
      ; acá solo hablamos de las reglas de uso.
    </p>

    <Section title="1. Qué es MonArgent">
      <p>
        MonArgent es una app de finanzas personales: registrás ingresos y gastos, armás objetivos
        de ahorro, limitás categorías, compartís gastos en grupos, importás tickets y recibís
        recomendaciones orientativas. También facilita transferencias entre miembros mostrando
        alias de Mercado Pago, pero no procesa pagos ni custodia plata.
      </p>
    </Section>

    <Section title="2. Cuenta y elegibilidad">
      <p>
        Tenés que ser mayor de 18 años y dar información veraz al registrarte. Sos responsable
        de lo que pase en tu cuenta (incluyendo el cuidado de tu contraseña).
      </p>
    </Section>

    <Section title="3. Uso permitido">
      <p>
        Usá MonArgent de forma lícita y personal. No podés entrar a cuentas ajenas, romper o
        sobrecargar el servicio, ni usarlo para fraude u otras actividades ilegales.
      </p>
    </Section>

    <Section title="4. Contenido que cargás">
      <p>
        Los montos, categorías y demás datos que ingresás son tuyos y bajo tu responsabilidad.
        MonArgent es una herramienta de organización: no es asesoramiento financiero, contable
        ni legal. Las recomendaciones asistidas son orientativas.
      </p>
    </Section>

    <Section title="5. Grupos y pagos entre usuarios">
      <p>
        En gastos compartidos, los acuerdos entre participantes son responsabilidad de ustedes.
        La app puede mostrar un alias de Mercado Pago para facilitar la transferencia; el pago
        lo hacen ustedes por fuera de MonArgent.
      </p>
    </Section>

    <Section title="6. Disponibilidad y cambios">
      <p>
        Podemos actualizar, suspender o sacar funciones. Avisamos cambios relevantes cuando sea
        razonable. Seguir usando la app después de un cambio implica aceptar los términos nuevos.
      </p>
    </Section>

    <Section title="7. Limitación de responsabilidad">
      <p>
        MonArgent se ofrece &quot;tal cual&quot;. No garantizamos que el servicio esté libre de
        errores o cortes. En la medida que permita la ley, no respondemos por pérdidas indirectas
        derivadas del uso de la app.
      </p>
    </Section>

    <Section title="8. Contacto">
      <p>
        Consultas sobre estos términos:{' '}
        <a href="mailto:monargent2026@gmail.com" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">
          monargent2026@gmail.com
        </a>
        .
      </p>
    </Section>
  </LegalLayout>
);

export default TermsPage;
