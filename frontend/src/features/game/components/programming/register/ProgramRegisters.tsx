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
        'flex h-full items-end justify-center gap-3 px-3 pb-2 [--program-card-height:min(calc((100cqh-40px)/1.2),calc((100cqw-72px)*0.3))]',
        className,
      )}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <li
          className="relative flex w-[calc(var(--program-card-height)*2/3)] shrink-0 flex-col hover:z-20 focus-within:z-20"
          key={index}
          aria-label={`Program Register slot ${index + 1}`}
        >
          <span aria-hidden="true" className="mb-1 block text-center text-xs font-bold text-white">
            <span className="rounded bg-slate-950/90 px-2 py-0.5">{index + 1}</span>
          </span>
          <div className="h-[var(--program-card-height)]">
            <RegisterSlot size="fill">
              {cards[index] ? (
                <ProgrammingCard type={cards[index]} disabled={disabled} onClick={() => onRemoveCard?.(index)} />
              ) : null}
            </RegisterSlot>
          </div>
        </li>
      ))}
    </ol>
  );
}
