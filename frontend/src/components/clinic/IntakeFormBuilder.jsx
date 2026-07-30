import { useRef, useState } from 'react';
import FaIcon from '../FaIcon';
import {
  INTAKE_FIELD_TYPES,
  getShowIf,
  needsOptions,
  parseOptions,
  parseValidation,
} from '../../utils/intakeFields';

const OPERATORS = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'does not equal' },
  { value: 'contains', label: 'contains' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'not_empty', label: 'is not empty' },
];

/**
 * Drag-and-drop intake registration field builder (native HTML5 DnD).
 */
export default function IntakeFormBuilder({ fields = [], onChange }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const dragItem = useRef(null);

  const updateField = (index, patch) => {
    onChange(fields.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeField = (index) => {
    const field = fields[index];
    if (Number(field?.is_locked)) return;
    onChange(fields.filter((_, i) => i !== index));
  };

  const addField = () => {
    onChange([
      ...fields,
      {
        field_key: `custom_${Date.now()}`,
        label: 'Custom field',
        field_type: 'text',
        is_enabled: true,
        is_required: false,
        is_locked: false,
        options: [],
        show_if: null,
      },
    ]);
  };

  const reorder = (from, to) => {
    if (from === to || from == null || to == null) return;
    if (to < 0 || to >= fields.length) return;
    const next = [...fields];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const onDragStart = (index, e) => {
    dragItem.current = index;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const onDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
    dragItem.current = null;
  };

  const clearShowIf = (index) => {
    const field = fields[index];
    const validation = { ...parseValidation(field) };
    delete validation.show_if;
    updateField(index, { show_if: null, validation });
  };

  const onDragOver = (index, e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (overIndex !== index) setOverIndex(index);
  };

  const onDrop = (index, e) => {
    e.preventDefault();
    const from = dragItem.current ?? Number(e.dataTransfer.getData('text/plain'));
    reorder(from, index);
    setDragIndex(null);
    setOverIndex(null);
    dragItem.current = null;
  };

  const setShowIf = (index, patch) => {
    const field = fields[index];
    const current = getShowIf(field) || { field_key: '', operator: 'equals', value: '' };
    const next = { ...current, ...patch };
    if (!next.field_key) {
      clearShowIf(index);
      return;
    }
    updateField(index, {
      show_if: next,
      validation: { ...parseValidation(field), show_if: next },
    });
  };

  const conditionSources = fields.filter((f) => f.field_key);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 px-3 sm:px-4 pt-3 sm:pt-4">
        <div className="min-w-0">
          <h2 className="font-bold">Intake fields</h2>
          <p className="text-xs text-slate-500">Drag handles to reorder · name & mobile stay required · email is optional</p>
        </div>
        <button type="button" className="btn-primary text-xs !py-2 w-full sm:w-auto" onClick={addField}>
          <FaIcon icon="fa-plus" className="mr-1" />
          Custom field
        </button>
      </div>

      <div className="px-3 sm:px-4 pb-3 space-y-2">
        {fields.map((field, index) => {
          const locked = Boolean(Number(field.is_locked));
          const type = field.field_type || 'text';
          const options = parseOptions(field.options ?? field.options_json);
          const showIf = getShowIf(field);
          const validation = parseValidation(field);
          const isOver = overIndex === index && dragIndex !== null && dragIndex !== index;
          return (
            <div
              key={field.id || field.field_key || `f-${index}`}
              onDragOver={(e) => onDragOver(index, e)}
              onDrop={(e) => onDrop(index, e)}
              className={`rounded-xl border bg-white p-3 space-y-3 transition ${
                isOver ? 'border-teal-400 ring-2 ring-teal-100' : 'border-slate-100'
              } ${dragIndex === index ? 'opacity-50' : ''} ${!field.is_enabled && !locked ? 'opacity-70' : ''}`}
            >
              <div className="flex items-start gap-2">
                <span
                  draggable
                  onDragStart={(e) => onDragStart(index, e)}
                  onDragEnd={onDragEnd}
                  className="mt-2 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 px-1 select-none"
                  title="Drag to reorder"
                  aria-label={`Drag field ${index + 1}`}
                  role="button"
                  tabIndex={-1}
                >
                  <FaIcon icon="fa-grip-vertical" />
                </span>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] font-bold text-slate-400 w-6">#{index + 1}</span>
                    <input
                      className="input-field text-sm flex-1 min-w-[140px]"
                      value={field.label || ''}
                      disabled={locked}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                    />
                    <select
                      className="input-field text-xs !w-36"
                      disabled={locked}
                      value={type}
                      onChange={(e) => updateField(index, { field_type: e.target.value })}
                    >
                      {INTAKE_FIELD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                      {!INTAKE_FIELD_TYPES.some((t) => t.value === type) && (
                        <option value={type}>{type}</option>
                      )}
                    </select>
                  </div>

                  {needsOptions(type) && (
                    <input
                      className="input-field text-xs"
                      placeholder="Options, comma-separated"
                      disabled={locked}
                      value={options.join(', ')}
                      onChange={(e) => {
                        const next = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                        updateField(index, { options: next, options_json: next });
                      }}
                    />
                  )}

                  {type === 'rating' && (
                    <label className="text-xs text-slate-600 flex items-center gap-2">
                      Max rating
                      <input
                        type="number"
                        min={2}
                        max={10}
                        className="input-field text-xs !w-20"
                        disabled={locked}
                        value={validation.rating_max || field.rating_max || 5}
                        onChange={(e) => {
                          const rating_max = Math.max(2, Math.min(10, Number(e.target.value) || 5));
                          updateField(index, {
                            rating_max,
                            validation: { ...validation, rating_max },
                          });
                        }}
                      />
                    </label>
                  )}

                  <div className="flex flex-wrap items-center gap-3 justify-between">
                    <div className="flex flex-wrap gap-3">
                      <label className="text-xs flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          disabled={locked}
                          checked={Boolean(field.is_enabled)}
                          onChange={(e) => updateField(index, { is_enabled: e.target.checked })}
                        />
                        Enabled
                      </label>
                      <label className="text-xs flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          disabled={locked && field.field_key !== 'email'}
                          checked={field.field_key === 'email' ? false : Boolean(field.is_required)}
                          onChange={(e) => {
                            if (field.field_key === 'email') return;
                            updateField(index, { is_required: e.target.checked });
                          }}
                        />
                        {field.field_key === 'email' ? 'Optional' : 'Required'}
                      </label>
                      {locked && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 self-center">
                          Locked
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label="Delete field"
                      disabled={locked}
                      className="w-8 h-8 rounded bg-rose-50 text-rose-600 disabled:opacity-30"
                      onClick={() => removeField(index)}
                    >
                      <FaIcon icon="fa-trash" />
                    </button>
                  </div>

                  {!locked && (
                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 space-y-2">
                      <p className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                        <FaIcon icon="fa-code-branch" className="text-teal-600" />
                        Conditional logic
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <select
                          className="input-field text-xs"
                          value={showIf?.field_key || ''}
                          onChange={(e) => setShowIf(index, { field_key: e.target.value })}
                        >
                          <option value="">Always show</option>
                          {conditionSources
                            .filter((f) => f.field_key !== field.field_key)
                            .map((f) => (
                              <option key={f.field_key} value={f.field_key}>
                                Show if “{f.label || f.field_key}”
                              </option>
                            ))}
                        </select>
                        {showIf?.field_key ? (
                          <>
                            <select
                              className="input-field text-xs"
                              value={showIf.operator || 'equals'}
                              onChange={(e) => setShowIf(index, { operator: e.target.value })}
                            >
                              {OPERATORS.map((op) => (
                                <option key={op.value} value={op.value}>{op.label}</option>
                              ))}
                            </select>
                            {!['is_empty', 'not_empty'].includes(showIf.operator) && (
                              <input
                                className="input-field text-xs"
                                placeholder="Value"
                                value={showIf.value || ''}
                                onChange={(e) => setShowIf(index, { value: e.target.value })}
                              />
                            )}
                          </>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {!fields.length && (
          <p className="text-xs text-slate-400 text-center py-10 border border-dashed border-slate-200 rounded-xl">
            Add a custom field, then drag to reorder.
          </p>
        )}
      </div>
    </div>
  );
}
