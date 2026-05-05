'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import AdminOverview from '@/components/admin/AdminOverview';
import AdminUsersList from '@/components/admin/AdminUsersList';
import AdminInscriptions from '@/components/admin/AdminInscriptions';
import { BarChart3, Users, FileStack } from 'lucide-react';

type TabType = 'overview' | 'users' | 'inscriptions';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is super admin
    if (user && user.role !== 'SUPER_ADMIN') {
      setError('You do not have permission to access this page');
      setTimeout(() => router.push('/dashboard'), 2000);
    }
    setIsLoading(false);
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="error" title="Access Denied">{error}</Alert>;
  }

  if (!user || user.role !== 'SUPER_ADMIN') {
    return <Alert variant="error" title="Access Denied">Super admin access required</Alert>;
  }

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'inscriptions', label: 'Inscriptions', icon: FileStack },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Super Admin Dashboard</h1>
        <p className="text-dark-400">Manage users, subscriptions, and platform analytics</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-dark-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-white border-b-2 border-primary-500'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && <AdminOverview />}
        {activeTab === 'users' && <AdminUsersList />}
        {activeTab === 'inscriptions' && <AdminInscriptions />}
      </div>
    </div>
  );
}
