/* Scrollable map regions need focus for native keyboard scrolling and pointer handlers for panning. */
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions */
import { useMapViewport } from '../../hooks/useMapViewport';
import { MapZoomControls } from './MapZoomControls';
import { cn } from '../../../../utils/cn';
import { GameBoard } from './boards/GameBoard';
import type { AvatarId, Direction, TileData } from '../../types/Board';

export interface MapRobot {
  playerId: string;
  x: number;
  y: number;
  direction: Direction;
  avatarId: AvatarId;
  hue: number;
}

interface MapProps {
  width: number;
  height: number;
  tiles: TileData[];
  robots: MapRobot[];
}

const CELL_PX = 52; // 50px tile + 2px gap

// Merges the live robots into the server's tile list. (Two robots on one tile
// is possible while the backend only clamps at edges; the last one drawn wins.)
function withRobots(tiles: TileData[], robots: MapRobot[]): TileData[] {
  const layout = tiles.map(({ robot: _robot, ...tile }) => tile);
  for (const r of robots) {
    const robotField = { robot: { avatarId: r.avatarId, hue: r.hue, direction: r.direction } };
    const index = layout.findIndex((tile) => tile.x === r.x && tile.y === r.y);
    if (index === -1) layout.push({ x: r.x, y: r.y, ...robotField });
    else layout[index] = { ...layout[index], ...robotField };
  }
  return layout;
}

export function Map({ width, height, tiles, robots }: MapProps) {
  const {
    viewportRef,
    scale,
    isDragging,
    onZoomIn,
    onZoomOut,
    canZoomIn,
    canZoomOut,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture,
    onDragStart,
  } = useMapViewport();

  return (
    <>
      <MapZoomControls onZoomIn={onZoomIn} onZoomOut={onZoomOut} canZoomIn={canZoomIn} canZoomOut={canZoomOut} />
      <section
        ref={viewportRef}
        aria-label="Game map"
        tabIndex={0}
        className={cn(
          'absolute inset-0 touch-none overflow-auto bg-slate-950 focus-visible:outline-2 focus-visible:outline-cyan-300',
          isDragging ? 'cursor-grabbing' : 'cursor-grab',
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onLostPointerCapture={onLostPointerCapture}
        onDragStart={onDragStart}
      >
        <div
          className="relative"
          style={{
            width: `calc(100% + ${width * CELL_PX * scale}px)`,
            height: `calc(100% + ${height * CELL_PX * scale}px)`,
          }}
        >
          <div
            className="absolute min-w-max origin-top-left"
            style={{ left: '50vw', top: '50dvh', transform: `scale(${scale})` }}
          >
            <GameBoard layoutData={withRobots(tiles, robots)} width={width} height={height} />
          </div>
        </div>
      </section>
    </>
  );
}
