import { useRef, useCallback } from 'react';

export function useBottomSheet(onClose) {
  const sheetRef = useRef(null);
  const dragState = useRef({ startY: 0, isDragging: false });

  const close = useCallback(() => {
    const sheet = sheetRef.current;
    if (!sheet) { onClose(); return; }
    sheet.style.transition = 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)';
    sheet.style.transform = 'translateY(100%)';
    setTimeout(onClose, 280);
  }, [onClose]);

  const onTouchStart = useCallback((e) => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    dragState.current.startY = e.touches[0].clientY;
    dragState.current.isDragging = true;
    sheet.style.transition = 'none';
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!dragState.current.isDragging) return;
    const sheet = sheetRef.current;
    if (!sheet) return;
    const diff = e.touches[0].clientY - dragState.current.startY;
    if (diff > 0) {
      sheet.style.transform = `translateY(${diff}px)`;
    }
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (!dragState.current.isDragging) return;
    dragState.current.isDragging = false;
    const sheet = sheetRef.current;
    if (!sheet) return;
    const diff = e.changedTouches[0].clientY - dragState.current.startY;
    const sheetHeight = sheet.offsetHeight;
    sheet.style.transition = 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)';
    if (diff > sheetHeight * 0.3 || diff > 100) {
      sheet.style.transform = 'translateY(100%)';
      setTimeout(onClose, 280);
    } else {
      sheet.style.transform = 'translateY(0)';
    }
  }, [onClose]);

  const handleProps = { onTouchStart, onTouchMove, onTouchEnd };

  return { sheetRef, handleProps, close };
}
