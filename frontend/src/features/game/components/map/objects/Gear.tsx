import type { TileData } from '../../../types/Board';
import gearRightImage from '../../../../../assets/objects/gearRight.png';
import gearLeftImage from '../../../../../assets/objects/gearLeft.png';

interface GearProps {
  rotation: NonNullable<TileData['gear']>;
}

export function Gear({ rotation }: GearProps) {
  return (
    <img
      src={rotation === 'CLOCKWISE' ? gearRightImage : gearLeftImage}
      alt={rotation === 'CLOCKWISE' ? 'Gear turning right (clockwise)' : 'Gear turning left (counterclockwise)'}
      draggable={false}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}
