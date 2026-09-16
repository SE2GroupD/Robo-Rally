import { RegisterSlot } from './RegisterSlot';
import { ProgrammingCard } from '../ProgrammingCard';
import type { CardType } from '../../../types/CardType';
import { cn } from '../../../../../utils/cn';

interface ProgramRegistersProps {
  cards?: readonly (CardType | null)[];
  disabled?: boolean;
  onRemoveCard?: (registerIndex: number) => void;
  className?: string;
}

export function ProgramRegisters({ cards = [], disabled = false, onRemoveCard, className }: ProgramRegistersProps) {
  return (
    <ol
      aria-label="Program Register"
      className={cn(
        'flex justify-center gap-2 px-[calc(var(--program-height,144px)/15+4px)] pt-[calc(var(--program-height,144px)/5)]',
        className,
      )}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <li className="relative hover:z-20 focus-within:z-20" key={index} aria-label={`Program Register slot ${index + 1}`}>
          <span aria-hidden="true" className="mb-1 block text-center text-xs font-bold text-white">
            <span className="rounded bg-slate-950/90 px-2 py-0.5">{index + 1}</span>
          </span>
          <RegisterSlot variant="program">
            {cards[index] ? (
              <ProgrammingCard type={cards[index]} disabled={disabled} onClick={() => onRemoveCard?.(index)} />
            ) : null}
          </RegisterSlot>
        </li>
      ))}
    </ol>
  );
}
