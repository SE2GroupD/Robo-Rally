import type { Direction, TileData } from '../../../types/Board';
import { Robot } from '../objects/Robot';
import { Checkpoint } from '../objects/Checkpoint';
import steelTileImage from '../../../../../assets/steel.png';
import conveyorImage from '../../../../../assets/objects/conveyor1.png';
import expressConveyorImage from '../../../../../assets/objects/conveyor2.png';
import gearRightImage from '../../../../../assets/objects/gearRight.png';
import gearLeftImage from '../../../../../assets/objects/gearLeft.png';

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

// Both conveyor images point east before rotation.
const CONVEYOR_ROTATION: Record<Direction, number> = { NORTH: 270, EAST: 0, SOUTH: 90, WEST: 180 };

const ARROWS: Record<Direction, string> = { NORTH: '↑', EAST: '→', SOUTH: '↓', WEST: '←' };

interface TileProps {
  tile: TileData;
}

export function Tile({ tile }: TileProps) {
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
        <div className="absolute z-10 w-6 h-6 rounded-full border-2 border-dashed border-gray-400 bg-black/40 flex items-center justify-center text-white text-[10px]">
          ⚙️
        </div>
      )}

      {tile.gear && (
        <img
          src={tile.gear === 'CLOCKWISE' ? gearRightImage : gearLeftImage}
          alt={tile.gear === 'CLOCKWISE' ? 'Gear turning right (clockwise)' : 'Gear turning left (counterclockwise)'}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {tile.conveyor && (
        <img
          src={tile.conveyor.isExpress ? expressConveyorImage : conveyorImage}
          alt={`${tile.conveyor.isExpress ? 'Express' : 'Regular'} conveyor ${tile.conveyor.direction.toLowerCase()}`}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ transform: `rotate(${CONVEYOR_ROTATION[tile.conveyor.direction]}deg)` }}
        />
      )}

      {tile.pushPanel && (
        <figure
          aria-label={`Push panel ${tile.pushPanel.direction.toLowerCase()}, registers ${tile.pushPanel.activeRegisters.join(', ')}`}
          className="absolute z-10 flex flex-col items-center font-black leading-none text-orange-400"
        >
          <span className="text-xl">{ARROWS[tile.pushPanel.direction]}</span>
          <span className="text-[9px]">{tile.pushPanel.activeRegisters.join('')}</span>
        </figure>
      )}

      <div className="relative z-30 flex w-full h-full items-center justify-center">
        {tile.robot ? (
          <Robot avatarId={tile.robot.avatarId || 1} rotation={getRotationDegrees(tile.robot.direction)} />
        ) : tile.checkpointNumber !== undefined ? (
          <Checkpoint num={tile.checkpointNumber} />
        ) : null}
      </div>
    </div>
  );
}
