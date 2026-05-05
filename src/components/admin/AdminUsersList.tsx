'use client';

import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import { Input } from '@/components/ui/Input';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  lastLoginAt: string | null;
  organization: {
    id: string;
    name: string;
    plan: string;
    subscriptionStatus: string;
  };
  usage: {
    tours: number;
    storageUsedGb: number;
    storageTotalGb: number;
  };
}

interface UserListResponse {
  users: User[];
  total: number;
  limit: number;
  offset: number;
  pages: number;
}

const PLANS_DISPLAY = {
  FREE_TRIAL: 'Free Trial',
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
};

const STATUS_COLORS = {
  ACTIVE: 'bg-green-900/20 text-green-400',
  PAST_DUE: 'bg-red-900/20 text-red-400',
  CANCELED: 'bg-gray-900/20 text-gray-400',
  TRIALING: 'bg-blue-900/20 text-blue-400',
  INCOMPLETE: 'bg-yellow-900/20 text-yellow-400',
};

export default function AdminUsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const limit = 25;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: ((currentPage - 1) * limit).toString(),
          ...(searchTerm && { search: searchTerm }),
          ...(planFilter && { plan: planFilter }),
          ...(statusFilter && { status: statusFilter }),
        });

        const response = await fetch(`/api/admin/users?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data: UserListResponse = await response.json();
        setUsers(data.users);
        setTotalPages(data.pages);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchUsers, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, planFilter, statusFilter, currentPage]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePlanChange = (value: string) => {
    setPlanFilter(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  if (error) {
    return <Alert variant="error" title="Error">{error}</Alert>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-500" size={18} />
          <Input
            type="text"
            placeholder="Search by email, name, or organization..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <select
          value={planFilter}
          onChange={(e) => handlePlanChange(e.target.value)}
          className="px-4 py-2 rounded-lg bg-dark-800 border border-dark-700 text-white hover:border-dark-600 focus:outline-none focus:border-primary-500"
        >
          <option value="">All Plans</option>
          <option value="FREE_TRIAL">Free Trial</option>
          <option value="STARTER">Starter</option>
          <option value="PROFESSIONAL">Professional</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="px-4 py-2 rounded-lg bg-dark-800 border border-dark-700 text-white hover:border-dark-600 focus:outline-none focus:border-primary-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-dark-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : users?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-dark-400">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-dark-700 bg-dark-800">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-dark-300">User</th>
                  <th className="text-left px-6 py-4 font-semibold text-dark-300">Organization</th>
                  <th className="text-left px-6 py-4 font-semibold text-dark-300">Plan</th>
                  <th className="text-left px-6 py-4 font-semibold text-dark-300">Status</th>
                  <th className="text-left px-6 py-4 font-semibold text-dark-300">Usage</th>
                  <th className="text-left px-6 py-4 font-semibold text-dark-300">Created</th>
                  <th className="text-left px-6 py-4 font-semibold text-dark-300">Last Login</th>
                </tr>
              </thead>
              <tbody>
                {(users || []).map((user) => (
                  <tr key={user.id} className="border-b border-dark-700 hover:bg-dark-800/50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-dark-400">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white">{user.organization.name}</td>
                    <td className="px-6 py-4">
                      <span className="text-white text-sm">
                        {PLANS_DISPLAY[user.organization.plan as keyof typeof PLANS_DISPLAY] || user.organization.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          STATUS_COLORS[user.organization.subscriptionStatus as keyof typeof STATUS_COLORS] ||
                          'bg-dark-700/50 text-dark-400'
                        }`}
                      >
                        {user.organization.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-dark-300">
                      <div className="space-y-1">
                        <p>{user.usage.tours} tours</p>
                        <p>{user.usage.storageUsedGb.toFixed(2)} GB / {user.usage.storageTotalGb.toFixed(2)} GB</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-dark-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-dark-400">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-dark-400">
            Showing {users?.length > 0 ? (currentPage - 1) * limit + 1 : 0} to{' '}
            {Math.min(currentPage * limit, total)} of {total} users
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-dark-800 border border-dark-700 text-white hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
              Previous
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg border transition ${
                    page === currentPage
                      ? 'bg-primary-600 border-primary-500 text-white'
                      : 'bg-dark-800 border-dark-700 text-dark-300 hover:border-dark-600'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-dark-800 border border-dark-700 text-white hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
