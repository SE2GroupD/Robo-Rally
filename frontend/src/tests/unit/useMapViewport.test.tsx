import { act, render, renderHook } from '@testing-library/react';
import { useLayoutEffect, type KeyboardEvent, type PointerEvent, type WheelEvent } from 'react';
import { useMapViewport } from '../../features/game/hooks/useMapViewport';

function setupViewport() {
  const hook = renderHook(() => useMapViewport());
  const element = document.createElement('section');
  element.setPointerCapture = vi.fn();
  element.hasPointerCapture = vi.fn().mockReturnValue(true);
  element.releasePointerCapture = vi.fn();
  hook.result.current.viewportRef.current = element;
  const pointer = (values: Partial<PointerEvent<HTMLElement>> = {}) =>
    ({
      currentTarget: element,
      button: 0,
      isPrimary: true,
      pointerId: 1,
      clientX: 100,
      clientY: 100,
      ...values,
    }) as PointerEvent<HTMLElement>;
  return { ...hook, element, pointer };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('zooms in tenths to exact limits and preserves scroll position proportionally', () => {
  let pending: FrameRequestCallback = () => {};
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    pending = callback;
    return 1;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  const { result, element } = setupViewport();
  element.scrollLeft = 200;
  element.scrollTop = 100;
  act(() => result.current.onZoomIn());
  act(() => pending(0));
  expect(result.current.scale).toBe(1.1);
  expect(element.scrollLeft).toBeCloseTo(220);
  expect(element.scrollTop).toBeCloseTo(110);
  for (let index = 0; index < 15; index++) act(() => result.current.onZoomIn());
  expect(result.current.scale).toBe(2);
  expect(result.current.canZoomIn).toBe(false);
  for (let index = 0; index < 20; index++) act(() => result.current.onZoomOut());
  expect(result.current.scale).toBe(0.5);
  expect(result.current.canZoomOut).toBe(false);
});

it('smoothly batches Ctrl/Cmd + wheel or trackpad pinch input and preserves plain scrolling', () => {
  let pending: FrameRequestCallback = () => {};
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    pending = callback;
    return 1;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  const { result, element } = setupViewport();
  const wheel = (values: Partial<WheelEvent<HTMLElement>> = {}) =>
    ({
      currentTarget: element,
      deltaY: -10,
      deltaMode: 0,
      ctrlKey: true,
      metaKey: false,
      preventDefault: vi.fn(),
      ...values,
    }) as WheelEvent<HTMLElement>;

  const pinch = wheel();
  act(() => result.current.onWheel(pinch));
  act(() => result.current.onWheel(wheel()));
  act(() => pending(0));
  expect(pinch.preventDefault).toHaveBeenCalledOnce();
  expect(result.current.scale).toBe(1.016);

  const plainScroll = wheel({ ctrlKey: false, metaKey: false });
  act(() => result.current.onWheel(plainScroll));
  expect(plainScroll.preventDefault).not.toHaveBeenCalled();
  expect(result.current.scale).toBe(1.016);

  const cmdWheel = wheel({ deltaY: 20, ctrlKey: false, metaKey: true });
  act(() => result.current.onWheel(cmdWheel));
  act(() => pending(0));
  expect(result.current.scale).toBe(1);
});

it('keeps the point under the cursor fixed while zooming', () => {
  const callbacks: FrameRequestCallback[] = [];
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    callbacks.push(callback);
    return callbacks.length;
  });
  const { result, element } = setupViewport();
  Object.defineProperty(element, 'clientWidth', { value: 400 });
  Object.defineProperty(element, 'clientHeight', { value: 300 });
  element.scrollLeft = 200;
  element.scrollTop = 100;

  act(() =>
    result.current.onWheel({
      currentTarget: element,
      clientX: 50,
      clientY: 75,
      deltaY: -10,
      deltaMode: 0,
      ctrlKey: true,
      metaKey: false,
      preventDefault: vi.fn(),
    } as unknown as WheelEvent<HTMLElement>),
  );
  act(() => callbacks.shift()?.(0));
  act(() => callbacks.shift()?.(0));

  expect(element.scrollLeft).toBeCloseTo(200.4);
  expect(element.scrollTop).toBeCloseTo(100.2);
});

it('ignores secondary buttons and non-primary pointers', () => {
  const { result, element, pointer } = setupViewport();
  act(() => result.current.onPointerDown(pointer({ button: 2 })));
  act(() => result.current.onPointerDown(pointer({ isPrimary: false })));
  act(() => result.current.onPointerMove(pointer({ clientX: 20 })));
  expect(element.setPointerCapture).not.toHaveBeenCalled();
  expect(result.current.isDragging).toBe(false);
  expect(element.scrollLeft).toBe(0);
});

it.each(['onPointerUp', 'onPointerCancel', 'onLostPointerCapture'] as const)('pans and cleans up on %s', (handler) => {
  const { result, element, pointer } = setupViewport();
  element.scrollLeft = 200;
  element.scrollTop = 300;
  act(() => result.current.onPointerDown(pointer()));
  expect(element.setPointerCapture).toHaveBeenCalledWith(1);
  expect(result.current.isDragging).toBe(true);
  act(() => result.current.onPointerMove(pointer({ clientX: 80, clientY: 60 })));
  expect(element.scrollLeft).toBe(220);
  expect(element.scrollTop).toBe(340);
  act(() => result.current[handler](pointer()));
  expect(result.current.isDragging).toBe(false);
  expect(element.releasePointerCapture).toHaveBeenCalledWith(1);
  act(() => result.current.onPointerMove(pointer({ clientX: 10 })));
  expect(element.scrollLeft).toBe(220);
});

it('cancels scheduled zoom work on unmount', () => {
  vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(42);
  const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  const { result, unmount } = setupViewport();
  act(() => result.current.onZoomIn());
  unmount();
  expect(cancel).toHaveBeenCalledWith(42);
});

it('centers the board in its own viewport on mount', () => {
  let element: HTMLElement | null = null;
  function Viewport() {
    const { viewportRef } = useMapViewport();
    return (
      <section
        ref={(node) => {
          viewportRef.current = node;
          element = node;
          if (node)
            Object.defineProperties(node, {
              clientWidth: { value: 600 },
              clientHeight: { value: 400 },
              scrollWidth: { value: 1120 },
              scrollHeight: { value: 920 },
            });
        }}
      />
    );
  }
  render(<Viewport />);
  expect(element!.scrollLeft).toBe(260);
  expect(element!.scrollTop).toBe(260);
});

it('fits the initial board inside the available viewport', () => {
  function Viewport() {
    const { viewportRef, scale } = useMapViewport({ width: 676, height: 520 });
    return (
      <section
        aria-label="Fitted map"
        data-scale={scale}
        ref={(node) => {
          viewportRef.current = node;
          if (node)
            Object.defineProperties(node, {
              clientWidth: { value: 600, configurable: true },
              clientHeight: { value: 400, configurable: true },
              scrollWidth: { value: 1276, configurable: true },
              scrollHeight: { value: 920, configurable: true },
            });
        }}
      />
    );
  }
  const { getByLabelText } = render(<Viewport />);
  expect(Number(getByLabelText('Fitted map').getAttribute('data-scale'))).toBeCloseTo(400 / 520);
});

function fittedViewport() {
  let resize: () => void = () => {};
  const disconnect = vi.fn();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        resize = callback;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
  let width = 1000;
  let height = 800;
  let controls!: ReturnType<typeof useMapViewport>;
  function Viewport() {
    const viewport = useMapViewport({ width: 500, height: 400 });
    const { viewportRef } = viewport;
    useLayoutEffect(() => {
      controls = viewport;
    });
    return (
      <section
        aria-label="Viewport"
        data-scale={viewport.scale}
        ref={(node) => {
          viewportRef.current = node;
          if (node) {
            Object.defineProperties(node, {
              clientWidth: { get: () => width, configurable: true },
              clientHeight: { get: () => height, configurable: true },
            });
            node.setPointerCapture = vi.fn();
          }
        }}
      />
    );
  }
  const view = render(<Viewport />);
  return {
    ...view,
    get controls() {
      return controls;
    },
    disconnect,
    resize(w: number, h: number) {
      width = w;
      height = h;
      act(() => resize());
    },
  };
}

it('enlarges to fit, refits on resize, caps at maximum zoom, and disconnects on unmount', () => {
  const view = fittedViewport();
  expect(view.controls.scale).toBeCloseTo(1.936);
  view.resize(600, 400);
  expect(view.controls.scale).toBe(1);
  view.resize(2400, 1600);
  expect(view.controls.scale).toBe(2);
  view.unmount();
  expect(view.disconnect).toHaveBeenCalledOnce();
});

it.each(['zoom', 'pan', 'scroll', 'keyboard'] as const)(
  'preserves the manual view after %s when the container resizes',
  (action) => {
    const view = fittedViewport();
    const element = view.getByLabelText('Viewport');
    act(() => {
      if (action === 'zoom') view.controls.onZoomOut();
      if (action === 'pan')
        view.controls.onPointerDown({
          currentTarget: element,
          button: 0,
          isPrimary: true,
          pointerId: 1,
          clientX: 20,
          clientY: 20,
        } as PointerEvent<HTMLElement>);
      if (action === 'scroll')
        view.controls.onWheel({ currentTarget: element, deltaY: 20, ctrlKey: false, metaKey: false } as WheelEvent<HTMLElement>);
      if (action === 'keyboard') view.controls.onKeyDown({ key: 'ArrowDown' } as KeyboardEvent<HTMLElement>);
    });
    const scale = view.controls.scale;
    element.scrollLeft = 155;
    element.scrollTop = 90;
    view.resize(600, 400);
    expect(view.controls.scale).toBe(scale);
    expect(element.scrollLeft).toBe(155);
    expect(element.scrollTop).toBe(90);
  },
);
