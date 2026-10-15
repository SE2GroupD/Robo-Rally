import type { Direction, TileData } from '../../../types/Board';
import { Robot } from '../objects/Robot';
import { Checkpoint } from '../objects/Checkpoint';
import steelTileImage from '../../../../../assets/steel.png';
import { Conveyor } from '../objects/Conveyor';
import { Gear } from '../objects/Gear';
import { SpawnPoint } from '../objects/SpawnPoint';
import { PushPanel } from '../objects/PushPanel';
import { Antenna } from '../objects/Antenna';
import { Walls } from '../objects/Walls';

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
}

export function Tile({ tile }: TileProps) {
  return (
    <div className="relative w-12.5 h-12.5 border border-[#555] text-black flex items-center justify-center overflow-hidden">
      {tile.hasPit ? (
        <div className="absolute inset-0 bg-neutral-950 w-full h-full" />
      ) : (
        <img src={steelTileImage} alt="Steel Tile" className="absolute inset-0 w-full h-full object-cover" />
      )}

      {tile.walls && <Walls walls={tile.walls} />}

      {tile.hasAntenna && <Antenna />}

      {tile.isSpawnPoint && <SpawnPoint />}

      {tile.gear && <Gear rotation={tile.gear} />}

      {tile.conveyor && <Conveyor {...tile.conveyor} />}

      {tile.pushPanel && <PushPanel {...tile.pushPanel} />}

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
