/* Scrollable map regions need focus for native keyboard scrolling and pointer handlers for panning. */
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions */
import { useMapViewport } from '../../hooks/useMapViewport';
import { MapZoomControls } from './MapZoomControls';
import { cn } from '../../../../utils/cn';
import { StartBoard } from './boards/StartBoard';
import { GameBoard } from './boards/GameBoard';
import { startboard1Layout, gameboard1Layout, gameboard2Layout, gameboard3Layout } from '../../data/mapLayouts';
import type { BoardId, RobotState, TileData } from '../../types/Board';

interface MapProps {
  robot?: RobotState;
}

// Merges the live robot position into a board's static layout, replacing
// whatever `robot` field it may already have (or adding a tile for it).
function withRobot(layout: TileData[], robot: RobotState | undefined, boardId: BoardId): TileData[] {
  const withoutRobot = layout.map(({ robot: _robot, ...tile }) => tile);
  if (!robot || robot.board !== boardId) return withoutRobot;

  const robotField = { robot: { hue: robot.hue, direction: robot.direction } };
  const index = withoutRobot.findIndex((tile) => tile.x === robot.x && tile.y === robot.y);
  if (index === -1) {
    return [...withoutRobot, { x: robot.x, y: robot.y, ...robotField }];
  }

  const merged = [...withoutRobot];
  merged[index] = { ...merged[index], ...robotField };
  return merged;
}

export function Map({ robot }: MapProps) {
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
        <div className="relative" style={{ width: `calc(100% + ${1196 * scale}px)`, height: `calc(100% + ${1040 * scale}px)` }}>
          <div
            className="flex flex-row items-start justify-center gap-[2px] absolute min-w-max origin-top-left"
            style={{ left: '50vw', top: '50dvh', transform: `scale(${scale})` }}
          >
            <div className="mt-[260px]">
              <StartBoard layoutData={withRobot(startboard1Layout, robot, 'start')} />
            </div>

            <div className="flex flex-col gap-[2px]">
              <GameBoard layoutData={withRobot(gameboard1Layout, robot, 'game1')} />
              <GameBoard layoutData={withRobot(gameboard2Layout, robot, 'game2')} />
            </div>

            <div className="mt-[260px]">
              <GameBoard layoutData={withRobot(gameboard3Layout, robot, 'game3')} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
