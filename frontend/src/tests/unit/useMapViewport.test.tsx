import { act, renderHook } from '@testing-library/react';
import type { PointerEvent } from 'react';
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

afterEach(() => vi.restoreAllMocks());

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
