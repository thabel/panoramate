import React from 'react';
import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  icon: Icon,
  label,
  value,
  change,
  className,
}) => {
  return (
    <div className={clsx(
      'rounded-lg bg-dark-800 border border-dark-700 p-6',
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-dark-400 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {change && (
            <p className={clsx(
              'text-sm font-medium mt-2',
              change.isPositive ? 'text-green-400' : 'text-red-400'
            )}>
              {change.isPositive ? '+' : ''}{change.value}%
            </p>
          )}
        </div>
        <div className="p-3 bg-primary-900/30 rounded-lg">
          <Icon size={24} className="text-primary-400" />
        </div>
      </div>
    </div>
  );
};
