export const FINANCES_CHANGED = 'finances:changed';

export function notifyFinancesChanged() {
  window.dispatchEvent(new CustomEvent(FINANCES_CHANGED));
}

export function onFinancesChanged(handler) {
  window.addEventListener(FINANCES_CHANGED, handler);
  return () => window.removeEventListener(FINANCES_CHANGED, handler);
}
