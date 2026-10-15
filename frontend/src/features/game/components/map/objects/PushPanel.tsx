import type { Direction, TileData } from '../../../types/Board';
import pushPanelImage from '../../../../../assets/objects/pushPanel.png';

const ARROWS: Record<Direction, string> = { NORTH: '↑', EAST: '→', SOUTH: '↓', WEST: '←' };

// The texture is mounted on the north edge and pushes south before rotation.
const ROTATION: Record<Direction, number> = { NORTH: 180, EAST: 270, SOUTH: 0, WEST: 90 };

type PushPanelProps = NonNullable<TileData['pushPanel']>;

export function PushPanel({ direction, activeRegisters }: PushPanelProps) {
  return (
    <figure
      aria-label={`Push panel ${direction.toLowerCase()}, registers ${activeRegisters.join(', ')}`}
      className="pointer-events-none absolute inset-0 z-10 m-0"
    >
      <img
        src={pushPanelImage}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transform: `rotate(${ROTATION[direction]}deg)` }}
      />
      <figcaption
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center gap-0.5 font-black leading-none"
      >
        <span className="rounded-sm bg-neutral-950/90 px-1 py-0.5 text-[9px] text-yellow-300">
          {ARROWS[direction]} {activeRegisters.join(' · ')}
        </span>
      </figcaption>
    </figure>
  );
}
