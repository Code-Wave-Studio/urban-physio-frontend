import { useRef, useState } from 'react';
import FaIcon from '../FaIcon';

const FIELD_TYPES = [
  { value: 'text', label: 'Short text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'number', label: 'Number / rating' },
  { value: 'yesno', label: 'Yes / No' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'multiselect', label: 'Multi-select' },
];

/**
 * Drag-and-drop assessment question list.
 * Uses native HTML5 DnD (no extra dependency).
 */
export default function AssessmentQuestionsEditor({
  fields = [],
  onChange,
  readOnly = false,
}) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const dragItem = useRef(null);

  const updateField = (index, patch) => {
    if (readOnly) return;
    onChange(fields.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeField = (index) => {
    if (readOnly) return;
    onChange(fields.filter((_, i) => i !== index));
  };

  const addField = () => {
    if (readOnly) return;
    onChange([
      ...fields,
      {
        key: `field_${Date.now()}`,
        label: '',
        type: 'text',
        required: false,
        options: [],
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
    if (readOnly) return;
    dragItem.current = index;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    // Improve drag ghost in some browsers
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.add('opacity-60');
    }
  };

  const onDragEnd = (e) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove('opacity-60');
    }
    setDragIndex(null);
    setOverIndex(null);
    dragItem.current = null;
  };

  const onDragOver = (index, e) => {
    if (readOnly) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (overIndex !== index) setOverIndex(index);
  };

  const onDrop = (index, e) => {
    if (readOnly) return;
    e.preventDefault();
    const from = dragItem.current ?? Number(e.dataTransfer.getData('text/plain'));
    reorder(from, index);
    setDragIndex(null);
    setOverIndex(null);
    dragItem.current = null;
  };

  return (
    <section>
      <div className="flex justify-between items-center mb-2">
        <div>
          <p className="text-sm font-medium text-slate-800">Assessment questions</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {readOnly ? 'Past version — questions are locked' : 'Drag the handle to reorder · new submissions use the active version'}
          </p>
        </div>
        {!readOnly && (
          <button type="button" className="text-xs font-semibold text-teal-700" onClick={addField}>
            <FaIcon icon="fa-plus" className="mr-1" />
            Add question
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
        {fields.map((field, index) => {
          const isOver = overIndex === index && dragIndex !== null && dragIndex !== index;
          const optionsText = Array.isArray(field.options)
            ? field.options.join(', ')
            : (typeof field.options === 'string' ? field.options : '');
          return (
            <div
              key={field.key || `q-${index}`}
              draggable={!readOnly}
              onDragStart={(e) => onDragStart(index, e)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => onDragOver(index, e)}
              onDrop={(e) => onDrop(index, e)}
              className={`rounded-xl border bg-white p-3 space-y-2 transition ${
                isOver ? 'border-teal-400 ring-2 ring-teal-100' : 'border-slate-100'
              } ${dragIndex === index ? 'opacity-50' : ''} ${readOnly ? 'bg-slate-50/80' : ''}`}
            >
              <div className="flex items-start gap-2">
                {!readOnly && (
                  <button
                    type="button"
                    className="mt-2 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 px-1"
                    title="Drag to reorder"
                    aria-label={`Drag question ${index + 1}`}
                    tabIndex={-1}
                  >
                    <FaIcon icon="fa-grip-vertical" />
                  </button>
                )}
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] font-bold text-slate-400 self-center w-6">#{index + 1}</span>
                    <input
                      className="input-field text-sm flex-1 min-w-[140px]"
                      placeholder="Question label"
                      required={!readOnly}
                      disabled={readOnly}
                      value={field.label || ''}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                    />
                    <select
                      className="input-field text-xs !w-32"
                      disabled={readOnly}
                      value={field.type || 'text'}
                      onChange={(e) => updateField(index, { type: e.target.value })}
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  {['dropdown', 'multiselect'].includes(field.type) && (
                    <input
                      className="input-field text-xs"
                      placeholder="Options, comma-separated"
                      disabled={readOnly}
                      value={optionsText}
                      onChange={(e) => updateField(index, {
                        options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })}
                    />
                  )}
                  <div className="flex items-center justify-between">
                    <label className={`text-xs ${readOnly ? 'text-slate-400' : 'text-slate-600'}`}>
                      <input
                        type="checkbox"
                        className="mr-1"
                        disabled={readOnly}
                        checked={Boolean(field.required)}
                        onChange={(e) => updateField(index, { required: e.target.checked })}
                      />
                      Required
                    </label>
                    {!readOnly && (
                      <button
                        type="button"
                        aria-label="Remove question"
                        onClick={() => removeField(index)}
                        className="w-7 h-7 rounded bg-rose-50 text-rose-600 hover:bg-rose-100"
                      >
                        <FaIcon icon="fa-trash" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {!fields.length && (
          <p className="text-xs text-slate-400 text-center py-8 border border-dashed border-slate-200 rounded-xl">
            {readOnly ? 'This version has no questions.' : 'Add the first assessment question, then drag to reorder.'}
          </p>
        )}
      </div>
    </section>
  );
}
