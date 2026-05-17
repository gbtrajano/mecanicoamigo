'use client';

import { HTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
          {
            'bg-primary text-primary-foreground': variant === 'default',
            'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30': variant === 'success',
            'bg-amber-500/20 text-amber-400 border border-amber-500/30': variant === 'warning',
            'bg-red-500/20 text-red-400 border border-red-500/30': variant === 'destructive',
            'border border-border text-muted-foreground': variant === 'outline',
          },
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';