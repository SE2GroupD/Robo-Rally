import { RegisterSlot } from './RegisterSlot';
import { ProgrammingCard } from '../ProgrammingCard';
import type { CardType } from '../../../types/CardType';
import { cn } from '../../../../../utils/cn';

interface ProgramRegistersProps {
  cards?: readonly (CardType | null)[];
  disabled?: boolean;
  onRemoveCard?: (registerIndex: number, keyboard: boolean) => void;
  className?: string;
}

export function ProgramRegisters({ cards = [], disabled = false, onRemoveCard, className }: ProgramRegistersProps) {
  return (
    <ol aria-label="Program Register" className={cn('m-0 flex list-none items-end justify-center gap-2 p-0', className)}>
      {Array.from({ length: 5 }, (_, index) => (
        <li
          className="relative flex w-14 xl:w-16 shrink-0 flex-col hover:z-20 focus-within:z-20"
          key={index}
          aria-label={`Program Register slot ${index + 1}`}
        >
          <span aria-hidden="true" className="mb-1 block text-center text-xs font-bold text-hazard">
            <span className="rounded bg-slate-950/90 px-2 py-0.5">{index + 1}</span>
          </span>
          <div className="h-[84px] xl:h-24">
            <RegisterSlot size="fill">
              {cards[index] ? (
                <ProgrammingCard
                  type={cards[index]}
                  disabled={disabled}
                  onClick={(event) => onRemoveCard?.(index, event.detail === 0)}
                />
              ) : null}
            </RegisterSlot>
          </div>
        </li>
      ))}
    </ol>
  );
}
