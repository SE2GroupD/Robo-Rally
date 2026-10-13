import type { WallConfig } from '../../../types/Board';
import wallImage from '../../../../../assets/one_wall.png';

const EDGES = ['north', 'east', 'south', 'west'] as const;

interface WallsProps {
  walls: WallConfig;
}

export function Walls({ walls }: WallsProps) {
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
