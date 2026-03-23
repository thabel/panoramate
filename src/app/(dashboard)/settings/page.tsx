'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, organization, logout } = useAuth();

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
      )
    ) {
      return;
    }

    if (!confirm('Type your email to confirm account deletion')) {
      return;
    }

    // Implementation would call delete account API
    toast.success('Account deletion coming soon');
  };

  if (!user || !organization) return null;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-dark-400">Manage your account and organization</p>
      </div>

      {/* Organization Settings */}
      <div className="bg-dark-800 border border-dark-700 rounded-lg p-8 space-y-6">
        <h2 className="text-xl font-bold text-white">Organization</h2>

        <Input
          label="Organization Name"
          type="text"
          defaultValue={organization.name}
          disabled
          helperText="Contact support to change organization name"
        />

        <Input
          label="Organization Slug"
          type="text"
          defaultValue={organization.slug}
          disabled
        />
      </div>

      {/* User Settings */}
      <div className="bg-dark-800 border border-dark-700 rounded-lg p-8 space-y-6">
        <h2 className="text-xl font-bold text-white">Profile</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="First Name"
            type="text"
            defaultValue={user.firstName}
            disabled
          />
          <Input
            label="Last Name"
            type="text"
            defaultValue={user.lastName}
            disabled
          />
        </div>

        <Input
          label="Email"
          type="email"
          defaultValue={user.email}
          disabled
        />

        <div>
          <p className="text-dark-400 text-sm mb-2">Role</p>
          <p className="text-white font-medium">{user.role}</p>
        </div>

        <Button
          variant="secondary"
          disabled
        >
          Edit Profile (Coming Soon)
        </Button>
      </div>

      {/* Security */}
      <div className="bg-dark-800 border border-dark-700 rounded-lg p-8 space-y-6">
        <h2 className="text-xl font-bold text-white">Security</h2>

        <Button
          variant="secondary"
          disabled
        >
          Change Password (Coming Soon)
        </Button>

        <div className="pt-4 border-t border-dark-700">
          <Button
            onClick={logout}
            variant="secondary"
          >
            Sign Out All Devices
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-dark-800 border border-red-900 rounded-lg p-8 space-y-6">
        <h2 className="text-xl font-bold text-red-400">Danger Zone</h2>

        <Alert variant="error">
          Deleting your account is permanent and cannot be undone. All your tours and data will be lost.
        </Alert>

        <Button
          variant="danger"
          onClick={handleDeleteAccount}
        >
          Delete Account
        </Button>
      </div>
    </div>
  );
}
