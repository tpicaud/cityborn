// src/components/ui/button.tsx

import { Button as AriaButton } from '@ariakit/react';
import * as React from 'react';
import { cn } from '@/lib/utils';
import Loader from './Loader';

export interface ButtonProps extends React.ComponentProps<typeof AriaButton> {
  variant?: 'default' | 'primary' | 'destructive' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  disableLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      disableLoading = false,
      onClick,
      children,
      ...props
    },
    ref,
  ) => {
    const [loading, setLoading] = React.useState(false);

    const handleClick: React.MouseEventHandler<HTMLButtonElement> = async (
      e,
    ) => {
      if (!onClick) return;
      try {
        setLoading(true);
        await onClick(e); // si onClick renvoie une promesse, on attend
      } finally {
        setLoading(false);
      }
    };

    return (
      <AriaButton
        ref={ref}
        onClick={handleClick}
        className={cn(
          /* base -------------------------------------------------------------- */
          'inline-flex items-center justify-center whitespace-nowrap cursor-pointer rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50',
          /* variants ---------------------------------------------------------- */
          variant === 'default' &&
            'bg-zinc-800 text-zinc-50 shadow hover:bg-zinc-700',
          variant === 'primary' &&
            'bg-primary text-primary-foreground shadow hover:bg-primary/90',
          variant === 'destructive' &&
            'bg-red-700 text-zinc-50 shadow hover:bg-red-800',
          variant === 'outline' &&
            'border border-neutral-500 bg-transparent text-zinc-50 hover:bg-zinc-800 hover:text-zinc-100',
          variant === 'ghost' && 'hover:bg-zinc-800 hover:text-zinc-50',
          /* sizes ------------------------------------------------------------- */
          size === 'default' && 'h-9 px-4 py-2',
          size === 'sm' && 'h-8 rounded-md px-3 text-xs',
          size === 'lg' && 'h-10 rounded-md px-8',
          /* custom ------------------------------------------------------------ */
          className,
        )}
        {...props}
      >
        {!disableLoading && loading ? <Loader /> : children}
      </AriaButton>
    );
  },
);

Button.displayName = 'Button';
