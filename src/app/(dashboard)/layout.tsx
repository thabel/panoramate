'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/context/UIContext';
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
  ChevronLeft,
  ChevronRight,
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
  const pathname = usePathname();
  const { user, organization, isLoading, logout } = useAuth();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useUI();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isEditor = pathname?.includes('/editor');

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
        className={`fixed lg:static top-0 left-0 h-full bg-dark-800 border-r border-dark-700 z-50 transition-all duration-300 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        } ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className={`p-4 border-b border-dark-700 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isSidebarCollapsed && (
            <div>
              <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text">
                Panoramate
              </div>
              {/* <p className="mt-1 text-xs text-dark-400 truncate max-w-[140px]">{organization.name}</p> */}
            </div>
          )}
          {isSidebarCollapsed && (
            <div className="text-2xl font-bold text-primary-500">P</div>
          )}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:block p-1.5 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white"
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                title={isSidebarCollapsed ? item.label : ''}
                className={`flex items-center gap-3 px-4 py-2.5 transition-all rounded-lg text-dark-300 hover:text-white hover:bg-dark-700 group ${isSidebarCollapsed ? 'justify-center' : ''}`}
              >
                <Icon size={22} className="flex-shrink-0" />
                {!isSidebarCollapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 space-y-3 border-t border-dark-700">
          {/* User Info */}
          {!isSidebarCollapsed && (
            <div className="p-3 rounded-lg bg-dark-700">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-8 h-8 text-xs font-bold text-white rounded-full bg-primary-600">
                  {user.firstName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-[10px] text-dark-400 truncate">{user.role}</p>
                </div>
              </div>
            </div>
          )}

          {/* Plan Badge */}
          {!isSidebarCollapsed && (
            <div className="p-3 rounded-lg bg-dark-700">
              <Badge variant="plan" className="block mb-2 text-center text-[10px] uppercase tracking-wider">
                {organization.plan === 'FREE_TRIAL'
                  ? 'Free Trial'
                  : organization.plan}
              </Badge>
              {isTrialing && (
                <p className="text-[10px] text-dark-400 text-center">
                  {trialDaysLeft} days left
                </p>
              )}
            </div>
          )}

          <button
            onClick={logout}
            title={isSidebarCollapsed ? 'Sign Out' : ''}
            className={`flex items-center w-full gap-2 px-4 py-2 text-sm transition-colors rounded-lg text-dark-300 hover:text-white hover:bg-dark-700 ${isSidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-12 px-4 border-b bg-dark-800 border-dark-700">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg lg:hidden hover:bg-dark-700"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex-1" />

          <button className="relative p-2 rounded-lg hover:bg-dark-700">
            <Bell size={18} className="text-dark-300" />
            <div className="absolute w-2 h-2 rounded-full top-1 right-1 bg-primary-600" />
          </button>
        </header>

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
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

            <div className={isEditor ? 'h-full' : 'p-4 md:p-8'}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
