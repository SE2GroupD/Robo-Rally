import { type ReactElement } from 'react';
import registerBackground from '../../../assets/register.png';
import { cn } from '../../../utils/cn';

interface RegisterSlotProps {
  className?: string;
  children?: ReactElement | null;
}

export function RegisterSlot({ className = '', children }: RegisterSlotProps) {
  return (
    <div
      className={cn('grid aspect-2/3 place-items-center bg-cover p-3', className)}
      style={{ backgroundImage: `url(${registerBackground})` }}
    >
      {children}
    </div>
  );
}
