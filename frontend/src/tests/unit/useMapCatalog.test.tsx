import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useMapCatalog } from '../../features/game/hooks/useMapCatalog';
import { fetchMaps } from '../../features/game/api/gameApi';
import { defaultMapLayout } from '../fixtures/mapLayouts';

vi.mock('../../features/game/api/gameApi', () => ({ fetchMaps: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

it('loads once, supports retry and aborts on unmount', async () => {
  vi.mocked(fetchMaps).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([defaultMapLayout]);
  const { result, rerender, unmount } = renderHook(() => useMapCatalog());

  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.error).toContain('Could not load maps'));
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.maps).toEqual([defaultMapLayout]));
  rerender();
  expect(fetchMaps).toHaveBeenCalledTimes(2);
  const signal = vi.mocked(fetchMaps).mock.calls[1][0];
  unmount();
  expect(signal?.aborted).toBe(true);
});
