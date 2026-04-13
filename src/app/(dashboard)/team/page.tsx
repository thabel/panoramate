'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, Mail, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    role: 'MEMBER',
  });
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/team', {
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMembers(data.data.members);
        setPendingInvitations(data.data.pendingInvitations);
      }
    } catch (error) {
      console.error('Fetch team error:', error);
      toast.error('Failed to load team');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteFormData.email) {
      toast.error('Email is required');
      return;
    }

    setIsInviting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify(inviteFormData),
      });

      if (response.ok) {
        toast.success(`Invitation sent to ${inviteFormData.email}`);
        setInviteFormData({ email: '', role: 'MEMBER' });
        setIsInviteModalOpen(false);
        fetchTeam();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send invitation');
      }
    } catch (error) {
      toast.error('Error sending invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this member?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/team/${memberId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      });

      if (response.ok) {
        toast.success('Member removed');
        setMembers(members.filter((m) => m.id !== memberId));
      }
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white">Team</h1>
          <p className="text-dark-400">Manage team members and permissions</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          Invite Member
        </Button>
      </div>

      {/* Members Table */}
      <div className="overflow-hidden border rounded-lg bg-dark-800 border-dark-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-dark-700">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-left text-dark-200">
                  Name
                </th>
                <th className="px-6 py-3 text-sm font-semibold text-left text-dark-200">
                  Email
                </th>
                <th className="px-6 py-3 text-sm font-semibold text-left text-dark-200">
                  Role
                </th>
                <th className="px-6 py-3 text-sm font-semibold text-left text-dark-200">
                  Joined
                </th>
                <th className="px-6 py-3 text-sm font-semibold text-right text-dark-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-dark-400">
                    No team members yet
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="border-t border-dark-700 hover:bg-dark-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-primary-600">
                        {member.firstName.charAt(0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-dark-200">{member.firstName} {member.lastName}</td>
                    <td className="px-6 py-4 text-dark-200">{member.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-sm rounded bg-dark-700 text-dark-200">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-dark-400">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {member.role !== 'OWNER' && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 text-red-400 transition-colors rounded-lg hover:bg-red-900/20"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="p-6 border rounded-lg bg-dark-800 border-dark-700">
          <h2 className="mb-4 text-xl font-bold text-white">Pending Invitations</h2>
          <div className="space-y-3">
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-4 rounded-lg bg-dark-700"
              >
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-primary-400" />
                  <div>
                    <p className="font-medium text-white">{inv.email}</p>
                    <p className="text-sm text-dark-400">
                      Expires {new Date(inv.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-dark-300">{inv.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Team Member"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={inviteFormData.email}
            onChange={(e) =>
              setInviteFormData((prev) => ({
                ...prev,
                email: e.target.value,
              }))
            }
            placeholder="member@example.com"
            required
          />

          <div>
            <label className="block mb-2 text-sm font-medium text-dark-200">
              Role
            </label>
            <select
              value={inviteFormData.role}
              onChange={(e) =>
                setInviteFormData((prev) => ({
                  ...prev,
                  role: e.target.value,
                }))
              }
              className="w-full px-4 py-2 text-white border-2 rounded-lg bg-dark-800 border-dark-700 focus:outline-none focus:border-primary-500"
            >
              <option value="VIEWER">Viewer</option>
              <option value="MEMBER">Member</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isInviting}
            >
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
