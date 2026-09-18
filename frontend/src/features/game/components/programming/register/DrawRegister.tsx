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
    <div className="pointer-events-none absolute inset-y-0 left-0 w-[calc((100dvh-64px)/9*0.8+24px)] px-3 py-4">
      <h2 className="sr-only">Your Hand</h2>
      <ol aria-label="Programming Hand" className="grid h-full grid-rows-9 gap-1">
        {Array.from({ length: 9 }, (_, index) => (
          <li
            className="pointer-events-auto relative grid min-h-0 w-[calc((100dvh-64px)/9*2/3)] justify-items-start hover:z-20 focus-within:z-20 first:[&_button]:origin-top-left last:[&_button]:origin-bottom-left"
            key={index}
            aria-label={`Hand slot ${index + 1}`}
          >
            <RegisterSlot size="fill">
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
