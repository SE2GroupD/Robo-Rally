/* Scrollable map regions need focus for native keyboard scrolling and pointer handlers for panning. */
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions */
import { useMapViewport } from '../../hooks/useMapViewport';
import { MapZoomControls } from './MapZoomControls';
import { cn } from '../../../../utils/cn';
import { MapLayout } from './MapLayout';
import type { MapLayoutData } from '../../types/MapLayout';
import { TileGrid } from './boards/TileGrid';
import { TILE_PITCH } from '../../data/boardGeometry';
import type { AvatarId, Direction, TileData } from '../../types/Board';

export interface MapRobot {
  playerId: string;
  x: number;
  y: number;
  direction: Direction;
  avatarId: AvatarId;
  hue: number;
  isCurrentPlayer?: boolean;
}

interface MapProps {
  layout?: MapLayoutData;
  width: number;
  height: number;
  tiles: TileData[];
  robots: MapRobot[];
  currentPlayerId?: string;
}

const CELL_PX = TILE_PITCH;

function withRobots(tiles: TileData[], robots: MapRobot[], currentPlayerId?: string): TileData[] {
  const layout = tiles.map(({ robot: _robot, ...tile }) => tile);
  for (const robot of robots) {
    const robotField = {
      robot: {
        avatarId: robot.avatarId,
        hue: robot.hue,
        direction: robot.direction,
        isCurrentPlayer: robot.playerId === currentPlayerId,
      },
    };
    const index = layout.findIndex((tile) => tile.x === robot.x && tile.y === robot.y);
    if (index === -1) layout.push({ x: robot.x, y: robot.y, ...robotField });
    else layout[index] = { ...layout[index], ...robotField };
  }
  return layout;
}

export function Map({ width, height, tiles, robots, layout, currentPlayerId }: MapProps) {
  const {
    viewportRef,
    scale,
    isDragging,
    onZoomIn,
    onZoomOut,
    canZoomIn,
    canZoomOut,
    onKeyDown,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture,
    onDragStart,
  } = useMapViewport({ width: width * CELL_PX, height: height * CELL_PX });

  const robotsWithCurrentPlayer = robots.map((robot) => ({
    ...robot,
    isCurrentPlayer: robot.playerId === currentPlayerId,
  }));

  return (
    <>
      <MapZoomControls onZoomIn={onZoomIn} onZoomOut={onZoomOut} canZoomIn={canZoomIn} canZoomOut={canZoomOut} />
      <section
        ref={viewportRef}
        aria-label="Game map"
        tabIndex={0}
        className={cn(
          '@container-size absolute inset-x-0 bottom-0 top-9 touch-none overflow-auto bg-factory-bg focus-visible:outline-2 focus-visible:outline-cyan-300',
          isDragging ? 'cursor-grabbing' : 'cursor-grab',
        )}
        onKeyDown={onKeyDown}
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
            style={{ left: '50cqw', top: '50cqh', transform: `scale(${scale})` }}
          >
            {layout ? (
              <MapLayout layout={layout} robots={robotsWithCurrentPlayer} />
            ) : (
              <TileGrid layoutData={withRobots(tiles, robots, currentPlayerId)} width={width} height={height} />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
