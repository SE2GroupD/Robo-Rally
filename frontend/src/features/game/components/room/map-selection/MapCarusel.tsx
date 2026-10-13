import { memo, useRef, type ReactNode } from 'react';
import type { MapLayoutData } from '../../../types/MapLayout';
import { mapBounds, TILE_GAP, TILE_PITCH } from '../../../data/boardGeometry';
import { MapLayout } from '../../map/MapLayout';

export const MapPreview = memo(function MapPreview({ layout }: { layout: MapLayoutData }) {
  const bounds = mapBounds(layout.boards);
  const width = bounds.width * TILE_PITCH - TILE_GAP;
  const height = bounds.height * TILE_PITCH - TILE_GAP;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="block w-full" aria-hidden="true">
      <foreignObject width={width} height={height}>
        <MapLayout layout={layout} />
      </foreignObject>
    </svg>
  );
});

interface MapCaruselProps {
  children?: ReactNode;
  maps: MapLayoutData[];
  selectedId: string;
  disabled: boolean;
  onSelect: (id: string) => void;
}

export function MapCarusel({ maps, selectedId, disabled, onSelect, children }: MapCaruselProps) {
  const pointerStart = useRef<number | null>(null);
  const index = maps.findIndex((map) => map.id === selectedId);

  if (index < 0) return <output>The selected map is unavailable.</output>;

  const move = (delta: number) => {
    if (!disabled && maps.length > 1) onSelect(maps[(index + delta + maps.length) % maps.length].id!);
  };

  const slots = maps.length === 1 ? [0] : maps.length === 2 ? [0, 1] : [-1, 0, 1];

  return (
    // Carousel arrow-key and swipe handlers complement the native navigation buttons.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <section
      aria-roledescription="carousel"
      aria-label="Race maps"
      tabIndex={disabled || maps.length < 2 ? undefined : 0}
      className="overflow-hidden rounded bg-black/20 p-3 focus-visible:outline-2 focus-visible:outline-hazard"
      style={{ touchAction: 'pan-y' }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          move(event.key === 'ArrowLeft' ? -1 : 1);
        }
      }}
      onPointerDown={(event) => {
        pointerStart.current = event.clientX;
      }}
      onPointerCancel={() => {
        pointerStart.current = null;
      }}
      onPointerUp={(event) => {
        if (pointerStart.current !== null && Math.abs(event.clientX - pointerStart.current) > 40) {
          move(event.clientX < pointerStart.current ? 1 : -1);
        }
        pointerStart.current = null;
      }}
    >
      <div className="relative mx-auto flex items-center justify-center py-3">
        {slots.map((offset) => {
          const map = maps[(index + offset + maps.length) % maps.length];

          return (
            <div
              key={offset}
              aria-hidden={offset !== 0}
              className={
                offset === 0
                  ? 'relative z-10 w-3/4 max-w-lg border-2 border-hazard bg-slate-950 p-2'
                  : `pointer-events-none absolute w-1/2 max-w-sm opacity-40 ${offset < 0 ? '-left-1/4' : '-right-1/4'}`
              }
            >
              <div className="relative">
                <MapPreview layout={map} />
                {offset === 0 && children}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4">
        {maps.length > 1 && (
          <button
            type="button"
            aria-label="Previous map"
            disabled={disabled}
            onClick={() => move(-1)}
            className="min-h-11 min-w-11 rounded border border-metal-light disabled:opacity-40"
          >
            ←
          </button>
        )}
        <p aria-live="polite" className="m-0 text-center font-bold">
          {maps[index].name}
          {maps.length > 1 && (
            <span className="block text-sm font-normal text-text-muted">
              {index + 1} / {maps.length}
            </span>
          )}
        </p>
        {maps.length > 1 && (
          <button
            type="button"
            aria-label="Next map"
            disabled={disabled}
            onClick={() => move(1)}
            className="min-h-11 min-w-11 rounded border border-metal-light disabled:opacity-40"
          >
            →
          </button>
        )}
      </div>
    </section>
  );
}
