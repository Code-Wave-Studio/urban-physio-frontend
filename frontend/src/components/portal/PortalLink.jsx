import { useNavigate } from 'react-router-dom';

/**
 * Clean Portal Navigation Link component.
 * Prevents browser status-bar URL preview tooltips on hover across all portal navigation elements
 * while preserving SPA routing, keyboard accessibility, and open-in-new-tab (Ctrl/Cmd+Click) functionality.
 */
export default function PortalLink({
  to,
  children,
  className = '',
  onClick,
  target,
  rel,
  title,
  ariaLabel,
  ...props
}) {
  const navigate = useNavigate();

  if (!to) {
    return (
      <button
        type="button"
        className={className}
        onClick={onClick}
        title={title}
        aria-label={ariaLabel}
        {...props}
      >
        {children}
      </button>
    );
  }

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
    if (e.defaultPrevented) return;

    if (e.ctrlKey || e.metaKey || e.button === 1 || target === '_blank') {
      window.open(to, '_blank', 'noopener,noreferrer');
      e.preventDefault();
      return;
    }

    e.preventDefault();
    if (to.startsWith('http://') || to.startsWith('https://')) {
      window.location.href = to;
    } else {
      navigate(to);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick(e);
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      title={title}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      {...props}
    >
      {children}
    </button>
  );
}
