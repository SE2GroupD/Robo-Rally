import { type ReactElement } from 'react';
import registerBackground from '../../../../../assets/register.png';
import { cn } from '../../../../../utils/cn';

interface RegisterSlotProps {
  className?: string;
  size?: 'default' | 'small' | 'fill';
  children?: ReactElement | null;
}

export function RegisterSlot({ className = '', children, size = 'default' }: RegisterSlotProps) {
  return (
    <div
      className={cn(
        'pointer-events-auto grid aspect-2/3 place-items-center overflow-visible rounded-md bg-slate-800 bg-cover shadow-lg',
        size === 'fill' ? 'h-full w-full min-h-0 min-w-0' : size === 'small' ? 'h-[72px] w-[48px]' : 'h-[144px] w-[96px]',
        className,
      )}
      style={{ backgroundImage: `url(${registerBackground})` }}
    >
      {children}
    </div>
  );
}
