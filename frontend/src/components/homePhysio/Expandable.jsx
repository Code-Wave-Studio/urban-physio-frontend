import FaIcon from '../FaIcon';

/**
 * Accessible expand/collapse used across Home Physiotherapy sections.
 */
export default function Expandable({
  id,
  open,
  onToggle,
  label,
  children,
  className = '',
  buttonClassName = '',
  chevron = true,
}) {
  const panelId = `${id}-panel`;
  const btnId = `${id}-btn`;

  return (
    <div className={className}>
      <button
        type="button"
        id={btnId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className={
          buttonClassName ||
          'inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-lg px-1'
        }
      >
        <span>{open ? label.replace(/↓\s*$/, '').trim() : label}</span>
        {chevron && (
          <FaIcon
            icon="fa-chevron-down"
            className={`text-[10px] transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={btnId}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

export function AccordionItem({
  id,
  open,
  onToggle,
  title,
  children,
  icon,
  indexLabel,
}) {
  const panelId = `${id}-panel`;
  const btnId = `${id}-btn`;

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 ${
        open
          ? 'border-primary-200/80 bg-white shadow-lg shadow-primary-500/5'
          : 'border-slate-200/80 bg-white/70 hover:border-primary-100 hover:bg-white hover:shadow-md'
      }`}
    >
      <button
        type="button"
        id={btnId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="w-full flex items-start gap-3 text-left p-4 md:p-5 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset"
      >
        {indexLabel != null && (
          <span
            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
              open ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-700'
            }`}
          >
            {indexLabel}
          </span>
        )}
        {icon && (
          <span
            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
              open ? 'bg-primary-600 text-white' : 'bg-slate-100 text-primary-600'
            }`}
          >
            <FaIcon icon={icon} />
          </span>
        )}
        <span className="flex-1 min-w-0 pt-1.5 font-semibold text-slate-800 text-sm md:text-base pr-4">
          {title}
        </span>
        <span
          className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-300 ${
            open ? 'bg-primary-100 text-primary-700 rotate-180' : 'bg-slate-100 text-slate-500'
          }`}
        >
          <FaIcon icon="fa-chevron-down" className="text-xs" />
        </span>
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={btnId}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 md:px-5 pb-4 md:pb-5 text-slate-600 text-sm leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
