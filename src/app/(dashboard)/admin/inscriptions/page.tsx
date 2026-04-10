'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import { InscriptionRequestsTable } from '@/components/admin/InscriptionRequestsTable';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';

interface InscriptionRequest {
  id: string;
  type: 'FREE' | 'PROFESSIONAL';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  country?: string;
  numberOfTours?: number;
  imagesPerTour?: number;
  teamMembers?: number;
  frequency?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export default function AdminInscriptionsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [requests, setRequests] = useState<InscriptionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && user && user.role !== 'ADMIN') {
      router.push('/dashboard');
      toast.error('Admin access required');
    }
  }, [authLoading, user, router]);

  // Fetch inscription requests
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      return;
    }

    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/admin/inscriptions?status=PENDING&limit=100');
        if (!response.ok) {
          throw new Error('Failed to fetch requests');
        }

        const data = await response.json();
        setRequests(data.data.requests);
        setStats((prev) => ({
          ...prev,
          pending: data.data.total,
        }));

        // Fetch approved count
        const approvedRes = await fetch('/api/admin/inscriptions?status=APPROVED&limit=1');
        if (approvedRes.ok) {
          const approvedData = await approvedRes.json();
          setStats((prev) => ({
            ...prev,
            approved: approvedData.data.total,
          }));
        }

        // Fetch rejected count
        const rejectedRes = await fetch('/api/admin/inscriptions?status=REJECTED&limit=1');
        if (rejectedRes.ok) {
          const rejectedData = await rejectedRes.json();
          setStats((prev) => ({
            ...prev,
            rejected: rejectedData.data.total,
          }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load requests');
        toast.error('Failed to load inscription requests');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [user]);

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/inscription-request/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        toast.success('Request approved');
        setRequests((prev) => prev.filter((r) => r.id !== id));
        setStats((prev) => ({
          ...prev,
          pending: prev.pending - 1,
          approved: prev.approved + 1,
        }));
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to approve request');
      }
    } catch (error) {
      toast.error('Failed to approve request');
    }
  };

  const handleReject = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    setStats((prev) => ({
      ...prev,
      pending: prev.pending - 1,
      rejected: prev.rejected + 1,
    }));
  };

  const handleApproveBulk = (ids: string[]) => {
    setRequests((prev) => prev.filter((r) => !ids.includes(r.id)));
    setStats((prev) => ({
      ...prev,
      pending: prev.pending - ids.length,
      approved: prev.approved + ids.length,
    }));
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user && user.role !== 'ADMIN') {
    return (
      <Alert variant="error">
        <AlertCircle size={20} />
        <div>
          <h3 className="font-semibold">Access Denied</h3>
          <p>You don't have permission to access the admin panel.</p>
        </div>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Inscription Requests</h1>
        <p className="mt-2 text-dark-400">Manage user sign-up requests</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-6 rounded-lg bg-dark-700 border border-dark-600">
          <div className="text-sm text-dark-400 mb-2">Pending</div>
          <div className="text-3xl font-bold text-yellow-400">{stats.pending}</div>
        </div>
        <div className="p-6 rounded-lg bg-dark-700 border border-dark-600">
          <div className="text-sm text-dark-400 mb-2">Approved</div>
          <div className="text-3xl font-bold text-green-400">{stats.approved}</div>
        </div>
        <div className="p-6 rounded-lg bg-dark-700 border border-dark-600">
          <div className="text-sm text-dark-400 mb-2">Rejected</div>
          <div className="text-3xl font-bold text-red-400">{stats.rejected}</div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error">
          <AlertCircle size={20} />
          <div>
            <h3 className="font-semibold">Error</h3>
            <p>{error}</p>
          </div>
        </Alert>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : requests.length === 0 ? (
        <div className="p-8 rounded-lg bg-dark-700 border border-dark-600 text-center">
          <p className="text-dark-300">No pending inscription requests</p>
        </div>
      ) : (
        <InscriptionRequestsTable
          requests={requests}
          onApprove={handleApprove}
          onReject={handleReject}
          onApproveBulk={handleApproveBulk}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
