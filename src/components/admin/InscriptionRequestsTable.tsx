'use client';

import { useState, useCallback } from 'react';
import { Check, X, Trash2, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

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

interface InscriptionRequestsTableProps {
  requests: InscriptionRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
  onApproveBulk: (ids: string[]) => void;
  isLoading: boolean;
}

export function InscriptionRequestsTable({
  requests,
  onApprove,
  onReject,
  onApproveBulk,
  isLoading,
}: InscriptionRequestsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showRejectReason, setShowRejectReason] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === requests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(requests.map((r) => r.id)));
    }
  }, [requests, selectedIds.size]);

  const handleApproveBulk = useCallback(async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one request');
      return;
    }

    try {
      const response = await fetch('/api/admin/inscriptions/approve-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (response.ok) {
        toast.success(`${selectedIds.size} requests approved`);
        onApproveBulk(Array.from(selectedIds));
        setSelectedIds(new Set());
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to approve requests');
      }
    } catch (error) {
      toast.error('Failed to approve requests');
    }
  }, [selectedIds, onApproveBulk]);

  const handleReject = async (id: string) => {
    try {
      const response = await fetch(`/api/inscription-request/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: rejectReason || undefined }),
      });

      if (response.ok) {
        toast.success('Request rejected');
        onReject(id, rejectReason);
        setShowRejectReason(null);
        setRejectReason('');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to reject request');
      }
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-lg bg-primary-500/10 border border-primary-500/20">
          <span className="text-sm font-medium text-primary-400">
            {selectedIds.size} selected
          </span>
          <Button
            onClick={handleApproveBulk}
            disabled={isLoading}
            isLoading={isLoading}
            className="gap-2"
            variant="primary"
            size="sm"
          >
            <Check size={16} />
            Approve Selected
          </Button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-dark-400 hover:text-white"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg border-dark-700 bg-dark-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-700 bg-dark-700/50">
              <th className="px-4 py-3 text-left">
                <button
                  onClick={toggleSelectAll}
                  className="p-1 rounded hover:bg-dark-600"
                  title={selectedIds.size === requests.length ? 'Deselect all' : 'Select all'}
                >
                  {selectedIds.size === requests.length ? (
                    <CheckSquare size={18} className="text-primary-400" />
                  ) : (
                    <Square size={18} className="text-dark-400" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-white">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Type</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Company</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Date</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id} className="border-b border-dark-700 hover:bg-dark-700/50">
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleSelect(request.id)}
                    className="p-1 rounded hover:bg-dark-600"
                  >
                    {selectedIds.has(request.id) ? (
                      <CheckSquare size={18} className="text-primary-400" />
                    ) : (
                      <Square size={18} className="text-dark-400" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 text-dark-100">
                  {request.firstName} {request.lastName}
                </td>
                <td className="px-4 py-3 text-dark-300">{request.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      request.type === 'FREE'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-purple-500/20 text-purple-300'
                    }`}
                  >
                    {request.type === 'FREE' ? 'Free Trial' : 'Professional'}
                  </span>
                </td>
                <td className="px-4 py-3 text-dark-400">{request.company || '-'}</td>
                <td className="px-4 py-3 text-dark-400 text-xs">
                  {formatDate(request.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      request.status === 'PENDING'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : request.status === 'APPROVED'
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {request.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {request.status === 'PENDING' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onApprove(request.id)}
                        disabled={isLoading}
                        className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
                        title="Approve"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => setShowRejectReason(request.id)}
                        disabled={isLoading}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                        title="Reject"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-dark-500">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reject Reason Modal */}
      {showRejectReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md p-6 rounded-lg bg-dark-800 border border-dark-700">
            <h3 className="mb-4 text-lg font-semibold text-white">Reject Request</h3>
            <p className="mb-4 text-sm text-dark-300">
              Are you sure you want to reject this request?
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Optional rejection reason..."
              className="w-full mb-4 px-3 py-2 rounded-lg bg-dark-700 border border-dark-600 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
              rows={3}
            />
            <div className="flex gap-3">
              <Button
                onClick={() => handleReject(showRejectReason)}
                variant="danger"
                className="flex-1"
              >
                Reject
              </Button>
              <Button
                onClick={() => {
                  setShowRejectReason(null);
                  setRejectReason('');
                }}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
