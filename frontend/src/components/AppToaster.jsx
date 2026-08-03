import { useState, useRef } from 'react';
import { Toaster, ToastBar, toast, resolveValue } from 'react-hot-toast';
import FaIcon from './FaIcon';

/**
 * Custom Swipeable Toast wrapper for react-hot-toast.
 * Supports right-swipe (touch and mouse drag) to dismiss notifications.
 */
function SwipeableToastItem({ toast: t }) {
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

    // Lock direction on initial movement threshold
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

  const opacity = isDismissing ? 0 : Math.max(0, 1 - offsetX / 250);

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
        transform: `translateX(${offsetX}px)`,
        opacity: opacity,
        transition: isSwiping
          ? 'none'
          : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease-out',
        touchAction: 'pan-y',
        willChange: 'transform, opacity',
      }}
      className="w-full select-none cursor-grab active:cursor-grabbing"
    >
      <ToastBar toast={t}>
        {({ icon, message }) => (
          <div className="flex items-start gap-2.5 w-full min-w-0">
            {icon && <span className="shrink-0 mt-0.5 leading-none">{icon}</span>}
            <span className="flex-1 min-w-0 text-sm leading-snug break-words">
              {resolveValue(message, t)}
            </span>
            {t.type !== 'loading' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toast.dismiss(t.id);
                }}
                className="app-toast-dismiss shrink-0 -mr-0.5 -mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition"
                aria-label="Dismiss notification"
              >
                <FaIcon icon="fa-xmark" className="text-xs" />
              </button>
            )}
          </div>
        )}
      </ToastBar>
    </div>
  );
}

/**
 * Global toast host — every notification sits on top-right below site header,
 * supports right swipe to close, and clear dismiss (×) control.
 */
export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      containerClassName="app-toaster"
      gutter={8}
      toastOptions={{
        className:
          'app-toast glass-card !bg-white/95 !backdrop-blur-xl !border-slate-200/80 !text-slate-800 !shadow-lg !rounded-xl',
        style: {
          padding: '10px 12px',
          maxWidth: 'min(24rem, calc(100vw - 2.5rem))',
        },
      }}
    >
      {(t) => <SwipeableToastItem toast={t} />}
    </Toaster>
  );
}
