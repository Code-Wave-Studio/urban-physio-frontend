import { useCallback, useEffect, useRef, useState } from 'react';
import FaIcon from '../FaIcon';

const STORAGE_KEY_PREFIX = 'tup_custom_tab_order_';

/**
 * Customizable, single-line horizontally scrollable tab bar with reordering and status dots.
 *
 * @param {Object} props
 * @param {string[]} props.defaultTabs - Default ordered list of tab names.
 * @param {string} props.activeTab - Currently active tab.
 * @param {(tab: string) => void} props.onSelectTab - Callback when tab is selected.
 * @param {Record<string, { hasDot?: boolean, color?: string, title?: string }>} [props.dotStatus] - Status dot metadata map per tab.
 * @param {string} [props.storageKey] - Key name for persistence in localStorage.
 */
export default function CustomizableTabBar({
  defaultTabs = [],
  activeTab,
  onSelectTab,
  dotStatus = {},
  storageKey = 'patient_detail',
}) {
  const fullStorageKey = `${STORAGE_KEY_PREFIX}${storageKey}`;
  const containerRef = useRef(null);
  const activeTabRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);

  /* Load initial order from localStorage or fallback to default */
  const [tabsOrder, setTabsOrder] = useState(() => {
    try {
      const saved = localStorage.getItem(fullStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with defaultTabs to handle new/removed tabs gracefully
          const validSaved = parsed.filter((t) => defaultTabs.includes(t));
          const missing = defaultTabs.filter((t) => !validSaved.includes(t));
          return [...validSaved, ...missing];
        }
      }
    } catch (e) {
      console.warn('Failed to load tab order:', e);
    }
    return defaultTabs;
  });

  /* Sync tabsOrder if defaultTabs change dynamically */
  useEffect(() => {
    setTabsOrder((prevOrder) => {
      const validPrev = prevOrder.filter((t) => defaultTabs.includes(t));
      const missing = defaultTabs.filter((t) => !validPrev.includes(t));
      return [...validPrev, ...missing];
    });
  }, [defaultTabs]);

  /* Save custom order to localStorage */
  const saveOrder = useCallback(
    (newOrder) => {
      setTabsOrder(newOrder);
      try {
        localStorage.setItem(fullStorageKey, JSON.stringify(newOrder));
      } catch (e) {
        console.warn('Failed to save tab order:', e);
      }
    },
    [fullStorageKey]
  );

  /* Reset to default tab order */
  const handleResetOrder = () => {
    saveOrder(defaultTabs);
  };

  /* Move item left/right */
  const moveTab = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= tabsOrder.length) return;
    const updated = [...tabsOrder];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    saveOrder(updated);
  };

  /* Drag & Drop handlers */
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    const updated = [...tabsOrder];
    const [moved] = updated.splice(draggedItem, 1);
    updated.splice(index, 0, moved);
    setDraggedItem(index);
    setTabsOrder(updated);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    saveOrder(tabsOrder);
  };

  /* Auto-scroll active tab into view smoothly */
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeTab]);

  /* Manual scroll buttons */
  const scrollContainer = (direction) => {
    if (containerRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group/tabbar select-none">
      <div className="flex items-center gap-1.5 bg-slate-100/70 border border-slate-200/80 rounded-2xl p-1.5 backdrop-blur-md shadow-xs">
        {/* Scroll Left Button (desktop) */}
        <button
          type="button"
          onClick={() => scrollContainer('left')}
          className="hidden md:flex shrink-0 w-7 h-7 items-center justify-center rounded-xl bg-white/90 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-white shadow-2xs transition active:scale-95 cursor-pointer"
          title="Scroll left"
        >
          <FaIcon icon="fa-chevron-left" className="text-[10px]" />
        </button>

        {/* Scrollable Single-Line Tab Track */}
        <div
          ref={containerRef}
          className="flex-1 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap py-0.5 px-0.5 scrollbar-none transition-all"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {tabsOrder.map((tabName, idx) => {
            const isActive = activeTab === tabName;
            const dotInfo = dotStatus[tabName];
            const hasDot = dotInfo?.hasDot;

            return (
              <div
                key={tabName}
                ref={isActive ? activeTabRef : null}
                draggable={isEditing}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`relative shrink-0 flex items-center gap-1 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isEditing
                    ? 'cursor-grab active:cursor-grabbing bg-white/90 border border-dashed border-orange-300 px-1.5 py-1 text-slate-700 shadow-2xs'
                    : isActive
                    ? 'bg-slate-900 text-white shadow-sm px-3.5 py-2'
                    : 'bg-white/80 border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-white hover:border-slate-300 px-3.5 py-2'
                }`}
              >
                {isEditing && (
                  <div className="flex items-center gap-0.5 mr-1 text-slate-400">
                    <FaIcon icon="fa-grip-vertical" className="text-[10px]" />
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveTab(idx, -1);
                      }}
                      className="w-4 h-4 rounded hover:bg-slate-200 flex items-center justify-center disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Move left"
                    >
                      <FaIcon icon="fa-chevron-left" className="text-[8px]" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === tabsOrder.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveTab(idx, 1);
                      }}
                      className="w-4 h-4 rounded hover:bg-slate-200 flex items-center justify-center disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Move right"
                    >
                      <FaIcon icon="fa-chevron-right" className="text-[8px]" />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => !isEditing && onSelectTab(tabName)}
                  className="flex items-center gap-1.5 outline-none cursor-pointer"
                >
                  <span>{tabName}</span>

                  {/* Status / Notification Dot */}
                  {!isEditing && hasDot && (
                    <span
                      className={`relative flex h-2 w-2 shrink-0 rounded-full ${
                        dotInfo.color || 'bg-amber-500'
                      }`}
                      title={dotInfo.title || 'Has update/action required'}
                    >
                      <span
                        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                          dotInfo.color || 'bg-amber-500'
                        }`}
                      />
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Scroll Right Button (desktop) */}
        <button
          type="button"
          onClick={() => scrollContainer('right')}
          className="hidden md:flex shrink-0 w-7 h-7 items-center justify-center rounded-xl bg-white/90 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-white shadow-2xs transition active:scale-95 cursor-pointer"
          title="Scroll right"
        >
          <FaIcon icon="fa-chevron-right" className="text-[10px]" />
        </button>

        {/* Reorder / Customize Toggle & Reset Controls */}
        <div className="flex items-center gap-1 pl-1 border-l border-slate-200/80 shrink-0">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleResetOrder}
                className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition cursor-pointer"
                title="Reset to default tab order"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-2xs transition cursor-pointer"
                title="Finish tab reordering"
              >
                Done
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="w-7 h-7 inline-flex items-center justify-center rounded-xl text-slate-500 hover:text-orange-600 hover:bg-white border border-transparent hover:border-slate-200/80 transition active:scale-95 cursor-pointer"
              title="Customize & reorder tabs"
            >
              <FaIcon icon="fa-sliders" className="text-xs" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
