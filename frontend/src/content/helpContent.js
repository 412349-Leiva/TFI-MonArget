/**
 * Textos de ayuda contextual (panel chico del “?”).
 * Mantener tono breve y en español.
 */
export const HELP = {
  goals: {
    title: 'Metas de ahorro',
    body: [
      'Una meta es un objetivo con monto y fecha. Podés depositar plata a medida que ahorrás.',
      'El progreso muestra cuánto llevás vs. el objetivo. Cuando llegás al 100%, la meta se marca como completada.',
      'Los depósitos se registran como egresos en la categoría de ahorro y cuentan para tu balance del mes.',
    ],
  },
  mood: {
    title: 'Salud financiera',
    body: [
      'El puntaje va de 0 a 100 y se calcula con 4 factores de 25 puntos cada uno (mes actual):',
      '• Equilibrio ingresos/egresos: mejor si tus ingresos cubren o superan los gastos (≥120% = 25 pts).',
      '• Gastos grupales: 25 pts si no debés; baja si tenés deudas pendientes en liquidaciones (tope bajo < $15.000).',
      '• Objetivos: según el progreso promedio de tus metas activas (≥80% = 25 pts).',
      '• Límites de gasto: mejor si respetás los límites del mes (o si no configuraste ninguno).',
      'Carita: 0–39 atención · 40–69 en camino · 70–100 saludable. Si el mes cierra en rojo o superaste 2+ límites, el tope queda en “en camino”.',
    ],
  },
  groups: {
    title: 'Gastos grupales',
    body: [
      'Creá un grupo, cargá gastos y sumá integrantes (con app o invitados sin cuenta).',
      'Cuando todos los miembros con app confirman los movimientos, se calcula la liquidación: cada uno “debe” o “cobra” según lo gastado vs. la cuota equitativa.',
      'Para pagar: se usa el alias (Mercado Pago). El deudor transfiere, puede subir comprobante y el cobrador confirma. También se puede marcar efectivo.',
      'Configurá tu alias en esta pantalla para que te puedan pagar.',
    ],
  },
  groupsSettlement: {
    title: 'Liquidación del grupo',
    body: [
      'La cuota por persona = total del grupo ÷ cantidad de integrantes.',
      'Si gastaste más que la cuota, te deben; si gastaste menos, debés la diferencia.',
      'El sistema arma transferencias mínimas entre deudores y acreedores. Cada pago se marca cuando el cobrador confirma (o con flujo de efectivo).',
    ],
  },
  scan: {
    title: 'Importar desde ticket',
    body: [
      'Sacá foto o subí el ticket. Extraemos productos con OCR + IA.',
      'Revisá monto, categoría y fecha de cada ítem. Si algo falló, corregilo antes de aceptar.',
      'Al tocar Aceptar se registran como gastos/ingresos del mes. La fecha por defecto es hoy para que los veas en Movimientos del mes actual.',
    ],
  },
  limits: {
    title: 'Límites de gasto',
    body: [
      'Un límite topea cuánto podés gastar en una categoría durante el mes.',
      'Cada egreso de esa categoría suma al acumulado. Si te pasás, la app te avisa y eso afecta tu puntuación de salud financiera.',
      'No es lo mismo que una meta: el límite frena un gasto; la meta junta ahorro hacia un objetivo.',
    ],
  },
};
