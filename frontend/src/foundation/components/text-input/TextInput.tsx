import type { InputHTMLAttributes } from 'react';

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'style'> {
  label: string;
}

export function TextInput({ className = '', label, id, ...props }: TextInputProps) {
  const inputId = id ?? props.name;
  const inputClassNames = [
    'rounded border-2 border-metal-dark bg-input-bg px-3 py-3',
    'text-base text-text-light outline-none placeholder:text-text-muted',
    'focus:border-hazard focus:shadow-[0_0_0_3px_rgba(154,161,169,0.18)]',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex flex-col gap-2 text-left">
      <label className="text-sm font-bold text-text-muted" htmlFor={inputId}>
        {label}
      </label>
      <input className={inputClassNames} id={inputId} {...props} />
    </div>
  );
}
