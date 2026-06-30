# Deploy híbrido: Vercel + PC + ngrok

> **Frontend en producción:** `https://frontend-beta-ten-40.vercel.app`  
> (No uses `monargent-taupe.vercel.app` — da 404.)

Arquitectura:

```
Celular / navegador
    → https://frontend-beta-ten-40.vercel.app   (React PWA en Vercel)
    → API: https://blade-jot-uncommon.ngrok-free.dev/api/v1   (Spring Boot en tu PC)
    → MySQL en localhost:3306                 (tu PC)
```

**No uses** la URL de ngrok como si fuera la app. ngrok solo expone el backend (`/api/v1/...`).

---

## 1. Dominio ngrok para el backend

1. Entrá a [dashboard.ngrok.com/domains](https://dashboard.ngrok.com/domains)
2. El dominio reservado es `blade-jot-uncommon.ngrok-free.dev` (en `scripts/ngrok-backend.yml`)

---

## 2. Configurar `backend/.env` (producción)

```env
DB_USERNAME=root
DB_PASSWORD=tu_password

JWT_SECRET=tu_secret_largo
MAIL_USERNAME=tu_email@gmail.com
MAIL_PASSWORD=tu_app_password_gmail

# URL pública del frontend en Vercel (sin barra final)
APP_FRONTEND_URL=https://frontend-beta-ten-40.vercel.app

# CORS: Vercel + ngrok
CORS_ALLOWED_ORIGIN_PATTERNS=http://localhost:*,http://127.0.0.1:*,https://*.vercel.app,https://*.ngrok-free.dev,https://*.ngrok-free.app

# Opcional — IA y OCR
GEMINI_API_KEY=...
OCR_API_KEY=...
```

| Dónde | Qué URL |
|-------|---------|
| **backend/.env → APP_FRONTEND_URL** | `https://frontend-beta-ten-40.vercel.app` |
| **Vercel → VITE_API_URL** | `https://blade-jot-uncommon.ngrok-free.dev/api/v1` |

### Pagos grupales (sin OAuth)

MonArgent **no integra OAuth ni Checkout Pro**. Los pagos entre integrantes usan:

1. **Alias de Mercado Pago** del cobrador (configurado en Gastos grupales)
2. Botón **Pagar** → copia alias y abre la app/web de Mercado Pago
3. El deudor sube **comprobante** en la app
4. El acreedor **confirma** el pago recibido

No hace falta configurar nada en Mercado Pago Developers para este flujo.

---

## 3. Levantar backend en tu PC

```powershell
.\scripts\start-vercel-pc-stack.ps1
```

Esto inicia Spring Boot en `:8080` y ngrok con tu dominio reservado.

Verificá: `https://blade-jot-uncommon.ngrok-free.dev/api/v1/health`

**La PC debe estar prendida** mientras alguien use la app.

---

## 4. Deploy del frontend en Vercel

### Dashboard (recomendado)

1. [vercel.com](https://vercel.com) → importar repo `TFI-MonArget`
2. **Root Directory:** `frontend`
3. **Environment Variables:**

| Variable | Valor |
|----------|--------|
| `VITE_API_URL` | `https://blade-jot-uncommon.ngrok-free.dev/api/v1` |

4. **Promote to Production** en el último deploy exitoso
5. **Settings → Deployment Protection** → desactivar login en Production (si el celular ve "Login - Vercel")

### Si ves la app vieja en el celular

1. Borrá el ícono PWA de la pantalla de inicio
2. Volvé a agregar desde `https://frontend-beta-ten-40.vercel.app`
3. Borrá caché del sitio en el navegador

### CLI

```bash
cd frontend
vercel --prod
```

---

## 5. Probar la app

1. Abrí la URL de Vercel en el celular
2. Login de prueba: `monargent@example.com` / `12345` (si existe en tu DB)
3. Grupos: configurá tu alias MP → liquidación → pagar → subir comprobante → confirmar

---

## Checklist rápido

- [ ] MySQL corriendo en la PC
- [ ] `backend/.env` con `APP_FRONTEND_URL` y credenciales SMTP
- [ ] Dominio ngrok en `ngrok-backend.yml`
- [ ] `start-vercel-pc-stack.ps1` corriendo
- [ ] `/health` responde por HTTPS en ngrok
- [ ] Vercel con `VITE_API_URL` apuntando al backend ngrok

---

## Limitaciones

| Tema | Detalle |
|------|---------|
| PC apagada | La app no funciona |
| ngrok free | Si cambia el dominio, actualizá `VITE_API_URL` en Vercel |
| Escalabilidad | Para el TFI alcanza el modelo Vercel + PC + ngrok |

---

## Desarrollo local (sin Vercel)

```powershell
cd backend && .\mvnw.cmd spring-boot:run
cd frontend && npm run dev
```

Usa `http://localhost:5173` con proxy a `:8080` — no requiere ngrok.
