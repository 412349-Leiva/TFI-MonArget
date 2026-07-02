const RETURN_TO_KEY = 'auth_return_to';

export function saveAuthReturn(path = window.location.pathname + window.location.search) {
  if (path && path !== '/login') {
    sessionStorage.setItem(RETURN_TO_KEY, path);
  }
}

export function consumeAuthReturn(fallback = '/dashboard') {
  const path = sessionStorage.getItem(RETURN_TO_KEY);
  sessionStorage.removeItem(RETURN_TO_KEY);
  return path && path !== '/login' ? path : fallback;
}

export function hasValidSession() {
  return Boolean(localStorage.getItem('jwt_token'));
}
