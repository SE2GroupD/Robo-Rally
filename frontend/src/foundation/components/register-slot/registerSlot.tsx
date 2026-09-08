import { Children, type ReactElement } from 'react';
import registerBackground from '../../../assets/register.png';
import { cn } from '../../../utils/cn';

interface RegisterSlotProps {
  className?: string;
  children: ReactElement;
}

export function RegisterSlot({ className = '', children }: RegisterSlotProps) {
  const card = Children.only(children);

  return (
    <div
      className={cn(
        'relative flex aspect-[1039/1514] w-full items-center justify-center bg-contain bg-center bg-no-repeat p-3',
        className,
      )}
      style={{ backgroundImage: `url(${registerBackground})` }}
    >
      {card}
    </div>
  );
}
