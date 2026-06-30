const ENGLISH_MESSAGES = {
  'The requested resource was not found': 'No se encontró el recurso solicitado.',
  'Malformed request body or invalid value': 'El cuerpo de la solicitud es inválido o tiene un valor incorrecto.',
  'An unexpected error occurred': 'Ocurrió un error inesperado. Intentá de nuevo.',
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
