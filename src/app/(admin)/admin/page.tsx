'use client';

import { useState } from 'react';
import AdminOverview from '@/components/admin/AdminOverview';
import AdminUsersList from '@/components/admin/AdminUsersList';
import AdminInscriptions from '@/components/admin/AdminInscriptions';
import { BarChart3, Users, FileStack } from 'lucide-react';

type TabType = 'overview' | 'users' | 'inscriptions';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'inscriptions', label: 'Inscriptions', icon: FileStack },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Platform Analytics</h1>
        <p className="text-slate-400">Monitor users, subscriptions, and platform metrics</p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'text-white border-b-red-600'
                  : 'text-slate-400 border-b-transparent hover:text-white'
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
