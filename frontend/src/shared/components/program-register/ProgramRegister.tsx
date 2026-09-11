import type { ReactElement } from 'react';
import { RegisterSlot } from '../../../foundation/components/register-slot/RegisterSlot';
import { cn } from '../../../utils/cn';

type Card = ReactElement | null;

interface RegisterProps {
  cards?: readonly [Card, Card, Card, Card, Card];
  className?: string;
}

export function ProgramRegister({ cards = [null, null, null, null, null], className }: RegisterProps) {
  return (
    <ol aria-label="Program Register" className={cn('grid grid-cols-5 gap-2', className)}>
      {cards.map((card, index) => (
        <li key={index} aria-label={`Program Register slot ${index + 1}`}>
          <RegisterSlot>{card}</RegisterSlot>
        </li>
      ))}
    </ol>
  );
}
