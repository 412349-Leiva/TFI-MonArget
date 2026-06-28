# Deploy híbrido: Vercel + PC + ngrok + Mercado Pago (producción)

> **Tu frontend en producción:** `https://monargent-taupe.vercel.app`
> (No uses `monargent.vercel.app` — es otra app ajena.)

Arquitectura:

```
Celular / navegador
    → https://monargent-taupe.vercel.app          (React PWA en Vercel)
    → https://blade-jot-uncommon.ngrok-free.dev     (Spring Boot en tu PC vía ngrok)
    → MySQL en localhost:3306               (tu PC)
```

---

## 1. Reservar dominio ngrok para el backend

1. Entrá a [dashboard.ngrok.com/domains](https://dashboard.ngrok.com/domains)
2. El dominio reservado es `blade-jot-uncommon.ngrok-free.dev` (ya en `scripts/ngrok-backend.yml`)

---

## 2. Configurar `backend/.env` (producción)

```env
# Base de datos local
DB_USERNAME=root
DB_PASSWORD=tu_password

JWT_SECRET=tu_secret_largo
MAIL_USERNAME=...
MAIL_PASSWORD=...

# URL publica del frontend en Vercel (sin barra final)
APP_FRONTEND_URL=https://monargent-taupe.vercel.app

# Mercado Pago — credenciales de PRODUCCION (no test)
MERCADOPAGO_CLIENT_ID=tu_client_id_produccion
MERCADOPAGO_CLIENT_SECRET=tu_client_secret_produccion
MERCADOPAGO_REDIRECT_URI=https://blade-jot-uncommon.ngrok-free.dev/api/v1/mercadopago/oauth/callback

# CORS: Vercel + ngrok (ajusta si tu dominio Vercel es custom)
CORS_ALLOWED_ORIGIN_PATTERNS=http://localhost:*,https://*.vercel.app,https://*.ngrok-free.dev,https://*.ngrok-free.app
```

En [Mercado Pago Developers](https://www.mercadopago.com.ar/developers):

- Producto: **Checkout Pro**
- **Redirect URI** = mismo valor que `MERCADOPAGO_REDIRECT_URI`
- Usá credenciales de **producción**

---

## 3. Levantar backend en tu PC

```powershell
.\scripts\start-vercel-pc-stack.ps1
```

Esto inicia:

- Spring Boot en `:8080`
- ngrok apuntando a tu dominio reservado

Verificá: `https://blade-jot-uncommon.ngrok-free.dev/api/v1/health`

**La PC debe estar prendida** mientras alguien use la app.

---

## 4. Deploy del frontend en Vercel

### Opción A — Dashboard

1. [vercel.com](https://vercel.com) → Importar repo de GitHub
2. **Root Directory:** `frontend`
3. **Framework:** Vite
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. **Environment Variables** (Production):

| Variable | Valor |
|----------|--------|
| `VITE_API_URL` | `https://blade-jot-uncommon.ngrok-free.dev/api/v1` |

7. Deploy

### Opción B — CLI

```bash
cd frontend
npm i -g vercel
vercel --prod
# Cuando pregunte, setea VITE_API_URL=https://blade-jot-uncommon.ngrok-free.dev/api/v1
```

---

## 5. Probar pagos reales

1. Abrí tu URL de Vercel en el celular
2. **Agregar a pantalla de inicio** (PWA)
3. Usuario cobrador: **Gastos grupales → Conectar Mercado Pago** (OAuth producción)
4. Creá grupo, gastos, liquidación
5. Otro usuario: **Pagar con Mercado Pago** → Checkout Pro con monto real

---

## Checklist rápido

- [ ] MySQL corriendo en la PC
- [ ] `backend/.env` con URLs de Vercel + ngrok + MP producción
- [ ] Dominio ngrok reservado en `ngrok-backend.yml`
- [ ] `start-vercel-pc-stack.ps1` corriendo
- [ ] `/health` responde por HTTPS en ngrok
- [ ] Vercel con `VITE_API_URL` apuntando al backend ngrok
- [ ] Redirect URI igual en MP Developers y en `.env`

---

## Limitaciones de este modelo

| Tema | Detalle |
|------|---------|
| PC apagada | La app no funciona |
| ngrok free | 1 dominio reservado; si cambia, actualizá Vercel + MP + `.env` |
| Pagos reales | Cada cobrador debe conectar su cuenta MP vía OAuth |
| Escalabilidad | Para producción seria, migrá backend+DB a Railway/Render |

---

## Desarrollo local (sin Vercel)

```powershell
cd backend && mvnw spring-boot:run
cd frontend && npm run dev
```

Usa `http://localhost:5173` y proxy a `:8080` — no requiere ngrok.
