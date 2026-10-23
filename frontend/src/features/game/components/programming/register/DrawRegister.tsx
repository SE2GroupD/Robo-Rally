import { RegisterSlot } from './RegisterSlot';
import { ProgrammingCard } from '../ProgrammingCard';
import type { CardType } from '../../../types/CardType';

interface DrawRegisterProps {
  cards: readonly (CardType | null)[];
  disabled: boolean;
  onSelectCard: (handIndex: number, keyboard: boolean) => void;
}

export function DrawRegister({ cards, disabled, onSelectCard }: DrawRegisterProps) {
  return (
    <div className="min-h-0 min-w-0 flex-1 overflow-x-auto px-1">
      <h2 className="sr-only">Your Hand</h2>
      <ol aria-label="Programming Hand" className="m-0 flex h-full list-none items-center gap-1 py-3">
        {Array.from({ length: 9 }, (_, index) => (
          <li
            className="relative h-24 w-16 shrink-0 hover:z-20 focus-within:z-20 first:[&_button]:origin-left last:[&_button]:origin-right"
            key={index}
            aria-label={`Hand slot ${index + 1}`}
          >
            <RegisterSlot size="fill">
              {cards[index] ? (
                <ProgrammingCard
                  variant="hand"
                  type={cards[index]}
                  disabled={disabled}
                  onClick={(event) => onSelectCard(index, event.detail === 0)}
                />
              ) : null}
            </RegisterSlot>
          </li>
        ))}
      </ol>
    </div>
  );
}
