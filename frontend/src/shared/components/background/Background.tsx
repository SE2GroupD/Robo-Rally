import type { ReactNode } from 'react';
import { cn } from '../../../utils/cn';

interface BackgroundProps {
  children: ReactNode;
  className?: string;
  img: string;
}

export function Background({ children, className = '', img }: BackgroundProps) {
  const classNames = cn('relative bg-factory-bg bg-cover bg-center bg-no-repeat', className);

  return (
    <div className={classNames} style={{ backgroundImage: `url(${img})` }}>
      <div className="absolute inset-0 bg-scrim" />
      {children}
    </div>
  );
}
