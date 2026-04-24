'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { UsageBar } from '@/components/ui/UsageBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PLAN_LIMITS, PLAN_FEATURES, PLAN_NAMES } from '@/lib/stripe';
import toast from 'react-hot-toast';

export default function BillingPage() {
  const { organization } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async (planType: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType,
          interval: 'monthly',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.data.checkoutUrl;
      } else {
        toast.error('Failed to start upgrade');
      }
    } catch (error) {
      toast.error('Error upgrading plan');
      console.error('Upgrade error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePortal = async () => {
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.data.portalUrl;
      }
    } catch (error) {
      toast.error('Failed to open billing portal');
    }
  };

  if (!organization) return null;

  const limits = PLAN_LIMITS[organization.plan as keyof typeof PLAN_LIMITS];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Billing & Plan</h1>
        <p className="text-dark-400">Manage your subscription and usage</p>
      </div>

      {/* Current Plan */}
      <div className="bg-dark-800 border border-dark-700 rounded-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Current Plan</h2>
          <Badge variant="plan">
            {PLAN_NAMES[organization.plan]}
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-dark-400 text-sm mb-2">Plan Type</p>
            <p className="text-2xl font-bold text-white">
              {PLAN_NAMES[organization.plan]}
            </p>
          </div>
          <div>
            <p className="text-dark-400 text-sm mb-2">Subscription Status</p>
            <p className="text-2xl font-bold text-white capitalize">
              {organization.subscriptionStatus}
            </p>
          </div>
        </div>

        {/* Manage Button */}
        {organization.plan !== 'FREE_TRIAL' && (
          <Button
            variant="secondary"
            onClick={handlePortal}
            className="flex items-center gap-2"
          >
            Manage Subscription
          </Button>
        )}
      </div>

      {/* Usage */}
      <div className="bg-dark-800 border border-dark-700 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Usage</h2>

        <div className="space-y-6">
          <UsageBar
            label="Virtual Tours"
            used={0}
            max={limits.maxTours === -1 ? 999 : limits.maxTours}
            unit=""
          />
          <UsageBar
            label="Scenes per Tour"
            used={0}
            max={limits.maxImages === -1 ? 999 : limits.maxImages}
            unit=""
          />
          <UsageBar
            label="Storage"
            used={organization.usedStorageMb}
            max={organization.totalStorageMb}
            unit=" MB"
          />
        </div>
      </div>

      {/* Upgrade Plans */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Upgrade Your Plan</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Starter */}
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
            <div className="text-3xl font-bold text-white mb-4">$29/mo</div>

            <ul className="space-y-2 mb-6 text-dark-300 text-sm">
              {PLAN_FEATURES.STARTER.slice(0, 5).map((feature) => (
                <li key={feature}>✓ {feature}</li>
              ))}
            </ul>

            <Button
              variant={organization.plan === 'STARTER' ? 'ghost' : 'primary'}
              onClick={() => handleUpgrade('STARTER')}
              isLoading={isLoading}
              className="w-full"
              disabled={organization.plan === 'STARTER'}
            >
              {organization.plan === 'STARTER' ? 'Current Plan' : 'Upgrade'}
            </Button>
          </div>

          {/* Professional */}
          <div className="bg-dark-800 border-2 border-primary-500 rounded-lg p-6 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge>Most Popular</Badge>
            </div>

            <h3 className="text-xl font-bold text-white mb-2 mt-4">
              Professional
            </h3>
            <div className="text-3xl font-bold text-white mb-4">$79/mo</div>

            <ul className="space-y-2 mb-6 text-dark-300 text-sm">
              {PLAN_FEATURES.PROFESSIONAL.slice(0, 5).map((feature) => (
                <li key={feature}>✓ {feature}</li>
              ))}
            </ul>

            <Button
              variant={organization.plan === 'PROFESSIONAL' ? 'ghost' : 'primary'}
              onClick={() => handleUpgrade('PROFESSIONAL')}
              isLoading={isLoading}
              className="w-full"
              disabled={organization.plan === 'PROFESSIONAL'}
            >
              {organization.plan === 'PROFESSIONAL' ? 'Current Plan' : 'Upgrade'}
            </Button>
          </div>

          {/* Enterprise */}
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
            <div className="text-3xl font-bold text-white mb-4">$199/mo</div>

            <ul className="space-y-2 mb-6 text-dark-300 text-sm">
              {PLAN_FEATURES.ENTERPRISE.slice(0, 5).map((feature) => (
                <li key={feature}>✓ {feature}</li>
              ))}
            </ul>

            <Button
              variant={organization.plan === 'ENTERPRISE' ? 'ghost' : 'primary'}
              onClick={() => handleUpgrade('ENTERPRISE')}
              isLoading={isLoading}
              className="w-full"
              disabled={organization.plan === 'ENTERPRISE'}
            >
              {organization.plan === 'ENTERPRISE' ? 'Current Plan' : 'Contact Sales'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
