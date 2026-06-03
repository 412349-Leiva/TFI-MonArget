# MonArgent - Guía de Compilación y Ejecución

Esta guía te explica cómo compilar y ejecutar el proyecto **MonArgent** (Backend + Frontend) en tu máquina local.

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Java 21+** → [Descargar JDK](https://www.oracle.com/java/technologies/downloads/#java21)
- **Node.js 18+** → [Descargar Node.js](https://nodejs.org/)
- **MySQL 8.0+** → [Descargar MySQL](https://www.mysql.com/downloads/)
- **Git** (opcional, para clonar el repo)

Verifica las versiones:
```bash
java -version
node -v
npm -v
mysql --version
```

---

## 1. Configuración de la Base de Datos

### Crear la base de datos en MySQL

Abre tu cliente MySQL (MySQL Workbench, CLI, etc.) y ejecuta:

```sql
CREATE DATABASE monargent CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Configurar credenciales en `.env`

En la **raíz del proyecto**, crea un archivo `.env` (si no existe) con:

```bash
# Email Configuration (Gmail SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tu-email@gmail.com
MAIL_PASSWORD=tu-app-specific-password
MAIL_FROM=noreply@monargent.local

# JWT Configuration
JWT_SECRET=monargent-super-secret-key-min-256-bits-for-security-do-not-use-in-prod

# OCR.Space API (Free tier - usa el default)
OCR_API_KEY=helloworld

# Google Gemini API (Opcional - obtén en https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=
```

**Nota sobre Gmail:**
- Si usas Gmail, genera una contraseña de app específica en: https://myaccount.google.com/apppasswords
- NO uses tu contraseña de Gmail directa

---

## 2. Compilar y Ejecutar Backend

### Paso 1: Navega a la carpeta `backend`

```bash
cd backend
```

### Paso 2: Compila el proyecto con Maven

```bash
./mvnw clean compile
```

**En Windows:** Si `./mvnw` no funciona, usa:
```bash
mvnw.cmd clean compile
```

**Esperado:**
```
[INFO] BUILD SUCCESS
```

### Paso 3: Ejecuta el servidor Spring Boot

```bash
./mvnw spring-boot:run
```

O construye el JAR primero:
```bash
./mvnw clean package -DskipTests
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

**Esperado:**
```
Started BackendApplication in X seconds
Tomcat started on port(s): 8080
```

El backend ahora está corriendo en: **http://localhost:8080**

---

## 3. Compilar y Ejecutar Frontend

### Paso 1: Abre OTRA terminal y navega a `frontend`

```bash
cd frontend
```

### Paso 2: Instala dependencias (primera vez)

```bash
npm install
```

### Paso 3: Inicia el servidor de desarrollo Vite

```bash
npm run dev
```

**Esperado:**
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

El frontend ahora está disponible en: **http://localhost:5173**

---

## 4. Usar la Aplicación

1. **Abre en el navegador:** http://localhost:5173/
2. **Registrate:**
   - Email: `tu-email@ejemplo.com`
   - Nombre: `Tu Nombre`
   - Se enviará un código OTP al correo (si configuraste SMTP)
3. **Verifica el código OTP** y establece contraseña
4. **Inicia sesión** con tus credenciales
5. **¡Explora el Dashboard!**

---

## 5. Comandos Útiles

### Backend

```bash
# Compilar
./mvnw clean compile

# Compilar + Ejecutar tests
./mvnw clean test

# Construir JAR
./mvnw clean package

# Ejecutar servidor
./mvnw spring-boot:run

# Ver logs en tiempo real
./mvnw spring-boot:run -Dspring-boot.run.arguments="--debug"
```

### Frontend

```bash
# Instalar dependencias
npm install

# Desarrollo (con hot-reload)
npm run dev

# Compilar para producción
npm run build

# Previsualizar build
npm run preview

# Linter
npm run lint
```

---

## 6. Solucionar Problemas

### ❌ "Connection refused" en Backend

**Problema:** El backend no conecta a MySQL.

**Solución:**
1. Verifica que MySQL está corriendo: `mysql -u root -p`
2. Revisa credenciales en `application.properties` (usuario: `root`, contraseña: `1234` por defecto)
3. Verifica que la BD `monargent` existe

### ❌ "Port 8080 already in use"

**Problema:** Otro proceso usa el puerto 8080.

**Solución:**
```bash
# En Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# En Mac/Linux
lsof -i :8080
kill -9 <PID>
```

### ❌ "Email not sending"

**Problema:** Los emails de OTP no se envían.

**Solución:**
1. Verifica credenciales Gmail en `.env`
2. Asegúrate de tener una contraseña de app (no la contraseña de cuenta)
3. Revisa logs del backend: `mvn spring-boot:run | grep -i mail`

### ❌ "Frontend muestra "Network Error"

**Problema:** Frontend no conecta con Backend.

**Solución:**
1. Verifica que el backend está corriendo en `http://localhost:8080`
2. Revisa la consola del navegador (F12) para ver errores CORS
3. Recarga la página: `Ctrl+Shift+R` (limpiar caché)

---

## 7. Stack Tecnológico

### Backend
- **Java 21** + **Spring Boot 3.3**
- **Spring Security** + **JWT**
- **Hibernate/JPA**
- **MySQL**
- **Integraciones:** OCR.Space (escaneo de tickets), Google Gemini (recomendaciones)

### Frontend
- **React 18** + **Vite**
- **React Router** (navegación)
- **Context API** (state management)
- **Axios** (cliente HTTP)
- **Tailwind CSS** (estilos)
- **Lucide Icons** (iconografía)

---

## 8. Estructura del Proyecto

```
.
├── backend/                          # API REST (Spring Boot)
│   ├── src/main/java/com/monargent/
│   │   ├── controller/              # Endpoints REST
│   │   ├── service/                 # Lógica de negocio
│   │   ├── entity/                  # Modelos de BD
│   │   ├── repository/              # Acceso a datos
│   │   ├── dto/                     # Data Transfer Objects
│   │   ├── config/                  # Configuración
│   │   └── security/                # Auth & JWT
│   ├── pom.xml                      # Dependencias Maven
│   └── mvnw/mvnw.cmd                # Maven Wrapper
│
├── frontend/                        # Aplicación React
│   ├── src/
│   │   ├── pages/                  # Páginas (Dashboard, Transactions, etc)
│   │   ├── components/             # Componentes reutilizables
│   │   ├── context/                # Context API (Auth, Transactions)
│   │   ├── services/               # API client (axios)
│   │   ├── routes/                 # Enrutamiento
│   │   └── styles/                 # Tailwind CSS
│   ├── package.json                # Dependencias npm
│   ├── vite.config.js              # Configuración Vite
│   └── tailwind.config.js           # Configuración Tailwind
│
├── .env                            # Variables de entorno (local)
├── README.md                        # Descripción del proyecto
└── SETUP.md                         # Este archivo
```

---

## 9. Próximos Pasos

Después de compilar y correr, puedes:

- ✅ Crear transacciones
- ✅ Filtrar por mes/año/categoría
- ✅ Ver dashboard con resumen
- ⚠️ **Próximamente:** Metas de ahorro, Notificaciones, Escaneo de tickets, Recomendaciones IA

---

## 10. Contacto & Soporte

Si tienes problemas:

1. Revisa los logs del backend: `backend.log` (si existe)
2. Abre la consola del navegador (F12) para errores frontend
3. Verifica que los puertos 8080 (backend) y 5173 (frontend) estén disponibles

**¡Disfruta usando MonArgent!** 💰

---

**Última actualización:** Mayo 31, 2026
