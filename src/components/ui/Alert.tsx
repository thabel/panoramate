import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import clsx from 'clsx';

interface AlertProps {
  variant?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children: React.ReactNode;
  className?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  className,
  dismissible,
  onDismiss,
}) => {
  const [isDismissed, setIsDismissed] = React.useState(false);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const icons = {
    info: <Info size={20} />,
    warning: <AlertTriangle size={20} />,
    error: <AlertCircle size={20} />,
    success: <CheckCircle size={20} />,
  };

  return (
    <div
      className={clsx(
        'rounded-lg px-4 py-3 flex gap-3',
        {
          'bg-blue-900/20 text-blue-300 border border-blue-700': variant === 'info',
          'bg-yellow-900/20 text-yellow-300 border border-yellow-700': variant === 'warning',
          'bg-red-900/20 text-red-300 border border-red-700': variant === 'error',
          'bg-green-900/20 text-green-300 border border-green-700': variant === 'success',
        },
        className
      )}
    >
      <div className="flex-shrink-0">{icons[variant]}</div>
      <div className="flex-1">
        {title && <h3 className="font-semibold mb-1">{title}</h3>}
        <div className="text-sm">{children}</div>
      </div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 hover:opacity-75 transition-opacity"
        >
          ×
        </button>
      )}
    </div>
  );
};
