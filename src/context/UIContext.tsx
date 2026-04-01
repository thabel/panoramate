'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface UIContextType {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  isHotspotPanelOpen: boolean;
  setIsHotspotPanelOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isHotspotPanelCollapsed: boolean;
  setIsHotspotPanelCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  toggleSidebar: () => void;
  toggleHotspotPanel: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsedState] = useState(false);
  const [isHotspotPanelOpen, setIsHotspotPanelOpenState] = useState(false);
  const [isHotspotPanelCollapsed, setIsHotspotPanelCollapsed] = useState(false);

  const setIsSidebarCollapsed = useCallback((collapsed: boolean | ((prev: boolean) => boolean)) => {
    setIsSidebarCollapsedState((prev) => {
      const next = typeof collapsed === 'function' ? collapsed(prev) : collapsed;
      // If we open the sidebar (expanded), we must close the hotspot panel
      if (!next) {
        setIsHotspotPanelOpenState(false);
      }
      return next;
    });
  }, []);

  const setIsHotspotPanelOpen = useCallback((open: boolean | ((prev: boolean) => boolean)) => {
    setIsHotspotPanelOpenState((prev) => {
      const next = typeof open === 'function' ? open(prev) : open;
      // If we open the hotspot panel, we must collapse the sidebar
      if (next) {
        setIsSidebarCollapsedState(true);
      }
      return next;
    });
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, [setIsSidebarCollapsed]);

  const toggleHotspotPanel = useCallback(() => {
    setIsHotspotPanelOpen((prev) => !prev);
  }, [setIsHotspotPanelOpen]);

  return (
    <UIContext.Provider
      value={{
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isHotspotPanelOpen,
        setIsHotspotPanelOpen,
        isHotspotPanelCollapsed,
        setIsHotspotPanelCollapsed,
        toggleSidebar,
        toggleHotspotPanel,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
