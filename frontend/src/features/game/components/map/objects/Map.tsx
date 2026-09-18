import { useState } from 'react';
import { StartBoard } from './StartBoard';
import { GameBoard } from './GameBoard';
import { startboard1Layout, gameboard1Layout, gameboard2Layout, gameboard3Layout } from '../../data/mapLayouts';
import type { BoardId, RobotState, TileData } from '../../types/board';

export function Map() {
  const [scale, setScale] = useState(1);
  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.5));

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
    <div className="relative w-full max-w-[1200px] overflow-auto max-h-[60vh] rounded-xl border-4 border-slate-800 shadow-2xl bg-neutral-900">
      <div className="sticky top-4 right-4 z-50 float-right flex gap-2 bg-black/50 p-2 rounded-lg backdrop-blur-sm">
        <button
          type="button"
          onClick={handleZoomOut}
          className="w-8 h-8 flex items-center justify-center bg-slate-700 text-white rounded hover:bg-slate-600 font-bold"
        >
          -
        </button>
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-8 h-8 flex items-center justify-center bg-slate-700 text-white rounded hover:bg-slate-600 font-bold"
        >
          +
        </button>
      </div>

      <div
        className="flex flex-row items-start justify-center gap-2 p-16 min-w-max origin-top transition-transform duration-200 ease-out"
        style={{ transform: `scale(${scale})` }}
      >
        <div className="mt-[260px]">
          <StartBoard layoutData={startboard1Layout} />
        </div>

        <div className="flex flex-col gap-2">
          <GameBoard layoutData={gameboard1Layout} />
          <GameBoard layoutData={gameboard2Layout} />
        </div>

        <div className="mt-[260px]">
          <GameBoard layoutData={gameboard3Layout} />
        </div>
      </div>
    </div>
  );
}
