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
    <div className="flex h-full overflow-hidden bg-dark-900">
      {/* Editor Main Content Area */}
      <div className="flex-1 overflow-hidden transition-all duration-300">
       {children}
      </div>

      {/* Right Side Panel Area (Outside of Editor Page) */}
      {/* We keep the slot always in DOM but with 0 width if not open to avoid Portal errors */}
      <aside 
        id="hotspot-panel-slot" 
        className={`flex-shrink-0 h-full bg-dark-800 transition-all duration-300 shadow-2xl z-50 ${
          !isHotspotPanelOpen 
            ? 'w-0 border-l-0 overflow-hidden invisible' 
            : (isHotspotPanelCollapsed ? 'w-12 border-l border-dark-700 visible' : 'w-80 border-l border-dark-700 visible')
        }`}
      />
    </div>
  );
}
