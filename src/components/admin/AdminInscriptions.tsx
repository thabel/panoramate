'use client';

import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

interface InscriptionRequest {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  type: 'FREE' | 'PROFESSIONAL';
  company?: string;
  country?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  approvedAt?: string;
}

interface InscriptionListResponse {
  requests: InscriptionRequest[];
  total: number;
  limit: number;
  offset: number;
  pages: number;
}

export default function AdminInscriptions() {
  const [requests, setRequests] = useState<InscriptionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const limit = 20;

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          status: 'PENDING',
          limit: limit.toString(),
          offset: ((currentPage - 1) * limit).toString(),
        });

        const response = await fetch(`/api/admin/inscriptions?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch inscription requests');
        }
        const data: InscriptionListResponse = await response.json();
        setRequests(data.requests);
        setTotalPages(data.pages);
        setTotal(data.total);
        setSelectedIds(new Set()); // Clear selections on page change
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [currentPage]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(requests.map((r) => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleApproveSingle = async (id: string) => {
    try {
      setIsProcessing(true);
      const response = await fetch(`/api/inscription-request/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve');
      }

      // Remove from list
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setTotal((prev) => prev - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveBulk = async () => {
    if (selectedIds.size === 0) return;

    try {
      setIsProcessing(true);
      const response = await fetch('/api/admin/inscriptions/approve-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve requests');
      }

      // Remove approved requests
      setRequests((prev) => prev.filter((r) => !selectedIds.has(r.id)));
      setTotal((prev) => prev - selectedIds.size);
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectSingle = async (id: string) => {
    try {
      setIsProcessing(true);
      const response = await fetch(`/api/inscription-request/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject');
      }

      // Remove from list
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setTotal((prev) => prev - 1);
      setRejectingId(null);
      setRejectionReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (error) {
    return <Alert variant="error" title="Error">{error}</Alert>;
  }

  return (
    <div className="space-y-6">
      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-lg bg-primary-900/20 border border-primary-500/30">
          <p className="text-sm text-white">
            {selectedIds.size} request{selectedIds.size !== 1 ? 's' : ''} selected
          </p>
          <Button
            onClick={handleApproveBulk}
            disabled={isProcessing}
            className="ml-auto flex items-center gap-2"
          >
            <Check size={18} />
            Approve Selected
          </Button>
        </div>
      )}

      {/* Inscriptions Table */}
      <div className="rounded-lg border border-dark-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-dark-400">No pending inscription requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-dark-700 bg-dark-800">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === requests.length && requests.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-dark-600 bg-dark-700 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 font-semibold text-dark-300 text-left">User Info</th>
                  <th className="px-6 py-4 font-semibold text-dark-300 text-left">Type</th>
                  <th className="px-6 py-4 font-semibold text-dark-300 text-left">Company</th>
                  <th className="px-6 py-4 font-semibold text-dark-300 text-left">Country</th>
                  <th className="px-6 py-4 font-semibold text-dark-300 text-left">Requested</th>
                  <th className="px-6 py-4 font-semibold text-dark-300 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-b border-dark-700 hover:bg-dark-800/50 transition">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(request.id)}
                        onChange={() => handleSelectOne(request.id)}
                        className="w-4 h-4 rounded border-dark-600 bg-dark-700 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">
                          {request.firstName} {request.lastName}
                        </p>
                        <p className="text-xs text-dark-400">{request.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          request.type === 'PROFESSIONAL'
                            ? 'bg-purple-900/30 text-purple-400'
                            : 'bg-slate-900/30 text-slate-400'
                        }`}
                      >
                        {request.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-dark-300">{request.company || '-'}</td>
                    <td className="px-6 py-4 text-dark-300">{request.country || '-'}</td>
                    <td className="px-6 py-4 text-sm text-dark-400">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {rejectingId === request.id ? (
                          <div className="space-y-2 w-full">
                            <input
                              type="text"
                              placeholder="Rejection reason (optional)"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              className="w-full px-2 py-1 text-xs rounded bg-dark-700 border border-dark-600 text-white"
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleRejectSingle(request.id)}
                                disabled={isProcessing}
                                className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingId(null);
                                  setRejectionReason('');
                                }}
                                disabled={isProcessing}
                                className="px-2 py-1 text-xs bg-dark-700 hover:bg-dark-600 text-dark-300 rounded disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleApproveSingle(request.id)}
                              disabled={isProcessing}
                              className="p-1.5 rounded-lg bg-green-900/30 text-green-400 hover:bg-green-900/50 disabled:opacity-50"
                              title="Approve"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setRejectingId(request.id)}
                              disabled={isProcessing}
                              className="p-1.5 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 disabled:opacity-50"
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </div>
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
            Showing {requests.length > 0 ? (currentPage - 1) * limit + 1 : 0} to{' '}
            {Math.min(currentPage * limit, total)} of {total} requests
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
