import type { Tile } from "./Tile";
import { Robot } from "../robot/Robot";


export function Board() {
  const width = 8;
  const height = 8;

  const tiles: Tile[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles.push({
        x,
        y,
        hasRobot: x === 0 && y === 0,
        isCheckpoint: x === 7 && y === 7,
      });
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${width}, 50px)`,
        gap: "2px",
      }}
    >
      {tiles.map((tile) => (
        <div
          key={`${tile.x}-${tile.y}`}
          style={{
            width: "50px",
            height: "50px",
            border: "1px solid #555",

            backgroundColor: tile.hasRobot
                ? "#87CEEB"
                : tile.isCheckpoint
                ? "#90EE90"
                : "#d9d9d9",

            color: "black",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            }}
        >
          {tile.hasRobot ? <Robot /> : tile.isCheckpoint ? "C" : ""}
        </div>
      ))}
    </div>
  );
}