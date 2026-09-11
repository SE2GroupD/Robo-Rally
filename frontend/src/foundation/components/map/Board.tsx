import type { Tile } from './Tile';
import { Robot } from '../robot/Robot';
import { Checkpoint } from './Checkpoint';
import steelTileImage from '../../../assets/steel.png';

export function Board() {
  const width = 8;
  const height = 8;

  const tiles: Tile[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let currentRobot = undefined;
      let currentCheckpoint = undefined;

      if (x === 0 && y === 0) {
        currentRobot = { hue: 0, direction: 90 };
      }
      if (x === 7 && y === 0) {
        currentRobot = { hue: 90, direction: 180 };
      }
      if (x === 7 && y === 7) {
        currentCheckpoint = 1;
      }
      if (x === 4 && y === 4) {
        currentCheckpoint = 2;
      }

      tiles.push({
        x,
        y,
        robot: currentRobot,
        checkpointNumber: currentCheckpoint,
      });
    }
  }

  return (
    <div className="grid grid-cols-[repeat(8,50px)] gap-[2px] w-max">
      {tiles.map((tile) => (
        <div
          key={`${tile.x}-${tile.y}`}
          className={`
            relative w-[50px] h-[50px] border border-[#555] text-black flex items-center justify-center overflow-hidden
            ${tile.robot ? 'bg-[#87CEEB]' : tile.checkpointNumber ? 'bg-[#90EE90]' : ''}
          `}
        >
          {/* L'image d'acier s'affiche uniquement sur les cases vides */}
          {!tile.robot && tile.checkpointNumber === undefined && (
            <img src={steelTileImage} alt="Steel Tile" className="absolute inset-0 w-full h-full object-cover" />
          )}

          {tile.robot ? (
            <Robot hueRotation={tile.robot.hue} rotation={tile.robot.direction} />
          ) : tile.checkpointNumber !== undefined ? (
            <Checkpoint num={tile.checkpointNumber} />
          ) : (
            ''
          )}
        </div>
      ))}
    </div>
  );
}
