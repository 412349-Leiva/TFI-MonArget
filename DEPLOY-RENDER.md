# Deploy: Vercel (frontend) + Render (backend) + MySQL externo

> **Frontend en producción:** `https://frontend-beta-ten-40.vercel.app`  
> **Backend en Render (ejemplo):** `https://monargent-backend.onrender.com`  
> La URL real la asigna Render al crear el Web Service (sin dominio custom en free tier).

Arquitectura:

```
Celular / navegador
    → https://frontend-beta-ten-40.vercel.app          (React PWA en Vercel)
    → API: https://TU-SERVICIO.onrender.com/api/v1       (Spring Boot en Render)
    → MySQL en la nube (Aiven, PlanetScale u otro proveedor)
```

Render **no hospeda MySQL**. Necesitás una base MySQL externa (ver sección 2).

---

## 1. Crear cuenta en Render (free tier)

1. Entrá a [render.com](https://render.com)
2. **Get Started** → **Sign up with GitHub**
3. Autorizá el acceso al repo `TFI-MonArget`
4. Plan **Free** para Web Services (suficiente para pruebas / TFI)

> **Cold start (free tier):** si nadie usa la API ~15 min, Render apaga el servicio. La primera petición puede tardar **30–90 s** en responder. Para demo en vivo, hacé un ping a `/api/v1/health` unos minutos antes.

---

## 2. MySQL en la nube (opciones)

| Proveedor | Notas |
|-----------|--------|
| **Aiven** | [aiven.io](https://aiven.io) — MySQL con tier gratuito limitado; buena opción para empezar |
| **PlanetScale** | MySQL serverless; revisá planes actuales en [planetscale.com](https://planetscale.com) |
| **Railway / otros** | Cualquier MySQL gestionado con host público y puerto 3306 |

**Render Postgres:** Render ofrece Postgres gratis, pero MonArgent usa **MySQL** (`MySQLDialect`). No uses Postgres sin migrar el esquema.

### Cadena JDBC de ejemplo

```text
jdbc:mysql://HOST:3306/monargent?useSSL=true&serverTimezone=UTC&allowPublicKeyRetrieval=true
```

Creá la base `monargent` en el panel del proveedor y anotá host, usuario y contraseña.

---

## 3. Desplegar el backend en Render

### Opción A — Blueprint (`render.yaml` en la raíz del repo)

1. Render Dashboard → **Blueprints** → **New Blueprint Instance**
2. Conectá el repo `TFI-MonArget`
3. Render detecta `render.yaml` y crea el Web Service `monargent-backend`
4. Completá las variables marcadas como secretas en el asistente
5. **Apply**

### Opción B — Web Service manual (recomendado la primera vez)

1. Dashboard → **New +** → **Web Service**
2. Conectá el repo de GitHub `TFI-MonArget`
3. Configuración:

| Campo | Valor |
|-------|--------|
| **Name** | `monargent-backend` (o el que prefieras) |
| **Region** | Oregon (o el más cercano) |
| **Branch** | `main` |
| **Root Directory** | *(vacío — raíz del repo)* |
| **Runtime** | **Docker** |
| **Dockerfile Path** | `backend/Dockerfile` |
| **Instance Type** | **Free** |

> **¿Por qué no `backend` como Root Directory?** El módulo Maven depende del `pom.xml` padre en la raíz del monorepo. El `Dockerfile` copia ambos; el contexto de build debe ser la **raíz del repositorio**.

4. **Environment Variables** — ver checklist en la sección 5
5. **Advanced → Health Check Path:** `/api/v1/health`
6. **Create Web Service**

Al terminar el build, la URL será algo como:

```text
https://monargent-backend.onrender.com
```

Verificá: `https://TU-SERVICIO.onrender.com/api/v1/health` → debe responder `OK`.

### Build local (opcional)

Desde la raíz del repo:

```bash
docker build -f backend/Dockerfile -t monargent-backend .
docker run --rm -p 8080:8080 \
  -e SPRING_DATASOURCE_URL="jdbc:mysql://host.docker.internal:3306/monargent?..." \
  -e DB_USERNAME=root -e DB_PASSWORD=... -e JWT_SECRET=test \
  monargent-backend
```

---

## 4. Actualizar Vercel (frontend)

### Variable de entorno

En [vercel.com](https://vercel.com) → proyecto frontend → **Settings → Environment Variables**:

| Variable | Valor |
|----------|--------|
| `VITE_API_URL` | `https://TU-SERVICIO.onrender.com/api/v1` |

Redeploy del frontend después de cambiar la variable.

### Rewrite OAuth Mercado Pago

En `frontend/vercel.json`, actualizá el destino del callback para que Vercel reenvíe al backend en Render (ya no ngrok):

```json
{
  "source": "/api/v1/mercadopago/oauth/callback",
  "destination": "https://TU-SERVICIO.onrender.com/api/v1/mercadopago/oauth/callback"
}
```

**Mercado Pago Developers** — la URL de redirección sigue siendo la del **frontend en Vercel** (estable), no la de Render:

```text
https://frontend-beta-ten-40.vercel.app/api/v1/mercadopago/oauth/callback
```

| Dónde | URL |
|-------|-----|
| **MP → Redirect URI** | `https://frontend-beta-ten-40.vercel.app/api/v1/mercadopago/oauth/callback` |
| **Render → MERCADOPAGO_REDIRECT_URI** | La misma de arriba |
| **Render → APP_FRONTEND_URL** | `https://frontend-beta-ten-40.vercel.app` |
| **Vercel → VITE_API_URL** | `https://TU-SERVICIO.onrender.com/api/v1` |
| **vercel.json → destination** | `https://TU-SERVICIO.onrender.com/api/v1/mercadopago/oauth/callback` |

---

## 5. Variables de entorno en Render

Configuralas en **Web Service → Environment**. No subas `backend/.env` al repo.

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `SPRING_DATASOURCE_URL` | Sí | JDBC MySQL completo (host en la nube) |
| `DB_USERNAME` | Sí | Usuario MySQL |
| `DB_PASSWORD` | Sí | Contraseña MySQL |
| `JWT_SECRET` | Sí | Secreto largo para tokens |
| `MAIL_USERNAME` | Sí* | Gmail u otro SMTP |
| `MAIL_PASSWORD` | Sí* | App password de Gmail |
| `APP_FRONTEND_URL` | Sí | `https://frontend-beta-ten-40.vercel.app` |
| `MERCADOPAGO_REDIRECT_URI` | Sí | URL Vercel del callback (tabla arriba) |
| `MERCADOPAGO_CLIENT_ID` | Sí** | Credenciales producción MP |
| `MERCADOPAGO_CLIENT_SECRET` | Sí** | Credenciales producción MP |
| `MERCADOPAGO_ACCESS_TOKEN` | No | Fallback si el cobrador no conectó OAuth |
| `CORS_ALLOWED_ORIGIN_PATTERNS` | Sí | `http://localhost:*,http://127.0.0.1:*,https://*.vercel.app` |
| `OCR_API_KEY` | No | OCR.Space (default `helloworld` en dev) |
| `GEMINI_API_KEY` | No | Google Gemini para recomendaciones |
| `GEMINI_MODEL` | No | Default `gemini-2.0-flash` |

\* Necesarias si usás registro por email / recuperación de contraseña.  
\** Necesarias para pagos grupales con Mercado Pago.

`PORT` lo inyecta Render automáticamente; la app usa `server.port=${PORT:8080}`.

---

## 6. CORS y URLs de la app

- **CORS:** el navegador envía `Origin: https://frontend-beta-ten-40.vercel.app`. Incluí `https://*.vercel.app` en `CORS_ALLOWED_ORIGIN_PATTERNS`.
- **APP_FRONTEND_URL:** usada para redirecciones post-OAuth y enlaces en emails; debe coincidir con la URL real de Vercel.
- No hace falta agregar `*.onrender.com` a CORS: Render es el **servidor API**, no el origen del navegador.

---

## 7. Checklist rápido

- [ ] MySQL en la nube creado y accesible desde internet
- [ ] Web Service en Render en **Free**, Docker, health check `/api/v1/health`
- [ ] Todas las env vars de la sección 5 cargadas en Render
- [ ] `/api/v1/health` responde por HTTPS
- [ ] `VITE_API_URL` en Vercel apunta a Render
- [ ] `vercel.json` rewrite del callback OAuth actualizado
- [ ] Redirect URI en Mercado Pago = URL Vercel (no Render)
- [ ] Redeploy de Vercel después de los cambios

---

## 8. Limitaciones (free tier Render)

| Tema | Detalle |
|------|---------|
| Cold start | ~30–90 s tras inactividad; plan Free no evita spin-down |
| MySQL | No incluido en Render; proveedor externo obligatorio |
| Builds | Más lentos que en local; el Dockerfile hace `mvn package` en cada deploy |
| HTTPS | Render provee certificado en `*.onrender.com` sin configuración extra |
| Dominio custom | Opcional en planes de pago; no requerido para el TFI |

---

## Desarrollo local

Sin cambios — ver [DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md#desarrollo-local-sin-vercel) o:

```powershell
cd backend && .\mvnw.cmd spring-boot:run
cd frontend && npm run dev
```

Modelo híbrido PC + ngrok: sigue en [DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md).
