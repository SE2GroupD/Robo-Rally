import type { MapLayoutData } from '../../types/MapLayout';
import { mapBounds, TILE_GAP, TILE_PITCH, validateMapLayout } from '../../data/boardGeometry';
import { GameBoard } from './boards/GameBoard';
import { StartBoard } from './boards/StartBoard';

export function MapLayout({ layout }: { layout: MapLayoutData }) {
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
    </section>
  );
}
