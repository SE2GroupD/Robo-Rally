import type { ReactNode } from 'react';

interface BackgroundProps {
  children: ReactNode;
  className?: string;
  img: string;
}

export function Background({ children, className = '', img }: BackgroundProps) {
  const classNames = ['relative bg-factory-bg bg-cover bg-center bg-no-repeat', className].filter(Boolean).join(' ');

  return (
    <div className={classNames} style={{ backgroundImage: `url(${img})` }}>
      <div className="absolute inset-0 bg-scrim" />
      {children}
    </div>
  );
}
