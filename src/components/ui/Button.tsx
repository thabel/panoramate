import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          'font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2',
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          {
            'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50': variant === 'primary',
            'bg-dark-700 text-white hover:bg-dark-600 disabled:opacity-50': variant === 'secondary',
            'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50': variant === 'danger',
            'bg-transparent text-primary-600 hover:bg-dark-800 disabled:opacity-50': variant === 'ghost',
          },
          className
        )}
        {...props}
      >
        {isLoading && (
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
