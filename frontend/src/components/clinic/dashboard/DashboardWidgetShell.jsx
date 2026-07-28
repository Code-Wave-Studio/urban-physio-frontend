import FaIcon from '../../FaIcon';

export default function DashboardWidgetShell({
  id,
  title,
  icon,
  action,
  children,
  customize,
  hidden,
  onToggleHidden,
  dragProps,
  isDragging,
  isOver,
  className = '',
  bodyClassName = '',
}) {
  return (
    <section
      {...dragProps}
      data-widget-id={id}
      className={`dash-widget ${hidden && customize ? 'dash-widget--hidden' : ''} ${
        isDragging ? 'dash-widget--dragging' : ''
      } ${isOver ? 'dash-widget--over' : ''} ${className}`}
    >
      <header className="dash-widget-header">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          {customize && (
            <span
              className="dash-widget-handle"
              title="Drag to rearrange"
              aria-label="Drag to rearrange"
            >
              <FaIcon icon="fa-grip-vertical" />
            </span>
          )}
          {icon && (
            <span className="dash-widget-icon">
              <FaIcon icon={icon} />
            </span>
          )}
          <h2 className="dash-widget-title">{title}</h2>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-start">
          {action}
          {customize && (
            <button
              type="button"
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
              onClick={(e) => {
                e.stopPropagation();
                onToggleHidden?.(id);
              }}
            >
              {hidden ? 'Show' : 'Hide'}
            </button>
          )}
        </div>
      </header>
      {(!hidden || customize) && (
        <div className={`dash-widget-body ${hidden && customize ? 'opacity-40 pointer-events-none' : ''} ${bodyClassName}`}>
          {children}
        </div>
      )}
    </section>
  );
}
