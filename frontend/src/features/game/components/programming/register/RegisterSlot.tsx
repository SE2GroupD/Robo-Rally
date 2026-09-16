import { type ReactElement } from 'react';
import registerBackground from '../../../../../assets/register.png';
import { cn } from '../../../../../utils/cn';

interface RegisterSlotProps {
  className?: string;
  variant?: 'hand' | 'program';
  children?: ReactElement | null;
}

export function RegisterSlot({ className = '', children, variant = 'program' }: RegisterSlotProps) {
  return (
    <div
      className={cn(
        'pointer-events-auto grid aspect-2/3 place-items-center overflow-visible rounded-md bg-slate-800 bg-cover shadow-lg',
        variant === 'hand'
          ? 'h-[var(--hand-height,72px)] w-[var(--hand-width,48px)]'
          : 'h-[var(--program-height,144px)] w-[calc(var(--program-height,144px)*2/3)]',
        className,
      )}
      style={{ backgroundImage: `url(${registerBackground})` }}
    >
      {children}
    </div>
  );
}
