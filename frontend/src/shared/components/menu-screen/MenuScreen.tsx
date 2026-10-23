import type { ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { Background } from '../background/Background';

interface MenuScreenProps {
  children: ReactNode;
  className?: string;
  img: string;
  panelClassName?: string;
  subtitle?: string;
  title?: string;
}

export function MenuScreen({ children, className = '', img, panelClassName = '', subtitle, title }: MenuScreenProps) {
  const screenClassNames = cn(
    'flex min-h-screen w-screen items-center justify-center px-4 py-8 text-text-light sm:p-8',
    className,
  );

  const panelClassNames = cn(
    'relative z-10 w-full max-w-lg rounded-lg border-2 border-panel-border/90',
    'bg-panel/90 p-5 text-text-light shadow-[0_18px_36px_rgba(0,0,0,0.7)] sm:p-8',
    'backdrop-blur-sm',
    panelClassName,
  );

  return (
    <Background className={screenClassNames} img={img}>
      <section className={panelClassNames}>
        {title ? <h1 className="m-0 text-center text-3xl font-black uppercase text-text-light sm:text-4xl">{title}</h1> : null}
        {subtitle ? <p className="mt-2 text-center text-sm font-bold uppercase text-hazard sm:text-base">{subtitle}</p> : null}
        <div className={cn('flex flex-col gap-5', (title || subtitle) && 'mt-6')}>{children}</div>
      </section>
    </Background>
  );
}
