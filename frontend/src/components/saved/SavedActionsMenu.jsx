import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import FaIcon from '../FaIcon';

const MENU_WIDTH = 240;

function useIsMobile() {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return mobile;
}

function MenuItems({ items, onSelect, variant = 'dropdown' }) {
  const isSheet = variant === 'sheet';

  return items.map((item) => {
    if (item.divider) {
      return <hr key={item.key || 'divider'} className="my-1 border-slate-100" />;
    }

    const rowClass = isSheet
      ? `w-full text-left px-4 py-3.5 text-base flex items-center gap-3 transition active:bg-slate-50 rounded-xl ${
          item.danger ? 'text-red-700' : item.primary ? 'text-primary-700 font-semibold' : 'text-slate-800'
        }`
      : `w-full text-left px-3.5 py-2.5 text-sm flex items-center gap-2.5 transition rounded-lg hover:bg-slate-50 ${
          item.danger ? 'text-red-700 hover:bg-red-50' : item.primary ? 'text-primary-700 font-semibold' : 'text-slate-800'
        }`;

    const iconWrap = (
      <span
        className={`shrink-0 flex items-center justify-center rounded-lg ${
          isSheet ? 'w-10 h-10' : 'w-8 h-8'
        } ${
          item.danger
            ? 'bg-red-50 text-red-600'
            : item.primary
              ? 'bg-primary-50 text-primary-600'
              : 'bg-slate-100 text-slate-600'
        }`}
      >
        {item.icon && <FaIcon icon={item.icon} className={isSheet ? 'text-sm' : 'text-xs'} brand={item.brand} />}
      </span>
    );

    const content = (
      <>
        {iconWrap}
        <span className="font-medium">{item.label}</span>
      </>
    );

    const close = () => onSelect();

    if (item.onClick) {
      return (
        <button
          key={item.key || item.label}
          type="button"
          role="menuitem"
          className={rowClass}
          onClick={() => {
            item.onClick();
            close();
          }}
        >
          {content}
        </button>
      );
    }

    if (item.to) {
      return (
        <Link key={item.key || item.label} to={item.to} role="menuitem" className={rowClass} onClick={close}>
          {content}
        </Link>
      );
    }

    if (item.href) {
      return (
        <a
          key={item.key || item.label}
          href={item.href}
          role="menuitem"
          className={rowClass}
          target={item.external ? '_blank' : undefined}
          rel={item.external ? 'noopener noreferrer' : undefined}
          onClick={close}
        >
          {content}
        </a>
      );
    }

    return null;
  });
}

/**
 * Actions menu for saved doctors/clinics — bottom sheet on mobile, portal dropdown on desktop.
 */
export default function SavedActionsMenu({ items, className = '', title = 'Quick actions' }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const isMobile = useIsMobile();

  const close = useCallback(() => setOpen(false), []);

  const updatePosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    let left = rect.right - MENU_WIDTH;
    left = Math.max(12, Math.min(left, window.innerWidth - MENU_WIDTH - 12));
    const top = rect.bottom + 8;
    setMenuPos({ top, left });
  }, []);

  useEffect(() => {
    if (!open || isMobile) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, isMobile, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isMobile]);

  if (!items?.length) return null;

  const portal =
    open &&
    typeof document !== 'undefined' &&
    createPortal(
      <>
        <button
          type="button"
          className="fixed inset-0 z-[250] bg-slate-900/50 backdrop-blur-[2px] animate-fade-in border-0 cursor-default"
          aria-label="Close actions menu"
          onClick={close}
        />

        {isMobile ? (
          <div
            role="menu"
            className="fixed inset-x-0 bottom-0 z-[251] animate-slide-up"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="mx-auto max-w-lg rounded-t-2xl border border-slate-200 bg-white shadow-[0_-8px_40px_rgba(15,23,42,0.18)]">
              <div className="flex justify-center pt-3 pb-1">
                <span className="h-1 w-10 rounded-full bg-slate-200" aria-hidden />
              </div>
              <div className="px-4 pb-2 border-b border-slate-100">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Actions</p>
                <p className="text-base font-bold text-slate-900 truncate mt-0.5">{title}</p>
              </div>
              <div className="p-2 max-h-[min(70dvh,420px)] overflow-y-auto">
                <MenuItems items={items} onSelect={close} variant="sheet" />
              </div>
              <div className="p-3 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={close}
                  className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            role="menu"
            className="fixed z-[251] rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.18)] py-1.5 px-1 animate-fade-in"
            style={{ top: menuPos.top, left: menuPos.left, width: MENU_WIDTH }}
          >
            <p className="px-3.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400 truncate">
              {title}
            </p>
            <MenuItems items={items} onSelect={close} variant="dropdown" />
          </div>
        )}
      </>,
      document.body,
    );

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`btn-outline text-sm inline-flex items-center gap-1.5 !py-2.5 shrink-0 ${className}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <FaIcon icon="fa-ellipsis-vertical" />
        Actions
      </button>
      {portal}
    </>
  );
}
