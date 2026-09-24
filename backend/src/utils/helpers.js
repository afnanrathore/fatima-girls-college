import { Content } from '../models/Content.js';

export async function admissionsAreOpen() {
  const row = await Content.findOne({ type: 'admission_status', is_active: true }).lean();
  return !row || String(row.content || '').toLowerCase() === 'open';
}

export function uploadPath(file) {
  if (!file) return undefined;
  const parts = file.path.split(/[/\\]/);
  const idx = parts.lastIndexOf('uploads');
  if (idx >= 0) return parts.slice(idx + 1).join('/');
  return `${file.destination?.split(/[/\\]/).pop()}/${file.filename}`;
}

/** Person names: letters, spaces, and common punctuation — no digits. */
export const nameRe = /^[\p{L}\s.'-]+$/u;

export function hasNoDigits(value) {
  return !/\d/.test(String(value ?? ''));
}

export function assertPersonName(value, label = 'Name') {
  const v = String(value ?? '').trim();
  if (!v) return `${label} is required.`;
  if (!hasNoDigits(v) || !nameRe.test(v)) return `${label} may not contain digits.`;
  return null;
}
