# MonArgent — Trabajo Final Integrador

**Tecnicatura Universitaria en Programación (UTN FRC)**  
**Integrante:** 412349 — Leiva Tamara Soledad  
**Metodología:** Scrum (7 sprints) · Seguimiento en Jira

---

## Qué es

PWA de finanzas personales: ingresos/gastos, objetivos de ahorro, límites, calendario, escaneo de tickets, recomendaciones con IA y **gastos grupales** (liquidación + alias de Mercado Pago).

Mensajes visibles al usuario: en **español**.

---

## Arranque rápido (local)

| Necesitás | Versión |
|-----------|---------|
| Java | 21+ |
| Node.js | 22.x |
| MySQL | 8+ |

```sql
CREATE DATABASE monargent CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**1. Variables** — copiá `backend/.env.example` → `backend/.env` y completá:

```env
DB_USERNAME=root
DB_PASSWORD=tu_password
JWT_SECRET=clave-secreta-larga-minimo-256-bits
MAIL_USERNAME=tu-email@gmail.com
MAIL_PASSWORD=contraseña-de-app-de-gmail
OCR_API_KEY=helloworld
GEMINI_API_KEY=tu_clave_gemini
```

> Gmail: usá una [contraseña de aplicación](https://myaccount.google.com/apppasswords).

**2. Backend**

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

→ API: http://localhost:8080/api/v1 · Health: http://localhost:8080/api/v1/health

**3. Frontend** (otra terminal)

```powershell
cd frontend
npm install
npm run dev
```

→ App: http://localhost:5173  
En local, Vite hace **proxy** de `/api/v1` al backend (no hace falta ngrok).

### Usuario demo (opcional)

Por defecto **no** se crea solo (`app.seed-test-user=false`).

Para demos, en `backend/.env` o en `application.properties`:

```properties
app.seed-test-user=true
```

| Email | Contraseña |
|-------|------------|
| `monargent@example.com` | `MonArgent1` |

También podés registrarte desde la app (hace falta el mail configurado).

---

## Estructura del repo

```
TFI-MonArget/
├── backend/          # API Spring Boot (Java 21)
├── frontend/         # React + Vite + PWA
├── scripts/          # ngrok, stack Vercel+PC, SQL de ayuda
├── docs/             # Documentación académica / de proceso
├── pom.xml           # Maven multi-módulo (incluye backend)
└── README.md
```

| Carpeta | Para qué |
|---------|----------|
| `backend/` | Código y tests de la API |
| `frontend/` | UI, PWA, deploy a Vercel |
| `scripts/` | Levantar demo celular (`start-vercel-pc-stack.ps1`, ngrok, SQL) |
| `docs/` | Uso de IA, kickoff, notas de diseño |
| `.vscode/` | Config del IDE (se puede versionar) |

### Documentación en `docs/`

| Archivo | Contenido |
|---------|-----------|
| `docs/uso-de-ia.md` | Registro de uso de IA por sprint (evaluación) |
| `docs/PROJECT-KICKOFF-2026.pdf` | Kickoff del proyecto |
| `docs/superpowers/specs/` | Notas de diseño (tips de ayuda) |
| `backend/.env.example` | Variables del backend |
| `frontend/.env.example` | `VITE_API_URL` |
| `frontend/.env.production.example` | Plantilla Vercel |

---

## Stack

| Capa | Tecnología |
|------|------------|
| Backend | Java 21, Spring Boot 3.5, Security + JWT, JPA/Hibernate |
| Frontend | React 18, Vite, Tailwind, React Router, Axios, PWA |
| Base de datos | MySQL 8 |
| IA / OCR | Google Gemini, OCR.Space |

```
Controller → Service → Repository → Entity
                ↕
             Mapper ↔ DTO
```

**Módulos:** Auth, Categorías, Transacciones, Perfil, Gastos fijos, Límites, Objetivos, Notificaciones, Importación/OCR, Recomendaciones, Grupos, Calendario, Salud financiera.

---

## Comandos útiles

```powershell
# Backend
cd backend
.\mvnw.cmd clean test
.\mvnw.cmd spring-boot:run

# Frontend
cd frontend
npm run dev
npm run build
npm run lint
```

---

## Demo en celular: Vercel + PC + ngrok

```
Celular → https://frontend-beta-ten-40.vercel.app  (PWA en Vercel)
       → https://TU-DOMINIO.ngrok-free.dev/api/v1  (API en tu PC)
       → MySQL en localhost
```

ngrok expone **solo el backend**. La app se abre desde Vercel.

1. Dominio en [ngrok domains](https://dashboard.ngrok.com/domains) → `scripts/ngrok-backend.yml`
2. En `backend/.env`: `APP_FRONTEND_URL=https://frontend-beta-ten-40.vercel.app` (+ CORS / keys)
3. En Vercel (Root Directory = `frontend`): `VITE_API_URL=https://TU-DOMINIO.ngrok-free.dev/api/v1`
4. En la PC:

```powershell
.\scripts\start-vercel-pc-stack.ps1
```

Verificar: `https://TU-DOMINIO.ngrok-free.dev/api/v1/health`  
**La PC tiene que estar encendida** durante la demo.

### Checklist rápido

- [ ] MySQL activo  
- [ ] `backend/.env` completo + `APP_FRONTEND_URL`  
- [ ] ngrok en `scripts/ngrok-backend.yml`  
- [ ] Script de stack corriendo  
- [ ] `/health` OK por HTTPS  
- [ ] Vercel con `VITE_API_URL` al ngrok  

Si la PWA muestra versión vieja: borrar ícono, limpiar caché del sitio y reinstalar.

### Pagos en grupos

No hay OAuth ni Checkout Pro de Mercado Pago: se copia el **alias**, se paga afuera, se sube comprobante y el cobrador confirma.

---

## Funcionalidades

- Auth (registro, verificación, recuperar contraseña)
- Dashboard (resumen, gráficos, PDF)
- Ingresos / gastos (filtros; más reciente arriba)
- Categorías, objetivos, límites, calendario
- Escaneo de tickets e importación
- Recomendaciones (Gemini)
- Gastos grupales (liquidación, alias MP, comprobantes)
- Notificaciones, PWA, `/terminos` y `/privacidad`

---

## Problemas frecuentes

**MySQL:** servicio activo, `DB_*` en `.env`, base `monargent` creada.

**Puerto 8080 ocupado:**

```powershell
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

**OTP no llega:** contraseña de aplicación Gmail; si falla el mail, el código sale en la consola del backend (solo local).

**Error de red en el front:** health del backend OK + `Ctrl+Shift+R`.

---

## Qué se puede borrar (no es código)

| Qué | Motivo |
|-----|--------|
| `backend/target/` | Build Maven (`mvn clean`) |
| `frontend/dist/`, `frontend/dev-dist/`, `frontend/.vite/` | Build / caché Vite |
| `backend/uploads/` | Comprobantes subidos en pruebas |
| `node_modules/` | Se regenera con `npm install` |

**No borrar:** código en `backend/` / `frontend/`, logos en `frontend/public/`, `.env` local, `docs/uso-de-ia.md`.

**Ya limpio del repo (no versionar):** `.idea/`, `.atl/`, backups de logos, `Utils/` (el PDF quedó en `docs/`).

---

## Licencia

Uso académico y demostración — TFI UTN FRC.

**Última actualización:** julio 2026
