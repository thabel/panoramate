'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import { BarChart3, Users, FileStack, LogOut, Menu, X, Shield } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoading && user?.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
    }
    if (!isLoading && user?.role === 'SUPER_ADMIN') {
      setAuthorized(true);
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!authorized || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <Alert variant="error" title="Access Denied">
          You do not have permission to access the admin panel. Redirecting...
        </Alert>
      </div>
    );
  }

  const adminNavItems = [
    {
      label: 'Overview',
      href: '/admin',
      icon: BarChart3,
    },
    {
      label: 'Users',
      href: '/admin/users',
      icon: Users,
    },
    {
      label: 'Inscriptions',
      href: '/admin/inscriptions-requests',
      icon: FileStack,
    },
  ];

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Admin Style */}
      <aside
        className={`fixed lg:static top-0 left-0 h-full w-64 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 z-50 transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Admin Header */}
        <div className="p-6 border-b border-slate-800">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-red-600 rounded-lg">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">Admin Panel</div>
              <p className="text-xs text-slate-400">Super Admin</p>
            </div>
          </Link>
        </div>

        {/* Admin Nav */}
        <nav className="flex-1 p-4 space-y-2">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all group"
              >
                <Icon size={20} className="flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin Footer */}
        <div className="p-4 space-y-3 border-t border-slate-800">
          <div className="px-3 py-2 rounded-lg bg-slate-800/50">
            <p className="mb-1 text-xs text-slate-400">Logged in as</p>
            <p className="text-sm font-medium text-white truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs truncate text-slate-400">{user.email}</p>
          </div>

          <button
            onClick={logout}
            className="flex items-center w-full gap-2 px-4 py-2 text-sm transition-colors rounded-lg text-slate-300 hover:text-white hover:bg-red-600/20"
          >
            <LogOut size={18} className="flex-shrink-0" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between p-4 border-b bg-slate-900/50 border-slate-800">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg lg:hidden hover:bg-slate-800"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="hidden text-xl font-bold text-white sm:block">Super Admin</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="items-center hidden px-4 py-2 border rounded-lg sm:flex bg-slate-800/50 border-slate-700">
              <Shield size={16} className="mr-2 text-red-500" />
              <span className="text-sm text-slate-300">Administrator</span>
            </div>

            <Link
              href="/dashboard"
              className="px-3 py-2 text-sm transition-colors rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            >
              Back to Dashboard
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="h-full p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
