'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  BarChart3,
  FileStack,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, organization, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || !organization) {
    return null;
  }

  const isTrialing = organization.plan === 'FREE_TRIAL';
  const trialDaysLeft = isTrialing
    ? Math.ceil(
        (new Date(organization.trialEndsAt).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: BarChart3,
    },
    {
      label: 'Tours',
      href: '/tours',
      icon: FileStack,
    },
    {
      label: 'Team',
      href: '/team',
      icon: Users,
    },
    {
      label: 'Billing',
      href: '/billing',
      icon: CreditCard,
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ];

  return (
    <div className="flex h-screen bg-dark-900">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 h-full w-64 bg-dark-800 border-r border-dark-700 z-50 transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-dark-700">
          <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text">
            Panoramate
          </div>
          <p className="mt-1 text-sm text-dark-400">{organization.name}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-2 transition-colors rounded-lg text-dark-300 hover:text-white hover:bg-dark-700"
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 space-y-3 border-t border-dark-700">
          <div className="p-3 rounded-lg bg-dark-700">
            <Badge variant="plan" className="block mb-2 text-center">
              {organization.plan === 'FREE_TRIAL'
                ? 'Free Trial'
                : organization.plan}
            </Badge>
            {isTrialing && (
              <p className="text-xs text-dark-400">
                {trialDaysLeft} days left
              </p>
            )}
          </div>

          <button
            onClick={logout}
            className="flex items-center w-full gap-2 px-4 py-2 text-sm transition-colors rounded-lg text-dark-300 hover:text-white hover:bg-dark-700"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-4 border-b bg-dark-800 border-dark-700">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg lg:hidden hover:bg-dark-700"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-dark-700">
              <Bell size={20} className="text-dark-300" />
              <div className="absolute w-2 h-2 rounded-full top-1 right-1 bg-primary-600" />
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-dark-700">
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-dark-400">{user.role}</p>
              </div>
              <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-primary-600">
                {user.firstName.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {/* Trial Warning */}
          {isTrialing && trialDaysLeft <= 7 && trialDaysLeft > 0 && (
            <div className="p-4 border-b bg-dark-800 border-dark-700">
              <Alert variant="warning" title="Trial Ending Soon">
                Your free trial ends in {trialDaysLeft} days.{' '}
                <Link href="/billing" className="font-semibold text-primary-400 hover:text-primary-300">
                  Upgrade now
                </Link>
                {' '}to continue using Panoramate.
              </Alert>
            </div>
          )}

          <div className="p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
