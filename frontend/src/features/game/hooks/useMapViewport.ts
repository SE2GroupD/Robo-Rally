import { useEffect, useRef, useState, type DragEvent, type PointerEvent } from 'react';

const MIN_SCALE = 0.5;
const MAX_SCALE = 2;
const ZOOM_STEP = 0.1;

interface DragPosition {
  pointerId: number;
  x: number;
  y: number;
  left: number;
  top: number;
}

export function useMapViewport() {
  const viewportRef = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const drag = useRef<DragPosition | null>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const element = viewportRef.current;
    if (element) {
      element.scrollLeft = element.clientWidth / 2 - 100;
      element.scrollTop = element.clientHeight / 2 - 60;
    }
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);

  const zoom = (delta: number) => {
    // Round to tenths so both limits can be reached exactly.
    const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.round((scale + delta) * 10) / 10));
    const element = viewportRef.current;
    if (!element || next === scale) return;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    const x = element.scrollLeft / scale;
    const y = element.scrollTop / scale;
    setScale(next);
    frame.current = requestAnimationFrame(() => {
      element.scrollLeft = x * next;
      element.scrollTop = y * next;
      frame.current = null;
    });
  };

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || !event.isPrimary || drag.current) return;
    const element = event.currentTarget;
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: element.scrollLeft,
      top: element.scrollTop,
    };
    element.setPointerCapture(event.pointerId);
    setIsDragging(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    event.currentTarget.scrollLeft = drag.current.left - (event.clientX - drag.current.x);
    event.currentTarget.scrollTop = drag.current.top - (event.clientY - drag.current.y);
  };

  const endDrag = (event: PointerEvent<HTMLElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    drag.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onDragStart = (event: DragEvent<HTMLElement>) => event.preventDefault();

  return {
    viewportRef,
    scale,
    isDragging,
    canZoomIn: scale < MAX_SCALE,
    canZoomOut: scale > MIN_SCALE,
    onZoomIn: () => zoom(ZOOM_STEP),
    onZoomOut: () => zoom(-ZOOM_STEP),
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onLostPointerCapture: endDrag,
    onDragStart,
  };
}
