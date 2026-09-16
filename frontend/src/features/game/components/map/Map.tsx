/* Scrollable map regions need focus for native keyboard scrolling and pointer handlers for panning. */
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions */
import { useState, useRef, useEffect } from 'react';
import { StartBoard } from './boards/StartBoard';
import { GameBoard } from './boards/GameBoard';
import { startboard1Layout, gameboard1Layout, gameboard2Layout, gameboard3Layout } from '../../data/mapLayouts';
import type { BoardId, RobotState, TileData } from '../../types/board';

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
  const [scale, setScale] = useState(1);
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  useEffect(() => {
    const element = viewport.current;
    if (element) {
      element.scrollLeft = element.clientWidth / 2 - 100;
      element.scrollTop = element.clientHeight / 2 - 60;
    }
  }, []);
  const zoom = (delta: number) => {
    const next = Math.max(0.5, Math.min(2, scale + delta));
    const element = viewport.current;
    if (!element) return;
    const x = element.scrollLeft / scale;
    const y = element.scrollTop / scale;
    setScale(next);
    requestAnimationFrame(() => {
      element.scrollLeft = x * next;
      element.scrollTop = y * next;
    });
  };

  const startboard1Layout: TileData[] = [
    { x: 1, y: 1, robot: { hue: 0, direction: 90 } },
    { x: 2, y: 6, robot: { hue: 300, direction: 90 } },
  ];

  const gameboard1Layout: TileData[] = [{ x: 5, y: 5, checkpointNumber: 1 }];

  const gameboard2Layout: TileData[] = [{ x: 2, y: 2, checkpointNumber: 2 }];

  const gameboard3Layout: TileData[] = [
    { x: 8, y: 8, checkpointNumber: 3 },
    { x: 3, y: 10, checkpointNumber: 4 },
  ];

  return (
    <>
      <div className="absolute right-3 top-3 z-20 flex gap-2 rounded bg-slate-950/90 p-1">
        <button
<<<<<<< HEAD
          onClick={handleZoomOut}
          className="w-8 h-8 flex items-center justify-center bg-slate-700 text-white rounded hover:bg-slate-600 font-bold"
=======
          aria-label="Zoom out"
          type="button"
          onClick={() => zoom(-0.1)}
          className="h-9 w-9 rounded bg-slate-700 text-white focus-visible:outline-2 focus-visible:outline-cyan-300"
>>>>>>> 2525706 (refactor: reorganize folder structure and enhance programming components for better usability)
        >
          −
        </button>
        <button
<<<<<<< HEAD
          onClick={handleZoomIn}
          className="w-8 h-8 flex items-center justify-center bg-slate-700 text-white rounded hover:bg-slate-600 font-bold"
=======
          aria-label="Zoom in"
          type="button"
          onClick={() => zoom(0.1)}
          className="h-9 w-9 rounded bg-slate-700 text-white focus-visible:outline-2 focus-visible:outline-cyan-300"
>>>>>>> 2525706 (refactor: reorganize folder structure and enhance programming components for better usability)
        >
          +
        </button>
      </div>
<<<<<<< HEAD

      <div
        className="flex flex-row items-start justify-center gap-2 p-16 min-w-max origin-top transition-transform duration-200 ease-out"
        style={{ transform: `scale(${scale})` }}
=======
      <section
        ref={viewport}
        aria-label="Game map"
        tabIndex={0}
        className="absolute inset-0 touch-none overflow-auto bg-slate-950 focus-visible:outline-2 focus-visible:outline-cyan-300"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          const element = event.currentTarget;
          drag.current = { x: event.clientX, y: event.clientY, left: element.scrollLeft, top: element.scrollTop };
          element.setPointerCapture(event.pointerId);
          element.style.cursor = 'grabbing';
        }}
        onPointerMove={(event) => {
          if (drag.current) {
            event.currentTarget.scrollLeft = drag.current.left - (event.clientX - drag.current.x);
            event.currentTarget.scrollTop = drag.current.top - (event.clientY - drag.current.y);
          }
        }}
        onPointerUp={(event) => {
          drag.current = null;
          event.currentTarget.releasePointerCapture(event.pointerId);
          event.currentTarget.style.cursor = 'grab';
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onLostPointerCapture={() => {
          drag.current = null;
        }}
        onDragStart={(event) => event.preventDefault()}
>>>>>>> 2525706 (refactor: reorganize folder structure and enhance programming components for better usability)
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
