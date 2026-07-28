/** Shared helpers for clinic intake registration fields. */

export const INTAKE_FIELD_TYPES = [
  { value: 'text', label: 'Short text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'number', label: 'Number' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'radio', label: 'Radio' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'multiselect', label: 'Multi-select' },
  { value: 'yesno', label: 'Yes / No' },
  { value: 'rating', label: 'Rating' },
  { value: 'file', label: 'File upload' },
  { value: 'signature', label: 'Signature' },
];

export function parseJson(value, fallback = null) {
  if (value == null || value === '') return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function parseOptions(raw) {
  if (Array.isArray(raw)) return raw.map(String);
  if (raw == null || raw === '') return [];
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
      const parsed = parseJson(trimmed, []);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    }
    return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (typeof raw === 'object') {
    return Object.values(raw).map(String).filter((v) => v !== '');
  }
  return [];
}

export function parseValidation(field) {
  if (field?.validation && typeof field.validation === 'object') return field.validation;
  const fromJson = parseJson(field?.validation_json, {});
  return fromJson && typeof fromJson === 'object' && !Array.isArray(fromJson) ? fromJson : {};
}

export function getShowIf(field) {
  const validation = parseValidation(field);
  const showIf = field?.show_if || validation.show_if;
  if (!showIf || typeof showIf !== 'object') return null;
  const fieldKey = String(showIf.field_key || '').trim();
  if (!fieldKey) return null;
  return {
    field_key: fieldKey,
    operator: showIf.operator || 'equals',
    value: showIf.value ?? '',
  };
}

export function isFieldVisible(field, values = {}) {
  const rule = getShowIf(field);
  if (!rule) return true;
  const current = values[rule.field_key];
  const asList = Array.isArray(current)
    ? current.map(String)
    : current == null || current === ''
      ? []
      : [String(current)];
  const target = String(rule.value ?? '');
  switch (rule.operator) {
    case 'is_empty':
      return asList.length === 0;
    case 'not_empty':
      return asList.length > 0;
    case 'contains':
      return asList.some((v) => v.toLowerCase().includes(target.toLowerCase()));
    case 'not_equals':
      return !asList.includes(target);
    case 'equals':
    default:
      return asList.includes(target);
  }
}

export function needsOptions(type) {
  return ['dropdown', 'radio', 'checkbox', 'multiselect'].includes(type);
}
