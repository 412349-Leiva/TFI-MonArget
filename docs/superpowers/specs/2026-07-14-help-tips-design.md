# Help tips contextuales (preguntas frecuentes inline)

Fecha: 2026-07-14  
Estado: aprobado para implementar

## Objetivo

Botón “?” sutil en 5 funciones clave. Al tocar, abre un panel chico (popover) con explicación breve, sin modal grande.

## Alcance

1. Metas de ahorro  
2. Salud financiera (panel del emoji)  
3. Gastos grupales (lista + detalle liquidación/confirmaciones)  
4. Escanear / importar ticket  
5. Límites de gasto  

## UI

- Componente `HelpTip`: ícono HelpCircle, panel anclado, dismiss al tocar fuera / Escape.  
- Estilo: fondo `#0f2543`, borde `#284567`, título ámbar, texto slate.  
- Copy centralizado en `helpContent.js`.

## Fuera de alcance

Página FAQ dedicada, tooltips nativos, i18n.
