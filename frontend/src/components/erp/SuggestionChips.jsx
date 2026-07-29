import { useState } from 'react';

/**
 * Suggestion chips displayed below text areas.
 * Click a chip to append its insert_text into the field value.
 */
export default function SuggestionChips({ chips = [], onInsert }) {
  const [search, setSearch] = useState('');
  if (!chips.length) return null;

  const filtered = search
    ? chips.filter((c) => c.label.toLowerCase().includes(search.toLowerCase()) || c.insert_text.toLowerCase().includes(search.toLowerCase()))
    : chips;

  return (
    <div className="space-y-1.5">
      {chips.length > 8 && (
        <input
          type="text"
          className="w-full text-xs border rounded-full px-3 py-1 focus:outline-none focus:ring-1 focus:ring-teal-400"
          placeholder="Search chips…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}
      <div className="flex flex-wrap gap-1.5">
        {filtered.slice(0, 20).map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => onInsert(chip.insert_text)}
            className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 rounded-full px-2 py-0.5 hover:bg-teal-100 transition-colors font-medium"
            title={chip.insert_text}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
