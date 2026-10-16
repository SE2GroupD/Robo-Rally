import type { Direction, TileData } from '../../../types/Board';
import conveyorImage from '../../../../../assets/objects/conveyor1.png';
import expressConveyorImage from '../../../../../assets/objects/conveyor2.png';

// Both conveyor images point east before rotation.
const ROTATION: Record<Direction, number> = { NORTH: 270, EAST: 0, SOUTH: 90, WEST: 180 };

type ConveyorProps = NonNullable<TileData['conveyor']>;

export function Conveyor({ direction, isExpress }: ConveyorProps) {
  return (
    <img
      src={isExpress ? expressConveyorImage : conveyorImage}
      alt={`${isExpress ? 'Express' : 'Regular'} conveyor ${direction.toLowerCase()}`}
      draggable={false}
      className="absolute inset-0 h-full w-full object-cover"
      style={{ transform: `rotate(${ROTATION[direction]}deg)` }}
    />
  );
}
