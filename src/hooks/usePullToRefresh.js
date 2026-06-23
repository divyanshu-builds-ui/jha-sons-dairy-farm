import { useState, useEffect, useRef, useCallback } from 'react';

export function usePullToRefresh(onRefresh) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const pullRef = useRef(0);
  const THRESHOLD = 80;
  const DEAD_ZONE = 50;
  const DAMPENING = 0.4;
  const MAX_PULL = 160;

  const refreshFn = useCallback(() => {
    if (onRefresh) onRefresh();
    else window.location.reload();
  }, [onRefresh]);

  useEffect(() => {
    let startY = 0;
    let isPulling = false;
    let activated = false;
    let animFrame = null;

    const onTouchStart = (e) => {
      // Only start if at very top of page and not inside a scrollable container
      if (window.scrollY > 0) return;
      const el = e.target;
      // Don't trigger inside modals or scrollable containers
      if (el.closest('[data-no-pull]') || el.closest('.overflow-y-auto') || el.closest('.overflow-x-auto')) return;
      startY = e.touches[0].clientY;
      isPulling = true;
      activated = false;
    };

    const onTouchMove = (e) => {
      if (!isPulling) return;
      // If page scrolled during move, abort
      if (window.scrollY > 0) {
        isPulling = false;
        activated = false;
        setPulling(false);
        setPullDistance(0);
        return;
      }
      const diff = e.touches[0].clientY - startY;
      // Must cross dead zone before activating
      if (diff > DEAD_ZONE) {
        const activeDiff = diff - DEAD_ZONE;
        const dist = Math.min(activeDiff * DAMPENING, MAX_PULL);
        pullRef.current = dist;
        if (animFrame) cancelAnimationFrame(animFrame);
        animFrame = requestAnimationFrame(() => {
          setPullDistance(dist);
          setPulling(true);
        });
        activated = true;
        e.preventDefault();
      } else if (diff <= 0) {
        // Scrolling up — cancel
        isPulling = false;
        activated = false;
        setPulling(false);
        setPullDistance(0);
      }
    };

    const onTouchEnd = () => {
      if (!activated) { isPulling = false; return; }
      if (pullRef.current >= THRESHOLD) {
        setPullDistance(THRESHOLD);
        setTimeout(() => {
          refreshFn();
          pullRef.current = 0;
          setPulling(false);
          setPullDistance(0);
        }, 100);
      } else {
        // Didn't reach threshold — snap back
        pullRef.current = 0;
        setPulling(false);
        setPullDistance(0);
      }
      isPulling = false;
      activated = false;
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [refreshFn]);

  return { pulling, pullDistance, threshold: THRESHOLD };
}
