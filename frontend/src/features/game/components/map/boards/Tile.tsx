import type { Direction, TileData } from '../../../types/Board';
import { Robot } from '../objects/Robot';
import { Checkpoint } from '../objects/Checkpoint';
import steelTileImage from '../../../../../assets/steel.png';

const getRotationDegrees = (dir: Direction): number => {
  // Adjusted for the new South-facing SVG avatars
  switch (dir) {
    case 'SOUTH':
      return 0;
    case 'WEST':
      return 90;
    case 'NORTH':
      return 180;
    case 'EAST':
      return 270;
    default:
      return 0;
  }
};

interface TileProps {
  tile: TileData;
  currentPlayerId?: string;
  onTileClick?: (x: number, y: number) => void;
}

export function Tile({ tile, currentPlayerId, onTileClick }: TileProps) {
  return (
    <div className="relative w-12.5 h-12.5 border border-[#555] text-black flex items-center justify-center overflow-hidden">
      {tile.hasPit ? (
        <div className="absolute inset-0 bg-neutral-950 w-full h-full" />
      ) : (
        <img src={steelTileImage} alt="Steel Tile" className="absolute inset-0 w-full h-full object-cover" />
      )}

      {tile.walls?.north && <div className="absolute top-0 left-0 right-0 h-1.25 bg-yellow-400 z-20 shadow-md" />}
      {tile.walls?.east && <div className="absolute top-0 right-0 bottom-0 w-1.25 bg-yellow-400 z-20 shadow-md" />}
      {tile.walls?.south && <div className="absolute bottom-0 left-0 right-0 h-1.25 bg-yellow-400 z-20 shadow-md" />}
      {tile.walls?.west && <div className="absolute top-0 left-0 bottom-0 w-1.25 bg-yellow-400 z-20 shadow-md" />}

      {tile.hasAntenna && (
        <div className="absolute z-10 w-7 h-7 rounded-full bg-emerald-500 border border-white flex items-center justify-center shadow-lg text-xs">
          📡
        </div>
      )}

      {tile.isSpawnPoint && (
        <div
          onClick={() => {
            if (onTileClick && !tile.occupyingPlayerId) {
              onTileClick(tile.x, tile.y);
            }
          }}
          className={`absolute z-10 w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center text-[10px] transition-colors
            ${
              onTileClick
                ? tile.occupyingPlayerId === currentPlayerId
                  ? 'border-emerald-500 bg-emerald-500/40 text-emerald-200'
                  : tile.occupyingPlayerId
                    ? 'border-red-500 bg-red-500/40 text-red-200 cursor-not-allowed'
                    : 'border-gray-400 bg-black/40 text-white cursor-pointer hover:border-white hover:bg-white/20'
                : 'border-gray-400 bg-black/40 text-gray-300 cursor-default'
            }`}
        >
          {onTileClick ? (tile.occupyingPlayerId === currentPlayerId ? '✓' : tile.occupyingPlayerId ? '✗' : '⚙️') : '⚙️'}
        </div>
      )}

      {tile.gear === 'CLOCKWISE' && <div className="absolute z-10 text-emerald-500 text-2xl font-black">↻</div>}
      {tile.gear === 'COUNTER_CLOCKWISE' && <div className="absolute z-10 text-red-500 text-2xl font-black">↺</div>}

      {tile.conveyor && (
        <div className={`absolute z-10 font-black text-2xl ${tile.conveyor.isExpress ? 'text-blue-500' : 'text-green-500'}`}>
          {tile.conveyor.direction === 'NORTH' && '↑'}
          {tile.conveyor.direction === 'EAST' && '→'}
          {tile.conveyor.direction === 'SOUTH' && '↓'}
          {tile.conveyor.direction === 'WEST' && '←'}
        </div>
      )}

      <div className="relative z-30 flex w-full h-full items-center justify-center pointer-events-none">
        {tile.robot ? (
          <Robot avatarId={tile.robot.avatarId || 1} rotation={getRotationDegrees(tile.robot.direction)} />
        ) : tile.checkpointNumber !== undefined ? (
          <Checkpoint num={tile.checkpointNumber} />
        ) : null}
      </div>
    </div>
  );
}
