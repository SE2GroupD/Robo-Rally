import { RegisterSlot } from './RegisterSlot';
import { ProgrammingCard } from '../ProgrammingCard';
import type { CardType } from '../../../types/CardType';

interface DrawRegisterProps {
  cards: readonly (CardType | null)[];
  disabled: boolean;
  onSelectCard: (handIndex: number) => void;
}

export function DrawRegister({ cards, disabled, onSelectCard }: DrawRegisterProps) {
  return (
    <div className="absolute inset-y-0 left-0 w-[var(--hand-rail,82px)] overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
      <h2 className="sr-only">Your Hand</h2>
      <ol aria-label="Programming Hand" className="flex flex-col gap-1">
        {Array.from({ length: 9 }, (_, index) => (
          <li
            className="pointer-events-auto relative hover:z-20 focus-within:z-20 first:[&_button]:origin-top-left last:[&_button]:origin-bottom-left"
            key={index}
            aria-label={`Hand slot ${index + 1}`}
          >
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
