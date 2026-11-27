import { clsx } from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

export function Button({
  variant = 'secondary',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}) {
  return (
    <button
      type={type}
      className={clsx(
        'focus-visible:outline-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition duration-150 hover:cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
        variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90',
        variant === 'secondary' && 'border-border bg-card text-foreground hover:bg-muted border',
        variant === 'ghost' && 'text-muted-foreground hover:bg-muted hover:text-foreground',
        variant === 'danger' &&
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        className
      )}
      {...props}
    />
  );
}
