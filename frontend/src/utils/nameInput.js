/** Strip digits from person-name values. */
export function withoutDigits(value) {
  return String(value ?? '').replace(/[0-9]/g, '');
}

/** True when value has no digits (empty allowed). */
export function hasNoDigits(value) {
  return !/\d/.test(String(value ?? ''));
}

/** Person-name field keys used across the app. */
export const PERSON_NAME_FIELDS = new Set([
  'name',
  'full_name',
  'father_name',
  'mother_name',
]);

/**
 * onChange helper: blocks digits for known name fields.
 * Usage: onChange={nameFieldChange((key, value) => setField(key, value))}
 * or with event: onChange={nameFieldChange((e) => setForm(...))}
 */
export function sanitizeNameInput(value) {
  return withoutDigits(value);
}
