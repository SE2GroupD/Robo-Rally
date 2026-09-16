import { RegisterSlot } from './RegisterSlot';
import { ProgrammingCard } from '../ProgrammingCard';
import type { CardType } from '../../../types/CardType';

interface ProgrammingHandProps {
  cards: readonly (CardType | null)[];
  disabled: boolean;
  onSelectCard: (handIndex: number) => void;
}

export function ProgrammingHand({ cards, disabled, onSelectCard }: ProgrammingHandProps) {
  return (
    <div className="absolute inset-y-0 left-0 w-[var(--hand-rail,64px)] overflow-y-auto p-2 [scrollbar-width:thin]">
      <h2 className="sr-only">Your Hand</h2>
      <ol aria-label="Programming Hand" className="flex flex-col gap-1">
        {Array.from({ length: 9 }, (_, index) => (
          <li className="pointer-events-auto" key={index} aria-label={`Hand slot ${index + 1}`}>
            <RegisterSlot variant="hand">
              {cards[index] ? (
                <ProgrammingCard variant="hand" type={cards[index]} disabled={disabled} onClick={() => onSelectCard(index)} />
              ) : null}
            </RegisterSlot>
          </li>
        ))}
      </ol>
    </div>
  );
}
