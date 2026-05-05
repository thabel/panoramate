'use client';

import AdminUsersList from '@/components/admin/AdminUsersList';

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Users Management</h1>
        <p className="text-slate-400">View all users and their subscription details</p>
      </div>
      <AdminUsersList />
    </div>
  );
}
