import { useRef, useState } from 'react';
import FaIcon from '../../FaIcon';
import DashboardWidgetShell from './DashboardWidgetShell';

/**
 * Drag-and-drop widget board (HTML5 DnD — same approach as AssessmentQuestionsEditor).
 */
export default function DashboardWidgetBoard({
  widgets,
  visibleIds,
  customize,
  isHidden,
  onReorder,
  onToggleHidden,
  toolbar,
}) {
  const dragId = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [overId, setOverId] = useState(null);

  const byId = Object.fromEntries(widgets.map((w) => [w.id, w]));
  const ordered = visibleIds.map((id) => byId[id]).filter(Boolean);

  const onDragStart = (id, e) => {
    if (!customize) return;
    dragId.current = id;
    setDragging(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    try {
      e.dataTransfer.setDragImage(e.currentTarget, 24, 24);
    } catch {
      /* ignore */
    }
  };

  const onDragEnd = () => {
    dragId.current = null;
    setDragging(null);
    setOverId(null);
  };

  const onDragOver = (id, e) => {
    if (!customize) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (overId !== id) setOverId(id);
  };

  const onDrop = (id, e) => {
    if (!customize) return;
    e.preventDefault();
    const from = dragId.current || e.dataTransfer.getData('text/plain');
    onReorder?.(from, id);
    onDragEnd();
  };

  return (
    <div className="space-y-4">
      {(toolbar || customize) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-slate-500">
            {customize ? (
              <span className="inline-flex items-center gap-1.5 text-primary-700 font-semibold">
                <FaIcon icon="fa-up-down-left-right" />
                Customize mode — drag widgets to rearrange, hide what you don’t need
              </span>
            ) : (
              <span className="text-slate-500">Your dashboard layout</span>
            )}
          </div>
          {toolbar}
        </div>
      )}

      <div className="dash-board">
        {ordered.map((widget) => {
          const hidden = isHidden?.(widget.id);
          if (hidden && !customize) return null;
          const span = widget.span || 'full';
          return (
            <DashboardWidgetShell
              key={widget.id}
              id={widget.id}
              title={widget.title}
              icon={widget.icon}
              action={widget.action}
              customize={customize}
              hidden={hidden}
              onToggleHidden={onToggleHidden}
              className={`dash-span-${span}`}
              bodyClassName={widget.bodyClassName}
              isDragging={dragging === widget.id}
              isOver={overId === widget.id && dragging && dragging !== widget.id}
              dragProps={
                customize
                  ? {
                      draggable: true,
                      onDragStart: (e) => onDragStart(widget.id, e),
                      onDragEnd,
                      onDragOver: (e) => onDragOver(widget.id, e),
                      onDrop: (e) => onDrop(widget.id, e),
                    }
                  : {}
              }
            >
              {widget.render?.()}
            </DashboardWidgetShell>
          );
        })}
      </div>
    </div>
  );
}

export function DashboardCustomizeToolbar({ customize, onToggle, onReset }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={customize ? 'btn-primary text-xs !py-1.5' : 'btn-outline text-xs !py-1.5'}
        onClick={onToggle}
      >
        <FaIcon icon={customize ? 'fa-check' : 'fa-sliders'} className="mr-1.5" />
        {customize ? 'Done' : 'Customize'}
      </button>
      {customize && (
        <button type="button" className="btn-outline text-xs !py-1.5" onClick={onReset}>
          <FaIcon icon="fa-rotate-left" className="mr-1.5" />
          Reset layout
        </button>
      )}
    </div>
  );
}
