import { Robot } from '../robot/Robot';
import { Checkpoint } from './Checkpoint';
import steelTileImage from '../../../assets/steel.png';

export type TileData = {
  x: number;
  y: number;
  robot?: {
    hue: number;
    direction: number;
  };
  checkpointNumber?: number;
};

interface TileProps {
  tile: TileData;
}

export function Tile({ tile }: TileProps) {
  return (
    <div className="relative w-[50px] h-[50px] border border-[#555] text-black flex items-center justify-center overflow-hidden">
      <img src={steelTileImage} alt="Steel Tile" className="absolute inset-0 w-full h-full object-cover" />

      <div className="relative z-10 flex w-full h-full items-center justify-center">
        {tile.robot ? (
          <Robot hueRotation={tile.robot.hue} rotation={tile.robot.direction} />
        ) : tile.checkpointNumber !== undefined ? (
          <Checkpoint num={tile.checkpointNumber} />
        ) : null}
      </div>
    </div>
  );
}