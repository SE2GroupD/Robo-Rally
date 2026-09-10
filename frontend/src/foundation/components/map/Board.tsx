import type { Tile } from './Tile';
import { Robot } from '../robot/Robot';
import { Checkpoint } from './Checkpoint';

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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${width}, 50px)`,
        gap: '2px',
      }}
    >
      {tiles.map((tile) => (
        <div
          key={`${tile.x}-${tile.y}`}
          style={{
            width: '50px',
            height: '50px',
            border: '1px solid #555',

            backgroundColor: tile.robot ? '#87CEEB' : tile.checkpointNumber ? '#90EE90' : '#d9d9d9',

            color: 'black',

            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
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