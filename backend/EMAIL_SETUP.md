Instrucciones para configurar envío de emails (Gmail / SendGrid / MailHog)

1) Gmail SMTP (prueba personal)
- Requisitos: cuenta Gmail con 2FA activa y una App Password (Mail).
- Variables de entorno (PowerShell):
  $env:SPRING_MAIL_HOST = "smtp.gmail.com"
  $env:SPRING_MAIL_PORT = "587"
  $env:SPRING_MAIL_USERNAME = "tu.email@gmail.com"
  $env:SPRING_MAIL_PASSWORD = "TU_APP_PASSWORD"
  $env:AUTH_DEV_RETURN_CODE = "false"
- Arrancar backend:
  Set-Location 'C:\Users\tami_\OneDrive\Documents\TFI-MonArget\backend'
  .\mvnw spring-boot:run
- Revisar logs del backend para confirmar envío o errores.

2) SendGrid (recomendado para entornos de prueba/producción)
- Crear API Key en SendGrid y verificar remitente/identidad.
- Variables de entorno:
  $env:SENDGRID_API_KEY = "SG.xxxxx"
  $env:SPRING_MAIL_USERNAME = "no-reply@tu-dominio.com"  # usado como "from" si hace falta
  $env:AUTH_DEV_RETURN_CODE = "false"
- Arrancar backend (igual que arriba). SendGrid se usará si la API key está presente.

3) MailHog (sin enviar correos por Internet, solo local)
- Requiere Docker:
  docker run -d -p 1025:1025 -p 8025:8025 --name mailhog mailhog/mailhog
- Variables de entorno:
  $env:SPRING_MAIL_HOST = "localhost"
  $env:SPRING_MAIL_PORT = "1025"
  $env:AUTH_DEV_RETURN_CODE = "false"
- MailHog UI: http://localhost:8025

Notas y seguridad
- NO introducir contraseñas o API keys en el repositorio. Usar variables de entorno o un gestor de secretos.
- Para desarrollo rápido puedes poner `auth.dev.return-code=true` temporalmente, pero no en un entorno público.
- Si aparecen errores en logs como `AuthenticationFailedException` o `Could not parse mail`, revisá `spring.mail.username` y el formato del remitente.

Si querés, puedo reiniciar el backend aquí después de commitear los cambios y hacer una prueba en modo dev (te devuelvo el código) o guiarte para que lo pruebes con tu cuenta Gmail.
