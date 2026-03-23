import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'plan';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className,
}) => {
  return (
    <span
      className={clsx(
        'inline-block px-3 py-1 rounded-full text-sm font-medium',
        {
          'bg-dark-700 text-dark-200': variant === 'default',
          'bg-green-900 text-green-300': variant === 'success',
          'bg-yellow-900 text-yellow-300': variant === 'warning',
          'bg-red-900 text-red-300': variant === 'error',
          'bg-blue-900 text-blue-300': variant === 'info',
          'bg-primary-900 text-primary-300': variant === 'plan',
        },
        className
      )}
    >
      {children}
    </span>
  );
};
