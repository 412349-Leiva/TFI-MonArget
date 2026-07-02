# MonArgent — Trabajo Final Integrador

**Propuesta de software** para la Tecnicatura Universitaria en Programación (UTN FRC).

**Integrante:** 412349 — Leiva Tamara Soledad  
**Metodología:** Scrum (7 sprints) · **Seguimiento:** Jira

---

## Descripción

MonArgent es una aplicación web progresiva (PWA) de finanzas personales que permite registrar ingresos y gastos, definir metas de ahorro, controlar límites de gasto, escanear tickets con OCR, recibir recomendaciones con IA y gestionar **gastos grupales** con liquidación, comprobantes y pagos por alias de Mercado Pago.

Todos los mensajes de error y respuestas visibles para el usuario están en **español**.

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | Java 21, Spring Boot 3.5, Spring Security, JWT, JPA/Hibernate |
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios, PWA |
| Base de datos | MySQL 8 |
| IA / OCR | Google Gemini API, OCR.Space |
| Build | Maven (backend), npm (frontend) |

### Arquitectura backend

```
Controller → Service (interface + impl) → Repository → Entity
                    ↕
                  Mapper ↔ DTO (Request / Response)
```

**Módulos:** Auth, Categorías, Transacciones, Perfil financiero, Gastos fijos, Límites de gasto, Metas de ahorro, Notificaciones, Importación/OCR, Recomendaciones, Grupos, Calendario, Perfil de humor financiero.

---

## Estructura del proyecto

```
TFI-MonArget/
├── backend/                 # API REST (Spring Boot)
│   ├── src/main/java/...    # controllers, services, entities, dto, security
│   ├── src/main/resources/  # application.properties, ValidationMessages.properties
│   ├── .env.example         # Plantilla de variables (copiar a .env)
│   └── mvnw / mvnw.cmd
├── frontend/                # React + Vite
│   ├── src/                 # pages, components, context, services, utils
│   ├── public/              # íconos PWA, favicon, logos
│   ├── .env.example         # Plantilla VITE_API_URL
│   └── package.json
├── scripts/                 # ngrok, stack Vercel+PC, utilidades SQL
├── .vscode/                 # Configuración IDE (Java, ESLint, Tailwind)
└── README.md                # Este archivo
```

---

## Requisitos previos

- **Java 21+**
- **Node.js 22.x** (ver `frontend/package.json`)
- **MySQL 8.0+**
- **Git** (opcional)

Verificar:

```bash
java -version
node -v
npm -v
mysql --version
```

---

## Instalación y ejecución local

### 1. Base de datos

```sql
CREATE DATABASE monargent CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Variables de entorno

**Raíz del repo** — crear `.env` (Spring Boot lo importa automáticamente):

```env
DB_USERNAME=root
DB_PASSWORD=tu_password

JWT_SECRET=clave-secreta-larga-minimo-256-bits

MAIL_USERNAME=tu-email@gmail.com
MAIL_PASSWORD=contraseña-de-app-de-gmail

OCR_API_KEY=helloworld
GEMINI_API_KEY=tu_clave_gemini
```

También podés copiar `backend/.env.example` → `backend/.env` y completar los valores.

**Gmail:** usar [contraseña de aplicación](https://myaccount.google.com/apppasswords), no la contraseña de la cuenta.

### 3. Backend

```powershell
cd backend
.\mvnw.cmd clean compile
.\mvnw.cmd spring-boot:run
```

API disponible en: **http://localhost:8080/api/v1**  
Health check: **http://localhost:8080/api/v1/health**

### 4. Frontend

En otra terminal:

```powershell
cd frontend
npm install
npm run dev
```

App en: **http://localhost:5173**

En desarrollo, Vite hace **proxy** de `/api/v1` al backend en `:8080` (no hace falta ngrok).

### 5. Usuario de prueba

Si la base está vacía, al iniciar el backend se crea automáticamente:

| Campo | Valor |
|-------|-------|
| Email | `monargent@example.com` |
| Contraseña | `12345` |

---

## Comandos útiles

### Backend

```powershell
cd backend
.\mvnw.cmd clean test          # Compilar y ejecutar tests
.\mvnw.cmd clean package       # Generar JAR
.\mvnw.cmd spring-boot:run     # Servidor en desarrollo
```

### Frontend

```powershell
cd frontend
npm run dev                    # Desarrollo con hot-reload
npm run build                  # Build de producción
npm run lint                   # ESLint (0 warnings)
npm run preview                # Previsualizar build
npm run pwa:mobile             # Demo PWA con ngrok (script)
```

---

## Deploy: Vercel (frontend) + PC (backend) + ngrok

Arquitectura híbrida para demo del TFI:

```
Celular / navegador
  → https://frontend-beta-ten-40.vercel.app   (React PWA en Vercel)
  → API: https://TU-DOMINIO.ngrok-free.dev/api/v1   (Spring Boot en tu PC)
  → MySQL en localhost:3306
```

> **Importante:** ngrok expone solo el **backend** (`/api/v1/...`). La app se abre siempre desde la URL de Vercel.

### 1. Dominio ngrok

1. Crear/reservar dominio en [dashboard.ngrok.com/domains](https://dashboard.ngrok.com/domains)
2. Configurarlo en `scripts/ngrok-backend.yml`

### 2. Backend (`backend/.env`)

```env
DB_USERNAME=root
DB_PASSWORD=tu_password
JWT_SECRET=tu_secret_largo
MAIL_USERNAME=tu_email@gmail.com
MAIL_PASSWORD=tu_app_password_gmail

APP_FRONTEND_URL=https://frontend-beta-ten-40.vercel.app

CORS_ALLOWED_ORIGIN_PATTERNS=http://localhost:*,http://127.0.0.1:*,https://*.vercel.app,https://*.ngrok-free.dev,https://*.ngrok-free.app

GEMINI_API_KEY=...
OCR_API_KEY=...
```

| Dónde | URL |
|-------|-----|
| `backend/.env` → `APP_FRONTEND_URL` | URL pública del frontend en Vercel |
| Vercel → `VITE_API_URL` | `https://TU-DOMINIO.ngrok-free.dev/api/v1` |

### 3. Levantar stack en la PC

```powershell
.\scripts\start-vercel-pc-stack.ps1
```

Verificar: `https://TU-DOMINIO.ngrok-free.dev/api/v1/health`

**La PC debe estar encendida** mientras alguien use la app.

### 4. Frontend en Vercel

1. Importar el repo en [vercel.com](https://vercel.com)
2. **Root Directory:** `frontend`
3. Variable de entorno:

| Variable | Valor |
|----------|--------|
| `VITE_API_URL` | `https://TU-DOMINIO.ngrok-free.dev/api/v1` |

4. Promover el deploy a Production
5. En **Settings → Deployment Protection**, desactivar login en Production si el celular muestra pantalla de Vercel

**Si la PWA muestra versión vieja:** borrar el ícono de inicio, limpiar caché del sitio y volver a instalar desde la URL de Vercel.

### Pagos grupales (sin OAuth de Mercado Pago)

MonArgent **no usa Checkout Pro ni OAuth**. El flujo es:

1. El cobrador configura su **alias de Mercado Pago** en Gastos grupales
2. El deudor toca **Pagar** → se copia el alias y se abre Mercado Pago
3. El deudor sube el **comprobante** en la app
4. El acreedor **confirma** el pago recibido

### Checklist de deploy

- [ ] MySQL corriendo en la PC
- [ ] `backend/.env` con credenciales y `APP_FRONTEND_URL`
- [ ] Dominio ngrok en `scripts/ngrok-backend.yml`
- [ ] `start-vercel-pc-stack.ps1` en ejecución
- [ ] `/health` responde por HTTPS vía ngrok
- [ ] Vercel con `VITE_API_URL` apuntando al backend ngrok

### Limitaciones del modelo híbrido

| Tema | Detalle |
|------|---------|
| PC apagada | La app no funciona |
| ngrok free | Si cambia el dominio, actualizar `VITE_API_URL` en Vercel |
| Escalabilidad | Adecuado para entrega y demo del TFI |

---

## Funcionalidades principales

- Registro, verificación por email y recuperación de contraseña
- Dashboard con resumen mensual, gráficos y exportación PDF
- Transacciones (ingresos/gastos) con filtros por mes, categoría y tipo
- Categorías personalizables
- Metas de ahorro con depósitos
- Límites de gasto con alertas
- Calendario financiero
- Escaneo de tickets (OCR) e importación desde Excel
- Recomendaciones con IA (Gemini)
- Gastos grupales: invitaciones, liquidación, alias MP, comprobantes
- Notificaciones in-app
- PWA instalable en móvil
- Términos y privacidad (`/terminos`, `/privacidad`)

---

## Solución de problemas

### Backend no conecta a MySQL

1. Verificar que MySQL está activo
2. Revisar `DB_USERNAME` / `DB_PASSWORD` en `.env`
3. Confirmar que existe la base `monargent`

### Puerto 8080 en uso (Windows)

```powershell
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Emails OTP no llegan

1. Revisar credenciales SMTP en `.env`
2. Usar contraseña de aplicación de Gmail
3. Si falla el envío, en desarrollo el código puede imprimirse en la consola del backend

### Frontend: error de red

1. Confirmar backend en `http://localhost:8080/api/v1/health`
2. Revisar consola del navegador (F12)
3. Recargar con caché limpio: `Ctrl+Shift+R`

---

## Archivos que se pueden eliminar sin afectar la app

Estos son **artefactos de build** o datos de prueba; se regeneran o no son código fuente:

| Carpeta / archivo | Motivo |
|-------------------|--------|
| `backend/target/` | Salida de Maven (`mvn clean`) |
| `frontend/dist/`, `frontend/dev-dist/`, `frontend/.vite/` | Build y caché de Vite |
| `backend/uploads/settlement-proofs/*.pdf` | Comprobantes de prueba (si no los necesitás para la demo) |

**No eliminar:** `frontend/public/*.png` (cada ícono cumple un rol distinto: favicon, PWA 192/512, Apple touch, logo, wordmark), `.env`, `node_modules` del frontend, ni el código fuente.

---

## Documentación de referencia

| Archivo | Contenido |
|---------|-----------|
| `backend/.env.example` | Variables del backend |
| `frontend/.env.example` | Variable `VITE_API_URL` |
| `frontend/.env.production.example` | Plantilla para Vercel |

---

## Licencia y uso académico

Proyecto desarrollado como Trabajo Final Integrador (TFI) — UTN FRC.  
Uso académico y demostración.

**Última actualización:** Julio 2026
