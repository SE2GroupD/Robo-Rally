import type { ReactNode } from 'react';
import { cn } from '../../../utils/cn';

type ButtonVariant = 'primary' | 'secondary';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  size?: ButtonSize;
  type?: 'button' | 'submit' | 'reset';
  variant?: ButtonVariant;
}

const baseClasses = [
  'cursor-pointer rounded border-2 border-transparent',
  'font-bold tracking-normal',
  'transition-[background-color,border-color,box-shadow,color] duration-200',
  'disabled:cursor-not-allowed',
].join(' ');

const sizeClasses: Record<ButtonSize, string> = {
  small: 'px-3 py-2 text-sm',
  medium: 'px-4 py-3 text-base',
  large: 'px-5 py-4 text-lg',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'border-metal-light bg-metal text-text-dark',
    'shadow-[0_10px_24px_rgba(0,0,0,0.55)]',
    'hover:bg-metal-light',
    'focus-visible:bg-metal-light',
    'focus-visible:shadow-[0_0_0_3px_rgba(154,161,169,0.18),0_12px_28px_rgba(0,0,0,0.55)]',
    'active:border-metal active:bg-metal-dark active:text-text-light',
    'disabled:border-metal-dark disabled:bg-metal-dark disabled:text-text-muted disabled:shadow-none',
  ].join(' '),
  secondary: [
    'border-metal-light bg-transparent text-metal-light shadow-[inset_0_0_0_1px_rgba(192,199,206,0.35)]',
    'hover:border-metal-light hover:bg-metal-ghost hover:text-text-light',
    'focus-visible:border-metal-light focus-visible:bg-metal-ghost focus-visible:text-text-light',
    'disabled:border-metal-dark disabled:bg-black/15 disabled:text-metal-dark disabled:shadow-none',
  ].join(' '),
};

export function Button({
  children,
  className = '',
  size = 'medium',
  type = 'button',
  variant = 'primary',
  disabled,
  onClick,
}: ButtonProps) {
  const classNames = cn(baseClasses, sizeClasses[size], variantClasses[variant], className);

  if (type === 'submit') {
    return (
      <button className={classNames} disabled={disabled} onClick={onClick} type="submit">
        {children}
      </button>
    );
  }

  if (type === 'reset') {
    return (
      <button className={classNames} disabled={disabled} onClick={onClick} type="reset">
        {children}
      </button>
    );
  }

  return (
    <button className={classNames} disabled={disabled} onClick={onClick} type="button">
      {children}
    </button>
  );
}
