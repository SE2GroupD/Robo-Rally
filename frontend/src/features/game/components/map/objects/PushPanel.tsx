import type { Direction, TileData } from '../../../types/Board';

const ARROWS: Record<Direction, string> = { NORTH: '↑', EAST: '→', SOUTH: '↓', WEST: '←' };

type PushPanelProps = NonNullable<TileData['pushPanel']>;

export function PushPanel({ direction, activeRegisters }: PushPanelProps) {
  return (
    <figure
      aria-label={`Push panel ${direction.toLowerCase()}, registers ${activeRegisters.join(', ')}`}
      className="absolute z-10 flex flex-col items-center font-black leading-none text-orange-400"
    >
      <span className="text-xl">{ARROWS[direction]}</span>
      <span className="text-[9px]">{activeRegisters.join('')}</span>
    </figure>
  );
}
