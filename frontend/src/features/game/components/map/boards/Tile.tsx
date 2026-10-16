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
  switch (dir) {
    case 'SOUTH':
      return 0;
    case 'WEST':
      return 90;
    case 'NORTH':
      return 180;
    case 'EAST':
      return 270;
  }
};

interface TileProps {
  tile: TileData;
}

export function Tile({ tile }: TileProps) {
  return (
    <div className="relative flex h-12.5 w-12.5 items-center justify-center overflow-hidden border border-[#555] text-black">
      {tile.hasPit ? (
        <div className="absolute inset-0 h-full w-full bg-neutral-950" />
      ) : (
        <img src={steelTileImage} alt="Steel Tile" className="absolute inset-0 h-full w-full object-cover" />
      )}

      {tile.walls && <Walls walls={tile.walls} />}
      {tile.hasAntenna && <Antenna />}
      {tile.isSpawnPoint && <SpawnPoint />}
      {tile.gear && <Gear rotation={tile.gear} />}
      {tile.conveyor && <Conveyor {...tile.conveyor} />}
      {tile.pushPanel && <PushPanel {...tile.pushPanel} />}

      <div className="relative z-30 flex h-full w-full items-center justify-center">
        {tile.robot ? (
          <div className="relative flex items-center justify-center">
            <Robot avatarId={tile.robot.avatarId || 1} rotation={getRotationDegrees(tile.robot.direction)} />
            {tile.robot.isCurrentPlayer && (
              <span
                aria-label="Your robot"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded border border-cyan-100 bg-cyan-500 px-1 text-[8px] font-black leading-3 text-slate-950 shadow-md"
              >
                YOU
              </span>
            )}
          </div>
        ) : tile.checkpointNumber !== undefined ? (
          <Checkpoint num={tile.checkpointNumber} />
        ) : null}
      </div>
    </div>
  );
}
