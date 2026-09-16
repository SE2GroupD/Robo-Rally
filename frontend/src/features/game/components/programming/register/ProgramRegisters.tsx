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
    <ol aria-label="Program Register" className={cn('grid grid-cols-5 gap-2', className)}>
      {Array.from({ length: 5 }, (_, index) => (
        <li key={index} aria-label={`Program Register slot ${index + 1}`}>
          <RegisterSlot>
            {cards[index] ? (
              <ProgrammingCard type={cards[index]} disabled={disabled} onClick={() => onRemoveCard?.(index)} />
            ) : null}
          </RegisterSlot>
        </li>
      ))}
    </ol>
  );
}
