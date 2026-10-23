import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type PointerEvent,
  type WheelEvent,
} from 'react';

const MIN_SCALE = 0.5;
const MAX_SCALE = 2;
const ZOOM_STEP = 0.1;
const WHEEL_ZOOM_SENSITIVITY = 0.0008;

interface DragPosition {
  pointerId: number;
  x: number;
  y: number;
  left: number;
  top: number;
}

interface FocalPoint {
  x: number;
  y: number;
}

type ZoomWheelEvent = Pick<
  WheelEvent<HTMLElement>,
  'clientX' | 'clientY' | 'ctrlKey' | 'metaKey' | 'deltaY' | 'deltaMode' | 'preventDefault' | 'currentTarget'
>;

export function useMapViewport(boardSize?: { width: number; height: number }) {
  const initialBoardSize = useRef(boardSize);
  const viewportRef = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const scaleRef = useRef(1);
  const drag = useRef<DragPosition | null>(null);
  const manualView = useRef(false);
  const scrollFrame = useRef<number | null>(null);
  const wheelFrame = useRef<number | null>(null);
  const pendingWheelDelta = useRef(0);
  const pendingWheelFocalPoint = useRef<FocalPoint | null>(null);

  useEffect(() => {
    const cancelFrames = () => {
      if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
      if (wheelFrame.current !== null) cancelAnimationFrame(wheelFrame.current);
    };
    const element = viewportRef.current;
    if (!element) return cancelFrames;
    const board = initialBoardSize.current;
    const fitBoard = () => {
      if (manualView.current) return;
      if (!board) {
        element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2;
        element.scrollTop = (element.scrollHeight - element.clientHeight) / 2;
        return;
      }
      if (!element.clientWidth || !element.clientHeight) return;
      const fit = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, (element.clientWidth - 32) / board.width, element.clientHeight / board.height),
      );
      scaleRef.current = fit;
      setScale(fit);
      if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
      scrollFrame.current = requestAnimationFrame(() => {
        if (!manualView.current) {
          element.scrollLeft = (board.width * fit) / 2;
          element.scrollTop = (board.height * fit) / 2;
        }
        scrollFrame.current = null;
      });
    };
    fitBoard();
    const observer = board && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fitBoard) : undefined;
    observer?.observe(element);
    return () => {
      observer?.disconnect();
      cancelFrames();
    };
  }, []);

  const setZoom = useCallback((requestedScale: number, focalPoint?: FocalPoint) => {
    manualView.current = true;
    const previous = scaleRef.current;
    const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.round(requestedScale * 1000) / 1000));
    const element = viewportRef.current;
    if (!element || next === previous) return;
    if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
    const focal = focalPoint ?? { x: element.clientWidth / 2, y: element.clientHeight / 2 };
    const x = (element.scrollLeft + focal.x - element.clientWidth / 2) / previous;
    const y = (element.scrollTop + focal.y - element.clientHeight / 2) / previous;
    scaleRef.current = next;
    setScale(next);
    scrollFrame.current = requestAnimationFrame(() => {
      element.scrollLeft = x * next + element.clientWidth / 2 - focal.x;
      element.scrollTop = y * next + element.clientHeight / 2 - focal.y;
      scrollFrame.current = null;
    });
  }, []);

  const zoom = useCallback((delta: number) => setZoom(scaleRef.current + delta), [setZoom]);

  const onWheel = useCallback(
    (event: ZoomWheelEvent) => {
      if (event.deltaY !== 0) manualView.current = true;
      // Ctrl/Cmd + wheel is deliberate mouse zoom; browsers also expose trackpad
      // pinch gestures as ctrl-wheel events. Plain wheel input remains available
      // for scrolling around the board.
      if ((!event.ctrlKey && !event.metaKey) || event.deltaY === 0) return;

      event.preventDefault();
      const deltaMultiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? event.currentTarget.clientHeight : 1;
      pendingWheelDelta.current += event.deltaY * deltaMultiplier;
      const bounds = event.currentTarget.getBoundingClientRect();
      pendingWheelFocalPoint.current = {
        x: Number.isFinite(event.clientX) ? event.clientX - bounds.left : event.currentTarget.clientWidth / 2,
        y: Number.isFinite(event.clientY) ? event.clientY - bounds.top : event.currentTarget.clientHeight / 2,
      };
      if (wheelFrame.current !== null) return;

      wheelFrame.current = requestAnimationFrame(() => {
        const factor = Math.exp(-pendingWheelDelta.current * WHEEL_ZOOM_SENSITIVITY);
        const focalPoint = pendingWheelFocalPoint.current ?? undefined;
        pendingWheelDelta.current = 0;
        pendingWheelFocalPoint.current = null;
        wheelFrame.current = null;
        setZoom(scaleRef.current * factor, focalPoint);
      });
    },
    [setZoom],
  );

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    // React's delegated wheel listener cannot reliably cancel browser Ctrl/Cmd
    // zoom in every browser. A non-passive listener on the map can.
    const handleNativeWheel = (event: globalThis.WheelEvent) => {
      onWheel({
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        clientX: event.clientX,
        clientY: event.clientY,
        deltaY: event.deltaY,
        deltaMode: event.deltaMode,
        preventDefault: () => event.preventDefault(),
        currentTarget: element,
      });
    };

    element.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleNativeWheel);
  }, [onWheel]);

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || !event.isPrimary || drag.current) return;
    manualView.current = true;
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

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key))
      manualView.current = true;
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
    onWheel,
    onKeyDown,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onLostPointerCapture: endDrag,
    onDragStart,
  };
}
