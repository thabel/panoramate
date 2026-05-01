import React from 'react';
import clsx from 'clsx';

interface UsageBarProps {
  label: string;
  used: number;
  max: number;
  unit?: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
  isUnlimited?: boolean; // For SUPER_ADMIN: show usage without limits
}

export const UsageBar: React.FC<UsageBarProps> = ({
  label,
  used,
  max,
  unit = '',
  color = 'primary',
  isUnlimited = false,
}) => {
  // For unlimited users (SUPER_ADMIN), show only usage without limits or color changes
  if (isUnlimited) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-dark-200">{label}</span>
          <span className="text-sm text-dark-400">
            {used}{unit} used
          </span>
        </div>
        <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-600 transition-all duration-300"
            style={{
              width: '100%',
            }}
          />
        </div>
        <p className="text-xs text-primary-400 mt-1">Unlimited storage</p>
      </div>
    );
  }

  const percentage = max > 0 ? (used / max) * 100 : 0;
  const isOverLimit = percentage > 100;

  const getColorClass = () => {
    if (percentage >= 90) return 'bg-red-600';
    if (percentage >= 70) return 'bg-yellow-600';
    return 'bg-primary-600';
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-dark-200">{label}</span>
        <span className="text-sm text-dark-400">
          {used}{unit} / {max}{unit}
        </span>
      </div>
      <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
        <div
          className={clsx(
            'h-full transition-all duration-300',
            getColorClass()
          )}
          style={{
            width: `${Math.min(percentage, 100)}%`,
          }}
        />
      </div>
      {isOverLimit && (
        <p className="text-xs text-red-400 mt-1">Limit exceeded</p>
      )}
    </div>
  );
};
