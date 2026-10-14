import type { WallConfig } from '../../../types/Board';
import wallImage from '../../../../../assets/one_wall.png';
import cornerWallImage from '../../../../../assets/two_wall.png';

const EDGES = ['north', 'east', 'south', 'west'] as const;

interface WallsProps {
  walls: WallConfig;
}

export function Walls({ walls }: WallsProps) {
  const activeEdges = EDGES.filter((edge) => walls[edge]);
  const cornerIndex = EDGES.findIndex((edge, index) => walls[edge] && walls[EDGES[(index + 1) % EDGES.length]]);

  if (activeEdges.length === 2 && cornerIndex !== -1) {
    return (
      <img
        src={cornerWallImage}
        alt={`Walls ${activeEdges.join(' and ')}`}
        draggable={false}
        className="pointer-events-none absolute inset-0 z-20 h-full w-full object-fill"
        style={{
          // The source corner faces north/east. Clip its floor to preserve other tile objects.
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 77% 100%, 77% 23%, 0 23%)',
          transform: `rotate(${cornerIndex * 90}deg)`,
        }}
      />
    );
  }

  return (
    <>
      {EDGES.map((edge, index) =>
        walls[edge] ? (
          <img
            key={edge}
            src={wallImage}
            alt={`Wall ${edge}`}
            draggable={false}
            className="pointer-events-none absolute inset-0 z-20 h-full w-full object-fill"
            style={{
              // Keep only the wall strip so the artwork's floor cannot hide other objects.
              clipPath: 'inset(0 0 77% 0)',
              transform: `rotate(${index * 90}deg)`,
            }}
          />
        ) : null,
      )}
    </>
  );
}
