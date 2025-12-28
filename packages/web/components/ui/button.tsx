'use client';

import * as React from 'react';

import { Button as BaseButton } from '@base-ui-components/react/button';
import { cn } from '../../lib/utils'; // Adjust import based on location

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <BaseButton
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50",
          {
            'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm': variant === 'primary',
            'bg-neutral-800 text-white hover:bg-neutral-700': variant === 'secondary',
            'border border-neutral-700 text-neutral-300 hover:bg-neutral-800': variant === 'outline',
            'text-neutral-300 hover:text-white hover:bg-white/10': variant === 'ghost',
            'h-8 px-3 text-xs': size === 'sm',
            'h-10 px-4 py-2': size === 'md',
            'h-12 px-6 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
