'use client';

import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import { Users, Database, FileStack, Zap } from 'lucide-react';

interface Stats {
  accounts: {
    total: number;
    free: number;
    paid: number;
    byPlan: {
      freeTrial: number;
      starter: number;
      professional: number;
      enterprise: number;
    };
    active: number;
    inactive: number;
    pendingValidation: number;
  };
  usage: {
    totalTours: number;
    totalStorageMb: number;
    totalStorageGb: number;
    totalUsers: number;
    activeThisMonth: number;
  };
}

interface StatCard {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  description?: string;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }
        const data = await response.json();
        setStats(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="error" title="Error">{error}</Alert>;
  }

  if (!stats) {
    return <Alert variant="warning" title="No Data">Could not load statistics</Alert>;
  }

  const statCards: StatCard[] = [
    {
      label: 'Total Accounts',
      value: stats.accounts.total,
      icon: Users,
      color: 'bg-blue-900/30 text-blue-400',
      description: `${stats.accounts.free} free · ${stats.accounts.paid} paid`,
    },
    {
      label: 'Active Accounts',
      value: stats.accounts.active,
      icon: Zap,
      color: 'bg-green-900/30 text-green-400',
      description: `${((stats.accounts.active / stats.accounts.total) * 100).toFixed(1)}% of total`,
    },
    {
      label: 'Inactive Accounts',
      value: stats.accounts.inactive,
      icon: Users,
      color: 'bg-red-900/30 text-red-400',
      description: 'Expired or canceled',
    },
    {
      label: 'Pending Validation',
      value: stats.accounts.pendingValidation,
      icon: FileStack,
      color: 'bg-yellow-900/30 text-yellow-400',
      description: 'Awaiting approval',
    },
  ];

  const usageCards: StatCard[] = [
    {
      label: 'Total Tours',
      value: stats.usage.totalTours,
      icon: FileStack,
      color: 'bg-purple-900/30 text-purple-400',
    },
    {
      label: 'Total Storage Used',
      value: `${stats.usage.totalStorageGb.toFixed(2)} GB`,
      icon: Database,
      color: 'bg-cyan-900/30 text-cyan-400',
      description: `${stats.usage.totalStorageMb.toLocaleString()} MB`,
    },
    {
      label: 'Total Users',
      value: stats.usage.totalUsers,
      icon: Users,
      color: 'bg-indigo-900/30 text-indigo-400',
    },
    {
      label: 'Active This Month',
      value: stats.usage.activeThisMonth,
      icon: Zap,
      color: 'bg-emerald-900/30 text-emerald-400',
      description: `${((stats.usage.activeThisMonth / stats.usage.totalUsers) * 100).toFixed(1)}% active`,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Account Statistics */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Account Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <StatCardComponent key={card.label} card={card} />
          ))}
        </div>
      </div>

      {/* Plan Distribution */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Plan Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <PlanCard
            name="Free Trial"
            count={stats.accounts.byPlan.freeTrial}
            total={stats.accounts.total}
            color="bg-slate-900/30 text-slate-400"
          />
          <PlanCard
            name="Starter"
            count={stats.accounts.byPlan.starter}
            total={stats.accounts.total}
            color="bg-blue-900/30 text-blue-400"
          />
          <PlanCard
            name="Professional"
            count={stats.accounts.byPlan.professional}
            total={stats.accounts.total}
            color="bg-purple-900/30 text-purple-400"
          />
          <PlanCard
            name="Enterprise"
            count={stats.accounts.byPlan.enterprise}
            total={stats.accounts.total}
            color="bg-gold-900/30 text-gold-400"
          />
        </div>
      </div>

      {/* Usage Statistics */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Platform Usage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {usageCards.map((card) => (
            <StatCardComponent key={card.label} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCardComponent({ card }: { card: StatCard }) {
  const Icon = card.icon;
  return (
    <div className={`rounded-lg p-6 border border-dark-700 ${card.color.split(' ')[0]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-dark-400 mb-2">{card.label}</p>
          <p className="text-3xl font-bold text-white">{card.value}</p>
          {card.description && (
            <p className="text-xs text-dark-500 mt-2">{card.description}</p>
          )}
        </div>
        <Icon size={24} className={card.color.split(' ')[1]} />
      </div>
    </div>
  );
}

function PlanCard({
  name,
  count,
  total,
  color,
}: {
  name: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
  return (
    <div className={`rounded-lg p-6 border border-dark-700 ${color.split(' ')[0]}`}>
      <p className="text-sm font-medium text-dark-400 mb-3">{name}</p>
      <p className="text-2xl font-bold text-white mb-2">{count}</p>
      <div className="w-full h-2 rounded-full bg-dark-700 overflow-hidden">
        <div
          className={`h-full ${color.split(' ')[1].replace('text-', 'bg-')}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-dark-500 mt-2">{percentage}% of total</p>
    </div>
  );
}
