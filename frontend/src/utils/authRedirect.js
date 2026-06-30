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

const PENDING_GROUP_PAY_KEY = 'ma_pending_group_pay';

export function savePendingGroupPayment({ groupId, fromMemberKey, toMemberKey }) {
  sessionStorage.setItem(
    PENDING_GROUP_PAY_KEY,
    JSON.stringify({ groupId, fromMemberKey, toMemberKey, ts: Date.now() }),
  );
}

export function consumePendingGroupPayment(groupId) {
  const raw = sessionStorage.getItem(PENDING_GROUP_PAY_KEY);
  if (!raw) return null;

  try {
    const data = JSON.parse(raw);
    if (Number(data.groupId) !== Number(groupId)) return null;
    if (Date.now() - (data.ts || 0) > 30 * 60 * 1000) {
      sessionStorage.removeItem(PENDING_GROUP_PAY_KEY);
      return null;
    }
    sessionStorage.removeItem(PENDING_GROUP_PAY_KEY);
    return data;
  } catch {
    sessionStorage.removeItem(PENDING_GROUP_PAY_KEY);
    return null;
  }
}

export function clearPendingGroupPayment() {
  sessionStorage.removeItem(PENDING_GROUP_PAY_KEY);
}

export function hasValidSession() {
  return Boolean(localStorage.getItem('jwt_token'));
}
