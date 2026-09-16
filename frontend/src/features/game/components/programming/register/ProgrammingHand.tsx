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
    <div className="flex w-full flex-col items-center gap-4 rounded-lg bg-slate-900 p-4">
      <h2 className="text-lg font-bold text-slate-400">Your Hand</h2>
      <ol aria-label="Programming Hand" className="flex min-h-37.5 flex-wrap justify-center gap-3">
        {Array.from({ length: 9 }, (_, index) => (
          <li key={index} aria-label={`Hand slot ${index + 1}`}>
            <RegisterSlot>
              {cards[index] ? (
                <ProgrammingCard type={cards[index]} disabled={disabled} onClick={() => onSelectCard(index)} />
              ) : null}
            </RegisterSlot>
          </li>
        ))}
      </ol>
    </div>
  );
}
