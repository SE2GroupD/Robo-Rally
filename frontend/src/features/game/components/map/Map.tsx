import { useState } from 'react';
import { StartBoard } from './StartBoard';
import { GameBoard } from './GameBoard';
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
  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.5));

  return (
    <div className="relative w-full max-w-[1200px] overflow-auto max-h-[60vh] rounded-xl border-4 border-slate-800 shadow-2xl bg-neutral-900">
      <div className="sticky top-4 right-4 z-50 float-right flex gap-2 bg-black/50 p-2 rounded-lg backdrop-blur-sm">
        <button
          type="button"
          onClick={handleZoomOut}
          className="w-8 h-8 flex items-center justify-center bg-slate-700 text-white rounded font-bold"
        >
          -
        </button>
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-8 h-8 flex items-center justify-center bg-slate-700 text-white rounded font-bold"
        >
          +
        </button>
      </div>

      <div
        className="flex flex-row items-start justify-center gap-[2px] p-16 min-w-max origin-top transition-transform duration-200 ease-out"
        style={{ transform: `scale(${scale})` }}
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
  );
}
