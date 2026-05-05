'use client';

import AdminInscriptions from '@/components/admin/AdminInscriptions';

export default function AdminInscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Inscription Requests</h1>
        <p className="text-slate-400">Manage and validate new signup requests</p>
      </div>
      <AdminInscriptions />
    </div>
  );
}
