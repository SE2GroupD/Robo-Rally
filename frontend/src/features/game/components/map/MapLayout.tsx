import { Robot } from './objects/Robot';
import type { MapRobot } from './Map';
import type { MapLayoutData } from '../../types/MapLayout';
import { mapBounds, TILE_GAP, TILE_PITCH, TILE_SIZE, validateMapLayout } from '../../data/boardGeometry';
import { GameBoard } from './boards/GameBoard';
import { StartBoard } from './boards/StartBoard';

export function MapLayout({ layout, robots = [] }: { layout: MapLayoutData; robots?: MapRobot[] }) {
  if (validateMapLayout(layout).length) return <p role="alert">Map layout is invalid</p>;

  const bounds = mapBounds(layout.boards);

  return (
    <section
      aria-label="Map layout"
      className="relative"
      style={{ width: bounds.width * TILE_PITCH - TILE_GAP, height: bounds.height * TILE_PITCH - TILE_GAP }}
    >
      {layout.boards.map((board) => (
        <section
          key={board.id}
          aria-label={`${board.kind === 'start' ? 'Start' : 'Game'} board ${board.id}`}
          className="absolute"
          style={{ left: (board.x - bounds.x) * TILE_PITCH, top: (board.y - bounds.y) * TILE_PITCH }}
        >
          {board.kind === 'start' ? (
            <StartBoard layoutData={board.tiles} rotation={board.rotation} />
          ) : (
            <GameBoard layoutData={board.tiles} rotation={board.rotation} />
          )}
        </section>
      ))}
      {robots.map((robot) => (
        <div
          key={robot.playerId}
          className="absolute z-30 flex items-center justify-center pointer-events-none"
          style={{
            left: (robot.x - bounds.x) * TILE_PITCH,
            top: (robot.y - bounds.y) * TILE_PITCH,
            width: TILE_SIZE,
            height: TILE_SIZE,
          }}
        >
          <Robot avatarId={robot.avatarId} rotation={{ NORTH: 180, EAST: 270, SOUTH: 0, WEST: 90 }[robot.direction]} />
          {robot.isCurrentPlayer && (
            <span
              aria-label="Your robot"
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded border border-cyan-100 bg-cyan-500 px-1 text-[8px] font-black leading-3 text-slate-950 shadow-md"
            >
              YOU
            </span>
          )}
        </div>
      ))}
    </section>
  );
}
