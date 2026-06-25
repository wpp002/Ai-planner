import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'outline' | 'ghost' | 'destructive';

export function Button({ className, variant = 'default', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none disabled:opacity-50',
        variant === 'default' && 'bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-500 text-primary-foreground hover:brightness-105',
        variant === 'outline' && 'border bg-background hover:bg-muted',
        variant === 'ghost' && 'shadow-none hover:bg-muted',
        variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        className
      )}
      {...props}
    />
  );
}
