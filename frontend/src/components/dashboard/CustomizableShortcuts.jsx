import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';

const TONE = {
  teal: { grad: 'from-teal-500 to-teal-700', text: 'text-teal-700', soft: 'bg-teal-50', border: 'border-teal-100' },
  sky: { grad: 'from-sky-500 to-sky-700', text: 'text-sky-700', soft: 'bg-sky-50', border: 'border-sky-100' },
  indigo: { grad: 'from-indigo-500 to-indigo-700', text: 'text-indigo-700', soft: 'bg-indigo-50', border: 'border-indigo-100' },
  violet: { grad: 'from-violet-500 to-violet-700', text: 'text-violet-700', soft: 'bg-violet-50', border: 'border-violet-100' },
  primary: { grad: 'from-primary-500 to-primary-700', text: 'text-primary-700', soft: 'bg-primary-50', border: 'border-primary-100' },
  rose: { grad: 'from-rose-500 to-rose-700', text: 'text-rose-700', soft: 'bg-rose-50', border: 'border-rose-100' },
  amber: { grad: 'from-amber-500 to-orange-600', text: 'text-amber-800', soft: 'bg-amber-50', border: 'border-amber-100' },
  slate: { grad: 'from-slate-500 to-slate-700', text: 'text-slate-700', soft: 'bg-slate-100', border: 'border-slate-200' },
  emerald: { grad: 'from-emerald-500 to-emerald-700', text: 'text-emerald-700', soft: 'bg-emerald-50', border: 'border-emerald-100' },
  cyan: { grad: 'from-cyan-500 to-cyan-700', text: 'text-cyan-700', soft: 'bg-cyan-50', border: 'border-cyan-100' },
  orange: { grad: 'from-orange-500 to-orange-700', text: 'text-orange-700', soft: 'bg-orange-50', border: 'border-orange-100' },
  lime: { grad: 'from-lime-600 to-green-700', text: 'text-lime-800', soft: 'bg-lime-50', border: 'border-lime-100' },
  fuchsia: { grad: 'from-fuchsia-500 to-fuchsia-700', text: 'text-fuchsia-700', soft: 'bg-fuchsia-50', border: 'border-fuchsia-100' },
};

/**
 * Shared Customizable & Draggable Shortcuts Widget Engine.
 * Allows users to reorder shortcuts, toggle item visibility, place at top of dashboard,
 * and saves choices in localStorage.
 */
export default function CustomizableShortcuts({
  storageKey = 'default',
  badge = 'WORKSPACE',
  title = 'Quick Work',
  subtitle = 'Jump to pages you check and update often',
  items = [],
  groups = null,
  onPlaceAtTopChange = null,
}) {
  // Flatten items if passed in groups
  const allItems = items.length > 0
    ? items
    : (groups ? groups.flatMap((g) => g.items.map((it) => ({ ...it, category: g.title }))) : []);

  const storageFieldKey = `urbanphysio_shortcuts_${storageKey}`;

  const [order, setOrder] = useState(() => allItems.map((i) => i.to || i.label));
  const [hiddenItems, setHiddenItems] = useState({});
  const [placeAtTop, setPlaceAtTop] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dragItemRef = useRef(null);
  const dragOverItemRef = useRef(null);

  // Load saved preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageFieldKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.order && Array.isArray(parsed.order)) {
          const defaultKeys = allItems.map((i) => i.to || i.label);
          const validOrder = parsed.order.filter((k) => defaultKeys.includes(k));
          const missingKeys = defaultKeys.filter((k) => !validOrder.includes(k));
          setOrder([...validOrder, ...missingKeys]);
        }
        if (parsed.hidden && typeof parsed.hidden === 'object') {
          setHiddenItems(parsed.hidden);
        }
        if (typeof parsed.placeAtTop === 'boolean') {
          setPlaceAtTop(parsed.placeAtTop);
          if (onPlaceAtTopChange) onPlaceAtTopChange(parsed.placeAtTop);
        }
      } else {
        setOrder(allItems.map((i) => i.to || i.label));
      }
    } catch (e) {
      console.warn('Could not read saved shortcuts config', e);
    }
  }, [storageKey]);

  // Save changes to localStorage
  const saveConfig = (newOrder, newHidden, newPlaceAtTop) => {
    setOrder(newOrder);
    setHiddenItems(newHidden);
    setPlaceAtTop(newPlaceAtTop);
    if (onPlaceAtTopChange) onPlaceAtTopChange(newPlaceAtTop);

    try {
      localStorage.setItem(
        storageFieldKey,
        JSON.stringify({
          order: newOrder,
          hidden: newHidden,
          placeAtTop: newPlaceAtTop,
        })
      );
    } catch (e) {
      console.warn('Could not save shortcuts config', e);
    }
  };

  // Reordering handlers
  const moveItem = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= order.length) return;
    const newOrder = [...order];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);
    saveConfig(newOrder, hiddenItems, placeAtTop);
  };

  const handleDragStart = (idx) => {
    dragItemRef.current = idx;
  };

  const handleDragEnter = (idx) => {
    dragOverItemRef.current = idx;
  };

  const handleDragEnd = () => {
    if (
      dragItemRef.current !== null &&
      dragOverItemRef.current !== null &&
      dragItemRef.current !== dragOverItemRef.current
    ) {
      moveItem(dragItemRef.current, dragOverItemRef.current);
    }
    dragItemRef.current = null;
    dragOverItemRef.current = null;
  };

  const toggleHide = (key) => {
    const nextHidden = { ...hiddenItems, [key]: !hiddenItems[key] };
    saveConfig(order, nextHidden, placeAtTop);
  };

  const togglePlaceAtTop = () => {
    const nextTop = !placeAtTop;
    saveConfig(order, hiddenItems, nextTop);
  };

  const resetDefault = () => {
    const defaultOrder = allItems.map((i) => i.to || i.label);
    saveConfig(defaultOrder, {}, false);
  };

  // Map item details by key
  const itemMap = new Map();
  allItems.forEach((it) => {
    itemMap.set(it.to || it.label, it);
  });

  // Ordered items list
  const orderedList = order
    .map((key) => itemMap.get(key))
    .filter(Boolean);

  const visibleList = isEditing
    ? orderedList
    : orderedList.filter((it) => !hiddenItems[it.to || it.label]);

  return (
    <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/50 via-slate-50/30 to-white p-4 sm:p-6 shadow-sm transition-all duration-300">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200/70">
        <div>
          {badge && (
            <span className="inline-block text-[10px] sm:text-xs font-bold tracking-wider uppercase text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full mb-1">
              {badge}
            </span>
          )}
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            {title}
            {placeAtTop && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md flex items-center gap-1">
                <FaIcon icon="fa-thumbtack" className="text-[10px]" /> Pinned to top
              </span>
            )}
          </h2>
          {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Place at top shortcut toggle */}
          <button
            type="button"
            onClick={togglePlaceAtTop}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold transition-all duration-200 shadow-sm ${
              placeAtTop
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
                : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300'
            }`}
            title="Place shortcuts at top of dashboard"
          >
            <FaIcon icon="fa-thumbtack" className={`text-xs ${placeAtTop ? 'rotate-45 text-amber-300' : 'text-slate-400'}`} />
            <span>{placeAtTop ? 'Pinned to Top' : 'Pin to Top'}</span>
          </button>

          {/* Edit Layout Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold transition-all duration-200 shadow-sm ${
              isEditing
                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'
                : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <FaIcon icon={isEditing ? 'fa-check' : 'fa-sliders'} className="text-xs" />
            <span>{isEditing ? 'Done Customizing' : 'Customize Layout'}</span>
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={resetDefault}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-all duration-200 shadow-sm"
            >
              <FaIcon icon="fa-rotate-left" className="text-xs text-rose-500" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Customize Mode Instruction Notice */}
      {isEditing && (
        <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <FaIcon icon="fa-hand" className="text-amber-600" />
            <span>
              <strong>Customize Mode Active:</strong> Drag cards or use <FaIcon icon="fa-arrow-left" className="inline text-[10px]" /> <FaIcon icon="fa-arrow-right" className="inline text-[10px]" /> to reorder. Tap <FaIcon icon="fa-eye" className="inline text-[10px]" /> to show/hide.
            </span>
          </div>
        </div>
      )}

      {/* Grid of Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {visibleList.map((item, idx) => {
          const key = item.to || item.label;
          const isHidden = hiddenItems[key];
          const tone = TONE[item.tone] || TONE.primary;

          return (
            <div
              key={key}
              draggable={isEditing}
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`group relative flex flex-col rounded-2xl border ${tone.border} bg-white/95 p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200 min-h-[7.5rem] sm:min-h-[8rem] ${
                isHidden ? 'opacity-40 grayscale' : ''
              } ${isEditing ? 'cursor-grab active:cursor-grabbing border-dashed border-slate-300 ring-2 ring-emerald-500/20' : ''}`}
            >
              {/* Customize Mode Overlay Controls */}
              {isEditing && (
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-md rounded-lg p-1 border border-slate-200 shadow-sm">
                  {/* Reorder Left / Up */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      moveItem(idx, idx - 1);
                    }}
                    disabled={idx === 0}
                    className="h-6 w-6 flex items-center justify-center text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-slate-100 transition"
                    title="Move left"
                  >
                    <FaIcon icon="fa-arrow-left" className="text-[10px]" />
                  </button>

                  {/* Reorder Right / Down */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      moveItem(idx, idx + 1);
                    }}
                    disabled={idx === visibleList.length - 1}
                    className="h-6 w-6 flex items-center justify-center text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-slate-100 transition"
                    title="Move right"
                  >
                    <FaIcon icon="fa-arrow-right" className="text-[10px]" />
                  </button>

                  {/* Toggle Hide */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleHide(key);
                    }}
                    className={`h-6 w-6 flex items-center justify-center rounded transition ${
                      isHidden ? 'text-rose-600 bg-rose-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    title={isHidden ? 'Show shortcut' : 'Hide shortcut'}
                  >
                    <FaIcon icon={isHidden ? 'fa-eye-slash' : 'fa-eye'} className="text-[10px]" />
                  </button>

                  {/* Drag Handle */}
                  <span className="h-6 w-5 flex items-center justify-center text-slate-400 cursor-grab">
                    <FaIcon icon="fa-grip-vertical" className="text-[10px]" />
                  </span>
                </div>
              )}

              {/* Card Content */}
              <Link
                to={isEditing ? '#' : item.to}
                onClick={(e) => {
                  if (isEditing) e.preventDefault();
                }}
                className="flex flex-col h-full w-full"
              >
                <span
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${tone.grad} text-white flex items-center justify-center shadow-sm mb-2.5 sm:mb-3 shrink-0`}
                >
                  <FaIcon icon={item.icon} className="text-sm sm:text-base" />
                </span>

                <p className="font-bold text-sm sm:text-[0.95rem] text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors">
                  {item.label}
                </p>

                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2 flex-1">
                  {item.desc}
                </p>

                <span className={`mt-2 inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold ${tone.text}`}>
                  Open
                  <FaIcon
                    icon="fa-arrow-right"
                    className="text-[9px] opacity-70 group-hover:translate-x-0.5 transition-transform"
                  />
                </span>

                <span
                  className={`pointer-events-none absolute inset-0 rounded-2xl ${tone.soft} opacity-0 group-hover:opacity-40 transition-opacity`}
                />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
