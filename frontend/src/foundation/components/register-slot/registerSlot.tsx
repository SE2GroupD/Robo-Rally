import type { ReactNode } from 'react';
import { cn } from '../../../utils/cn';

interface RegisterSlotProps {
  className?: string;
  children: ReactNode;
}

export function RegisterSlot({ className = '', children }: RegisterSlotProps) {
  return (
    <div className={cn('flex', className)}>
      <div>{children}</div>
    </div>
  );
}
