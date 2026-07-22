/**
 * Textos de ayuda contextual (panel chico del “?”).
 * Mantener tono breve, criollo y en español.
 */
export const HELP = {
  goals: {
    title: 'Objetivos de ahorro',
    body: [
      'Un objetivo es algo que querés juntar: un monto y, si querés, una fecha.',
      'Vas depositando a medida que ahorrás y ves el avance. Cuando llegás al 100%, el objetivo queda completado.',
      'Cada depósito se anota como un egreso en la categoría de ahorro y cuenta para el balance del mes.',
    ],
  },
  mood: {
    title: 'Salud financiera',
    body: [
      'El puntaje va de 0 a 100. Se arma con 4 partes de 25 puntos cada una (mirando el mes actual):',
      '• Ritmo de gasto: cuánto del ingreso ya gastaste según en qué punto del mes estás. Si a mitad de mes ya se fue el 70% y te queda 30%, va mal. Gastarte más de lo que entró suma cero: ¿con qué plata?',
      '• Gastos grupales: 25 puntos si no debés nada; baja si tenés deudas pendientes en liquidaciones (se toma en cuenta si el monto es bajo, menos de $15.000).',
      '• Objetivos: según cuánto avanzaste en tus objetivos activos (cerca del final = más puntos).',
      '• Límites de gasto: mejor si no te pasás de los tope del mes (o si no armaste ninguno).',
      'Carita: 0–39 ojo · 40–69 en camino · 70–100 bien. Si el mes cierra en rojo o te pasaste de 2 o más límites, no puede quedar en “bien”.',
    ],
  },
  groups: {
    title: 'Gastos grupales',
    body: [
      'Creá un grupo, cargá gastos y sumá gente (con app o invitados sin cuenta).',
      'Cuando todos los que tienen app confirman los movimientos, se arma la liquidación: quién debe y quién cobra según lo que cada uno gastó frente a la cuota pareja.',
      'Para pagar: se usa el alias (Mercado Pago). El que debe transfiere, puede subir el comprobante y el que cobra confirma. También se puede marcar efectivo.',
      'Dejá tu alias en esta pantalla para que te puedan pagar.',
    ],
  },
  groupsSettlement: {
    title: 'Liquidación del grupo',
    body: [
      'La cuota por persona es el total del grupo dividido por la cantidad de integrantes.',
      'Si gastaste más que la cuota, te deben; si gastaste menos, debés la diferencia.',
      'La app arma los pagos entre deudores y acreedores. Cada pago se marca cuando el que cobra confirma (o con efectivo).',
    ],
  },
  scan: {
    title: 'Importar desde ticket',
    body: [
      'Sacá una foto o subí el ticket y la app te arma los ítems para revisar.',
      'Chequeá monto, categoría y fecha de cada uno. Si algo salió mal, corregilo antes de aceptar.',
      'Al tocar Aceptar se guardan como gastos o ingresos del mes. Por defecto la fecha es hoy, para que los veas en Movimientos del mes actual.',
    ],
  },
  limits: {
    title: 'Límites de gasto',
    body: [
      'Un límite es el tope de cuánto podés gastar en una categoría durante el mes.',
      'Cada vez que cargás un egreso de esa categoría, suma. Si te pasás, la app te avisa y eso también baja tu salud financiera.',
      'No es lo mismo que un objetivo: el límite frena un gasto; el objetivo junta plata para algo que querés.',
    ],
  },
  calendar: {
    title: 'Avisos del calendario',
    body: [
      'La app te avisa unos días antes para que no se te pase.',
      'Gastos fijos: te llega un recordatorio 5 días antes y otro 3 días antes.',
      'Eventos: también a los 5 y a los 3 días, y además unas 12 horas antes de la hora que cargaste.',
    ],
  },
};
