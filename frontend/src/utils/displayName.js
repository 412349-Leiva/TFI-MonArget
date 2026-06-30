/** Evita nombres duplicados tipo "Tami Leiva Tami Leiva" */
export function normalizeDisplayName(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return '';

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2 && parts.length % 2 === 0) {
    const half = parts.length / 2;
    const first = parts.slice(0, half).join(' ');
    const second = parts.slice(half).join(' ');
    if (first.toLowerCase() === second.toLowerCase()) return first;
  }

  return trimmed;
}

/** Primer nombre o sugerencia desde el email */
export function getSuggestedName(user) {
  const normalized = normalizeDisplayName(user?.name);
  if (normalized) {
    return normalized.split(/\s+/)[0];
  }
  const fromEmail = user?.email?.split('@')[0];
  if (fromEmail) {
    return fromEmail.replace(/[._-]/g, ' ').split(/\s+/)[0];
  }
  return 'Usuario';
}
