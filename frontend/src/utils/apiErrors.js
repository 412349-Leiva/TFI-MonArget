const ENGLISH_MESSAGES = {
  'The requested resource was not found': 'No se encontró el recurso solicitado.',
  'Malformed request body or invalid value': 'El cuerpo de la solicitud es inválido o tiene un valor incorrecto.',
  'An unexpected error occurred': 'Ocurrió un error inesperado. Intentá de nuevo.',
  'Invalid or expired JWT token': 'Token de sesión inválido o vencido.',
  'Unauthorized': 'No autorizado.',
  'Invalid email or password': 'Correo o contraseña incorrectos.',
  'Email is already registered': 'El correo ya está registrado.',
  'Invalid verification code': 'Código de verificación inválido.',
  'Verification code expired': 'El código de verificación venció.',
  'Passwords do not match': 'Las contraseñas no coinciden.',
  'No account found for this email': 'No hay una cuenta asociada a este correo.',
  'Transaction not found': 'Movimiento no encontrado.',
  'Category not found': 'Categoría no encontrada.',
  'Notification not found': 'Notificación no encontrada.',
};

export function getErrorMessage(error, fallback = 'Ocurrió un error. Intentá de nuevo.') {
  const message = error?.response?.data?.message;
  if (message) {
    return ENGLISH_MESSAGES[message] || message;
  }
  const status = error?.response?.status;
  if (status === 404) {
    return 'No se encontró el recurso solicitado.';
  }
  if (status === 401) {
    return 'Tu sesión expiró. Volvé a iniciar sesión.';
  }
  if (status === 403) {
    return 'No tenés permiso para realizar esta acción.';
  }
  if (status >= 500) {
    return 'El servidor no está disponible. Intentá más tarde.';
  }
  return fallback;
}
