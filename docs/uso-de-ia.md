# Documento de uso de Inteligencia Artificial — MonArgent

**Proyecto:** MonArgent (TFI — UTN FRC)  
**Integrante:** 412349 — Leiva Tamara Soledad  
**Metodología:** Scrum (7 sprints)  
**Última actualización:** Sprint 6 (julio 2026)

> Documento vivo. Se actualiza al cerrar cada sprint, sectorizado para facilitar la lectura y la evaluación.  
> En cada sprint se responde de forma explícita a:
>
> 1. **Qué herramientas de IA se usaron**
> 2. **Para qué fueron usadas**
> 3. **Qué partes del código (o del diseño) generó la IA**
> 4. **Qué partes fueron modificadas** por la autora
> 5. **Qué problemas resultaron del uso de IA**

---

## Resumen por sprint

| Sprint | Herramientas | Rol principal |
|--------|--------------|---------------|
| **0** | Figma (generación de UI) | Prototipo visual y organización de módulos |
| **1** | Claude · Gemini · GitHub Copilot | Modelo de datos, aprendizaje React, scaffolding backend |
| **2** | GitHub Copilot (OpenAI Codex) | Refinamiento estético frontend (CSS / Tailwind) |
| **3** | Cursor AI · Figma | Configuración de entorno (ngrok) y pantallas restantes |
| **4** | Cursor AI | Grupos, liquidación, Mercado Pago alias, OCR/importación |
| **5** | Cursor AI | Tests backend, JaCoCo, salud financiera, PWA/deploy |
| **6** | Cursor AI | Tips de ayuda, copy legal, pulido UX y limpieza pre-entrega |

---

## SPRINT 0 — Prototipo visual y organización de módulos

### 1. Herramientas utilizadas

| Herramienta | Tipo |
|-------------|------|
| **Figma** (generación de interfaces de usuario) | Diseño asistido por IA |

### 2. Para qué fueron usadas

Se pasó a Figma la organización de la PWA en módulos según funcionalidades y alcances definidos, junto con la paleta de color y el concepto de producto, para obtener pantallas guía.

**Módulos definidos:**

| Módulo | Descripción |
|--------|-------------|
| **Inicio** | Inspirado en apps de bancos o billeteras virtuales: saldo disponible, carga manual de ingresos/gastos, atajo al *scanner* para movimientos semiautomáticos, creación de grupos de gastos y un gráfico de evolución financiera como impacto visual. |
| **Calendario** | Calendario mensual con marcadores de color (verde: ingresos, rojo: gastos, amarillo: vencimientos) y, debajo, el detalle de esos movimientos. |
| **Objetivos** | Listado de metas financieras (vacaciones, compras grandes) con detalle, porcentaje logrado y motivación visual. |
| **IA** | Recomendaciones inteligentes según hábitos previos; “salud financiera” mes a mes; estadísticas (p. ej. aumento de gastos en restaurantes); oportunidades de ahorro; mejoras destacadas (“ahorraste 10 % más que el mes pasado”); simulador de consultas (“¿Es buena idea comprar un par de zapatillas?”) según respuestas, metas y progreso. |
| **Grupos** | Crear grupos entre usuarios o con nombres (para quienes no tienen la app), cargar aportes, generar balance de cuentas y link de pago hacia Mercado Pago. |

**Criterio de color (educación financiera):**

| Color | Asociación |
|-------|------------|
| **Verde** | Dinero, crecimiento, estabilidad, ahorro y aumento del patrimonio |
| **Azul** | Confianza, seguridad, profesionalismo y planificación a largo plazo |
| **Dorado** | Riqueza, prosperidad y abundancia |
| **Blanco** | Transparencia, claridad y simplicidad |
| **Amarillo / rojo** | Atención y urgencia (alertas, deudas, límites casi completos) |

### 3. Qué generó la IA

- Pantallas / mockups de la PWA a partir de objetivos, alcances, módulos y paleta de color.
- Propuesta visual inicial usable como **guía** para programar, organizar módulos y probar usabilidad.

### 4. Qué partes fueron modificadas

- Cambio del logo por el de creación personal.
- Reorganización de módulos.
- Agregado de detalles de producto: “¿Olvidaste tu contraseña?”, términos y condiciones, campana de notificaciones.
- Eliminación de funciones repetidas o agregados inventados por la IA que no correspondían al alcance.
- Ajustes generales hasta acercar el prototipo a la intención de diseño.

### 5. Problemas resultados del uso de IA

- El diseño generado **no coincidía tal cual** con la visión final del producto.
- Incluyó **funciones o elementos de más** (repetidos o fuera de alcance) que hubo que depurar.
- Sirvió como base visual y de organización, no como entrega definitiva: requiere mejora y perfeccionamiento continuo.

---

## SPRINT 1 — Modelo de datos, stack frontend y backend en capas

### 1. Herramientas utilizadas

| Herramienta | Tipo |
|-------------|------|
| **Claude** | Asistente conversacional (diseño de datos) |
| **Gemini** | Apoyo de aprendizaje / “profesor” técnico |
| **GitHub Copilot** | Asistente de código en el IDE |

### 2. Para qué fueron usadas

#### Claude

- Se le pasó el KickOff y un modelo de base de datos básico, con el flujo esperado.
- Objetivo: terminar de decidir **entidades, relaciones** y recibir sugerencias.
- El modelo final se definió **combinando** la idea propia con las sugerencias de la IA (sujeto a cambios durante el desarrollo).

#### Gemini

- Apoyo a modo “profesor” para investigar y evaluar tecnologías frontend antes de empezar a codificar.
- Se consideró Angular (experiencia académica previa) y se exploró **React** para ampliar conocimientos y acercarse al mercado laboral.
- Uso: comparar Angular vs React, arquitectura y componentes, analizar fragmentos de código y resolver dudas de aprendizaje. **No** se usó para generar el producto final en este sprint.

#### GitHub Copilot

Asistente integrado en el IDE para acelerar implementación:

- Autocompletado inteligente (líneas o bloques).
- Chat interactivo (explicaciones, dudas, propuestas).
- Generación de código a partir de instrucciones.
- Apoyo a documentación y pruebas (luego depurado; la documentación formal se haría después).

**Contexto de arquitectura backend (capas):**

| Capa | Responsabilidad |
|------|-----------------|
| **Entity** | Dominio y mapeo JPA/Hibernate |
| **Repository** | Acceso a datos (CRUD / consultas Spring Data JPA) |
| **Service** | Lógica de negocio |
| **Controller** | Endpoints REST hacia el frontend |
| **DTO** | Transporte entre capas y hacia el cliente, sin exponer entidades |

### 3. Qué generó la IA

- **Claude:** propuestas de entidades, relaciones y refinamiento del modelo de datos (complemento a la definición humana).
- **Gemini:** explicaciones y comparaciones (material de aprendizaje; no código de producción como entregable principal).
- **Copilot:** código repetitivo y nuevas clases alineadas a ejemplos manuales de cada capa (DTO, Controller, Service, Repository, Entity), una vez establecidos los patrones del proyecto.

### 4. Qué partes fueron modificadas

- Revisión de **cada archivo** generado.
- Simplificación de bloques más complejos de lo que el alcance requería.
- Completar implementaciones donde faltaban puntos importantes.
- Limpieza de comentarios, ejemplos, tests y documentación generada de más (la documentación formal se haría después).
- Agregado de archivos específicos como `.env` con credenciales de Google necesarias para el envío de emails (generadas/configuradas por la autora).

### 5. Problemas resultados del uso de IA

- Código a veces **más complejo** de lo necesario para el alcance del TFI.
- Implementaciones **incompletas** (omisión de reglas o detalles importantes).
- Ruido en forma de comentarios, ejemplos, tests o docs prematuros que hubo que limpiar.
- El modelo de datos sugerido por IA fue un punto de partida: puede requerir cambios a lo largo del desarrollo.

---

## SPRINT 2 — Frontend: maquetación y refinamiento visual

### 1. Herramientas utilizadas

| Herramienta | Tipo |
|-------------|------|
| **GitHub Copilot** (modelo basado en OpenAI Codex) | Asistente de código en el IDE |

### 2. Para qué fueron usadas

- Propósito: **optimización y refinamiento estético** de la UI a partir de los mockups, no delegación de la arquitectura.
- La estructura fundamental del frontend se hizo de forma **manual y autónoma**: rutas, flujo de navegación (rutas protegidas, ciclo de vida del usuario), tipografía y arquitectura de componentes React.
- Copilot se usó en la etapa de maquetación y diseño visual (CSS / Tailwind): corrección de estilos, alineación, espaciado (paddings/margins) y adaptabilidad responsiva, a partir de descripciones contextuales basadas en los prototipos.

### 3. Qué generó la IA

- Sugerencias y bloques de estilos CSS / Tailwind.
- Ajustes de layout, espaciado y responsividad alineados a los mockups.

### 4. Qué partes fueron modificadas

- Arquitectura, rutas y lógica de navegación: autoría humana (base del sprint).
- Estilos asistidos por IA: revisados y ajustados para coherencia con el diseño deseado y el sistema visual del proyecto.

### 5. Problemas resultados del uso de IA

- Riesgo de estilos genéricos o inconsistentes si no se contrastan con el mockup: se mitigó usando los prototipos como referencia y revisando cada sugerencia.
- La IA aceleró la traducción diseño → código, pero no reemplazó la decisión de estructura ni de experiencia de usuario.

---

## SPRINT 3 — Entorno de desarrollo y pantallas restantes

### 1. Herramientas utilizadas

| Herramienta | Tipo |
|-------------|------|
| **Cursor AI** | Editor con IA generativa (modos agent, plan, multitask) |
| **Figma** (generación de UI) | Diseño de pantallas restantes y mejora de existentes |

### 2. Para qué fueron usadas

#### Cursor AI

- Agilizar el desarrollo con asistencia contextual sobre el código existente.
- Guía para configurar el entorno: token de autenticación de **ngrok**, variables de entorno del sistema operativo y exposición de la aplicación local, siguiendo pasos correctos según el contexto del proyecto.

#### Figma

- Diseñar pantallas que aún faltaban.
- Mejorar pantallas existentes del prototipo.

### 3. Qué generó la IA

- **Cursor:** orientación paso a paso de configuración (ngrok, variables de entorno, exposición local) y asistencia contextual durante la implementación.
- **Figma:** nuevas pantallas y variantes mejoradas del diseño visual.

### 4. Qué partes fueron modificadas

- Configuración real de tokens, variables y servicios locales realizada y validada por la autora.
- Pantallas de Figma revisadas y alineadas al producto (mismo criterio del Sprint 0: depurar extras y ajustar a la intención de diseño).

### 5. Problemas resultados del uso de IA

- La configuración de herramientas externas (ngrok, entorno) depende de pasos y credenciales reales: la IA guía, pero la validación y el armado final son humanos.
- Nuevos mockups pueden reintroducir detalles fuera de alcance; requieren el mismo filtro de revisión que en Sprint 0.

---

## SPRINT 4 — Grupos, liquidación e importación de tickets

### 1. Herramientas utilizadas

| Herramienta | Tipo |
|-------------|------|
| **Cursor AI** | Asistente de implementación sobre el código existente |

### 2. Para qué fueron usadas

- Completar el módulo de gastos grupales: invitaciones, confirmación de movimientos, liquidación y flujo de pagos (alias Mercado Pago / efectivo / comprobantes).
- Integrar importación de tickets (escaneo + revisión previa a confirmar movimientos).
- Ajustar mensajes y flujos en español para el usuario final.

### 3. Qué generó la IA

- Propuestas de endpoints, servicios y pantallas React alineadas a patrones ya existentes en el repo.
- Borradores de lógica de liquidación y sincronización de estado del grupo.

### 4. Qué partes fueron modificadas

- Revisión de reglas de negocio (quién confirma, invitados sin app, pagos).
- UX de grupos y escáner: validaciones, estados vacíos y copy orientado a demo.
- Depuración de casos borde (comprobantes, alias faltante, categorías).

### 5. Problemas resultados del uso de IA

- Flujos largos (grupo completo) a veces salían incompletos: hubo que cerrar el circuito con pruebas manuales.
- Riesgo de filtrar jerga técnica (p. ej. OCR) al usuario: se corrigió el texto visible.

---

## SPRINT 5 — Calidad, salud financiera y despliegue

### 1. Herramientas utilizadas

| Herramienta | Tipo |
|-------------|------|
| **Cursor AI** | Tests, configuración de entorno y asistencia de deploy |

### 2. Para qué fueron usadas

- Ampliar la suite de tests del backend y aislar la base de prueba.
- Definir / ajustar el puntaje de salud financiera y su explicación en UI.
- Apoyar el armado híbrido (frontend en Vercel + backend local / ngrok) para demos en celular.

### 3. Qué generó la IA

- Tests Mockito / integración siguiendo el inventario del proyecto.
- Ajustes de propiedades de test y scripts de arranque documentados en el README.

### 4. Qué partes fueron modificadas

- Criterio de scoring (ritmo de gasto / ahorro) revisado por la autora.
- Coverage y fallas de CI/local corregidas hasta dejar `mvn test` usable para la defensa.
- Documentación de corrida (README) alineada a lo que realmente hace el sistema.

### 5. Problemas resultados del uso de IA

- Tests generados a veces asumían reglas viejas (p. ej. ratio ingresos/egresos): hubo que reescribir aserciones.
- El stack demo depende de secretos locales (`.env`); la IA no reemplaza la checklist humana pre-presentación.

---

## SPRINT 6 — Ayuda contextual, legal y pulido pre-entrega

### 1. Herramientas utilizadas

| Herramienta | Tipo |
|-------------|------|
| **Cursor AI** | Copy UX, componentes de ayuda y limpieza |

### 2. Para qué fueron usadas

- Tips contextuales (“?”) en objetivos, salud, grupos, límites, calendario y escáner.
- Separar Términos vs Privacidad/seguridad para no repetir información.
- Limpieza visual (logos transparentes, paneles de ayuda, orden de movimientos) y preparación para la defensa.

### 3. Qué generó la IA

- Componente `HelpTip`, textos centralizados y borradores de políticas.
- Scripts / ajustes puntuales de assets y ordenación de listados.

### 4. Qué partes fueron modificadas

- Tono “criollo” y consistencia de términos (objetivo vs meta, sin jerga técnica al usuario).
- Revisión de políticas y enlaces cruzados.
- Barrido final de leftovers (backups, alertas nativas, README del usuario demo).

### 5. Problemas resultados del uso de IA

- Textos legales/ayuda requieren criterio humano: la IA acelera el borrador, no la responsabilidad del contenido.
- Assets regenerados pueden traer fondo residual: se validó transparencia en la UI real.

---

## Criterios transversales de uso de IA en el proyecto

| Principio | Aplicación |
|-----------|------------|
| **IA como acelerador, no como autoría ciega** | Ejemplos humanos primero; luego generación asistida |
| **Revisión obligatoria** | Todo archivo o pantalla generada se revisa, simplifica o completa |
| **Alcance primero** | Se eliminan funciones inventadas o repetidas fuera del TFI |
| **Documento vivo** | Cada sprint agrega o actualiza su sección al cerrar el trabajo |

---

## Próximas actualizaciones

| Sprint | Estado |
|--------|--------|
| Sprint 7 | Pendiente (cierre / retrospectiva breve si la cátedra lo pide) |

Si hay cambios de última hora antes de la defensa, actualizar este documento con la misma estructura de cinco puntos.
