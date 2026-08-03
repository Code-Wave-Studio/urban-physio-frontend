import { useState, useRef } from 'react';
import { Toaster, toast, resolveValue } from 'react-hot-toast';
import FaIcon from './FaIcon';

/**
 * Premium custom Toast card with right-swipe to close, status icons,
 * and high-end glassmorphism design.
 */
function AppToastCard({ toast: t }) {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalRef = useRef(null);

  const handleStart = (clientX, clientY) => {
    startXRef.current = clientX;
    startYRef.current = clientY;
    isHorizontalRef.current = null;
    setIsSwiping(true);
  };

  const handleMove = (clientX, clientY) => {
    if (!isSwiping || isDismissing) return;

    const deltaX = clientX - startXRef.current;
    const deltaY = clientY - startYRef.current;

    if (isHorizontalRef.current === null) {
      if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
        if (deltaX > 0 && deltaX > Math.abs(deltaY)) {
          isHorizontalRef.current = true;
        } else {
          isHorizontalRef.current = false;
        }
      }
    }

    if (isHorizontalRef.current === true && deltaX > 0) {
      setOffsetX(deltaX);
    }
  };

  const handleEnd = () => {
    if (!isSwiping || isDismissing) return;
    setIsSwiping(false);

    if (isHorizontalRef.current === true && offsetX > 60) {
      setIsDismissing(true);
      setOffsetX(350);
      setTimeout(() => {
        toast.dismiss(t.id);
      }, 180);
    } else {
      setOffsetX(0);
    }
    isHorizontalRef.current = null;
  };

  // Status icon configuration based on toast type
  const renderIcon = () => {
    if (t.icon) return <span className="shrink-0 text-base">{t.icon}</span>;

    switch (t.type) {
      case 'success':
        return (
          <div className="shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-emerald-100/80 text-emerald-600 border border-emerald-200/70 shadow-sm shadow-emerald-500/10">
            <FaIcon icon="fa-check" className="text-xs font-bold" />
          </div>
        );
      case 'error':
        return (
          <div className="shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-rose-100/80 text-rose-600 border border-rose-200/70 shadow-sm shadow-rose-500/10">
            <FaIcon icon="fa-xmark" className="text-xs font-bold" />
          </div>
        );
      case 'loading':
        return (
          <div className="shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-indigo-100/80 text-indigo-600 border border-indigo-200/70 shadow-sm">
            <FaIcon icon="fa-spinner" className="text-xs animate-spin" />
          </div>
        );
      default:
        return (
          <div className="shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-teal-100/80 text-teal-600 border border-teal-200/70 shadow-sm">
            <FaIcon icon="fa-info" className="text-xs font-bold" />
          </div>
        );
    }
  };

  const isExiting = !t.visible || isDismissing;
  const opacity = isExiting ? 0 : Math.max(0, 1 - offsetX / 250);

  return (
    <div
      onTouchStart={(e) => {
        const touch = e.touches[0];
        handleStart(touch.clientX, touch.clientY);
      }}
      onTouchMove={(e) => {
        if (e.touches.length > 0) {
          const touch = e.touches[0];
          handleMove(touch.clientX, touch.clientY);
        }
      }}
      onTouchEnd={handleEnd}
      onPointerDown={(e) => {
        if (e.button !== undefined && e.button !== 0) return;
        handleStart(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        handleMove(e.clientX, e.clientY);
      }}
      onPointerUp={handleEnd}
      onPointerCancel={handleEnd}
      style={{
        transform: `translateX(${offsetX}px) ${isExiting ? 'scale(0.95)' : 'scale(1)'}`,
        opacity: opacity,
        transition: isSwiping
          ? 'none'
          : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease-out',
        touchAction: 'pan-y',
        willChange: 'transform, opacity',
      }}
      className="pointer-events-auto w-auto max-w-[calc(100vw-1.5rem)] sm:max-w-xl md:max-w-2xl select-none cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 py-3 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl shadow-slate-900/10 hover:shadow-2xl transition-shadow duration-300">
        {renderIcon()}

        <div className="flex-1 min-w-0 text-xs sm:text-sm font-medium text-slate-800 leading-snug whitespace-normal sm:whitespace-nowrap">
          {resolveValue(t.message, t)}
        </div>

        {t.type !== 'loading' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toast.dismiss(t.id);
            }}
            className="shrink-0 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 active:scale-90 transition-all duration-150"
            aria-label="Dismiss notification"
          >
            <FaIcon icon="fa-xmark" className="text-xs" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Global toast host — positioned cleanly on top-right below site header,
 * with right-swipe to close and premium UI/UX.
 */
export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      containerClassName="app-toaster"
      gutter={10}
    >
      {(t) => <AppToastCard toast={t} />}
    </Toaster>
  );
}
