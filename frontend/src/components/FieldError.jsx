export function FieldError({ message }) {
  if (!message) return null;
  return <span className="field-error" role="alert">{message}</span>;
}

export function clearFieldError(errors, key) {
  if (!errors?.[key]) return errors || {};
  const next = { ...errors };
  delete next[key];
  return next;
}

export function requiredError(value, label = 'This field') {
  if (value === undefined || value === null || String(value).trim() === '') {
    return `${label} is required.`;
  }
  return '';
}

export function emailError(value) {
  if (!value) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email.';
  return '';
}

export function firstError(errors) {
  return Object.values(errors || {}).find(Boolean) || '';
}
