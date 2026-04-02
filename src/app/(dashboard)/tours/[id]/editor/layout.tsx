'use client';

import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUI } from '@/context/UIContext';

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { isHotspotPanelOpen, isHotspotPanelCollapsed } = useUI();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-full overflow-hidden bg-dark-900 relative">
      {/* Editor Main Content Area - Always Full Width */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      {/* Floating Hotspot Panel - Overlay on top right */}
      {/* Panel floats over content without reducing viewer width */}
      <aside
        id="hotspot-panel-slot"
        className={`fixed right-0 top-0 h-full bg-dark-800 shadow-2xl z-50 border-l border-dark-700 transition-all duration-300 ${
          !isHotspotPanelOpen
            ? 'translate-x-full invisible'
            : (isHotspotPanelCollapsed ? 'w-12 visible' : 'w-80 visible')
        }`}
      />
    </div>
  );
}
