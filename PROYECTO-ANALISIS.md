# MonArgent — Análisis y Plan de Corrección por Secciones

> Generado: 2026-05-31 | Estado del proyecto: TFI en desarrollo activo

---

## Stack Tecnológico Detectado

| Capa | Tecnología |
|---|---|
| Backend | Java 17+, Spring Boot, Spring Security, JWT, Hibernate/JPA |
| Frontend | React 18, Vite, Tailwind CSS 3, React Router v6, Axios |
| Base de datos | MySQL |
| Integraciones | Gemini API, OCR.Space |
| Build backend | Maven Wrapper (mvnw) |

---

## Arquitectura Backend

Patrón: **Layered Architecture** clásica

```
Controller → Service (interface + impl) → Repository → Entity
                    ↕
                  Mapper
                    ↕
                  DTO (Request / Response)
```

Módulos implementados: Auth, Category, FinancialProfile, FixedExpense, SpendingLimit, Transaction, SavingGoal, Notification, Receipt, Recommendation

---

## Secciones del Proyecto y Estado

---

### SECCIÓN 1 — Controladores de Debug/Test en Producción 🔴 CRÍTICO

**Problema:** Existen 3 controladores que claramente son artefactos de debug y NO deben estar en producción:

- `TestController.java` — expone `/test` GET y POST sin autenticación
- `TestController2.java` — similar al anterior
- `SimpleController.java` — expone `/api/v1/simple` sin autenticación

**Riesgo:** Endpoints abiertos sin seguridad en producción.

**Acción:** Eliminar los 3 archivos.

- [ ] Eliminar `TestController.java`
- [ ] Eliminar `TestController2.java`
- [ ] Eliminar `SimpleController.java`

---

### SECCIÓN 2 — Módulo Groups ✅ COMPLETO

Backend y frontend implementados:

- Ciclo de vida: OPEN → confirmación conjunta → SETTLEMENT → CLOSED
- Pagos por **alias MP** + comprobante + confirmación del acreedor
- Invitaciones, invitados sin cuenta, historial

- [x] GroupController, GroupService, DTOs, migraciones
- [x] GroupDetailView con liquidación y comprobantes

---

### SECCIÓN 3 — Credenciales Hardcodeadas en application.properties 🔴 SEGURIDAD

**Problema:** El archivo `application.properties` tiene credenciales en texto plano:

```properties
spring.datasource.username=root
spring.datasource.password=1234
```

Las variables de JWT, mail y APIs usan correctamente `${ENV_VAR}` pero la DB no.

**Acción:** Mover las credenciales de DB a variables de entorno también.

- [ ] Reemplazar `username=root` por `username=${DB_USERNAME:root}`
- [ ] Reemplazar `password=1234` por `password=${DB_PASSWORD:1234}`
- [ ] Verificar que el `.gitignore` incluye el archivo `.env`

---

### SECCIÓN 4 — Puerto del API en Frontend 🟡 CONFIGURACIÓN

**Problema:** `frontend/src/services/api.js` apunta a `localhost:3002` como fallback:

```js
baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1'
```

Spring Boot por defecto usa el puerto **8080**. El 3002 sugiere que alguna vez corrió en otro puerto o es un typo.

**Acción:** Verificar cuál es el puerto real del backend y corregir el fallback.

- [ ] Confirmar el puerto real del backend Spring Boot
- [ ] Corregir el fallback en `api.js` (probablemente a `8080`)
- [ ] Crear un `.env.example` para el frontend documentando `VITE_API_URL`

---

### SECCIÓN 5 — Bug en useAuth: null vs undefined 🟠 BUG

**Problema:** En `AuthContext.jsx`:

```js
const AuthContext = createContext(null);  // valor por defecto: null
// ...
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {  // ← NUNCA es undefined, siempre es null o el value
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
```

La guarda `=== undefined` nunca se activa porque `createContext(null)` devuelve `null` fuera del provider, no `undefined`. El error de "fuera del provider" nunca se lanza.

**Acción:** Corregir la comparación.

- [ ] Cambiar `if (context === undefined)` por `if (!context)` en `useAuth`
- [ ] Hacer lo mismo en `useTransactions` (mismo patrón, aunque ese sí usa `!context`)

---

### SECCIÓN 6 — alert() en Lógica de Negocio 🟠 UX

**Problema:** En `AuthContext.jsx` línea 94:

```js
alert("¡Cuenta creada y verificada con éxito! Ahora podés iniciar sesión.");
```

`alert()` es bloqueante, detiene el event loop, y rompe la experiencia en mobile. No existe UI de feedback consistente.

**Acción:** Reemplazar con un sistema de notificaciones (toast).

- [ ] Instalar una librería de toasts (ej: `react-hot-toast` o `sonner`)
- [ ] Reemplazar el `alert()` por un toast de éxito
- [ ] Revisar si hay otros `alert()` o `console.error` usados como feedback de usuario

---

### SECCIÓN 7 — Comentarios en Español dentro del Código 🟢 CONVENCIÓN

**Problema:** El código mezcla inglés (identificadores, estructuras) con español (comentarios inline).

Ejemplos en `AppRoutes.jsx`:
```js
// Previene redirecciones en falso mientras React recupera el token del localStorage
// Rutas Públicas (Con protección de retorno)
```

No es un bug funcional, pero es inconsistente. Para un TFI se acepta, pero vale la pena estandarizar.

**Decisión a tomar:** ¿Todos los comentarios en inglés o todos en español?

- [ ] Definir convención (inglés recomendado para proyectos que pueden publicarse)
- [ ] Aplicar de forma consistente en archivos nuevos

---

### SECCIÓN 8 — TransactionContext: stale closure en callbacks 🟠 BUG

**Problema:** En `TransactionContext.jsx`, los `useCallback` que mutan el estado dependen de `transactions` en el closure:

```js
const createTransaction = useCallback(async (data) => {
  // ...
  setTransactions([response.data, ...transactions]); // ← stale closure
}, [transactions]);
```

Si `transactions` cambia entre renders, el callback puede operar sobre un snapshot viejo.

**Acción:** Usar la forma funcional del setter.

- [ ] Cambiar `setTransactions([response.data, ...transactions])` por `setTransactions(prev => [response.data, ...prev])`
- [ ] Aplicar el mismo fix a `updateTransaction` y `deleteTransaction`
- [ ] Remover `transactions` de los deps arrays (ya no son necesarios)

---

### SECCIÓN 9 — Páginas Vacías en Frontend 🟡 INCOMPLETO

Las siguientes páginas existen en el router pero su implementación es mínima o placeholder:

- `CalendarPage.jsx` — Sin integración real con transacciones por fecha
- `GoalsPage.jsx` — Conectar con `SavingGoalController` (que sí existe en backend)
- `GroupsPage.jsx` — Depende de SECCIÓN 2 (backend incompleto)

**Acción:** Priorizar según sprints.

- [ ] Implementar `GoalsPage` (backend listo, solo falta frontend)
- [ ] Implementar `CalendarPage` (puede filtrar transacciones por mes/año)
- [ ] Decidir alcance de `GroupsPage` para el TFI

---

### SECCIÓN 10 — spring.jpa.show-sql=true en application.properties 🟢 PERFORMANCE

**Problema:** Configuración de desarrollo expuesta:

```properties
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
```

En producción esto genera logs verbosos y degrada performance.

**Acción:** Separar configuración por perfil.

- [ ] Crear `application-dev.properties` con `show-sql=true`
- [ ] En `application.properties` base, cambiar a `show-sql=false`

---

## Orden de Prioridad Sugerido

| Prioridad | Sección | Tipo |
|---|---|---|
| 1 | Sección 1 (test controllers) | Seguridad / limpieza |
| 2 | Sección 3 (credenciales) | Seguridad |
| 3 | Sección 5 (null vs undefined) | Bug |
| 4 | Sección 8 (stale closure) | Bug |
| 5 | Sección 4 (puerto API) | Configuración |
| 6 | Sección 6 (alert) | UX |
| 7 | Sección 9 (páginas vacías) | Feature |
| 8 | Sección 2 (Groups backend) | Feature |
| 9 | Sección 10 (show-sql) | Performance |
| 10 | Sección 7 (comentarios) | Convención |

---

## Progreso General

- [x] Sección 1 completada — TestController, TestController2, SimpleController eliminados
- [x] Sección 2 completada — Groups con liquidación, comprobantes y alias MP
- [x] Sección 3 completada — DB credentials ahora usan ${DB_USERNAME} / ${DB_PASSWORD}
- [x] Sección 4 completada — puerto corregido a 8080 en api.js
- [x] Sección 5 completada — useAuth guard corregida a !context
- [x] Sección 6 completada — alert() eliminado, navigate() es suficiente
- [ ] Sección 7 completada — convención de comentarios (cosmético, no bloqueante)
- [x] Sección 8 completada — stale closures corregidas con functional updater
- [x] Sección 9 completada — GoalsPage, CalendarPage y GroupsPage operativas
- [x] Sección 10 completada — show-sql ahora usa ${SHOW_SQL:false}
- [x] BONUS — TransactionsPage: tx.category.name → tx.categoryName
- [x] BONUS — Caritas financieras múltiples (varias emociones a la vez)
- [x] BONUS — Emails HTML estandarizados (AuthEmailService)
- [x] BONUS — Términos y privacidad (`/terminos`, `/privacidad`)
- [x] BONUS — Export PDF de gráficos con resumen por categoría
- [x] BONUS — Limpieza OAuth MP / Checkout Pro (solo alias + comprobante)
- [x] BONUS — Usuario de prueba: `monargent@example.com` / `12345`
