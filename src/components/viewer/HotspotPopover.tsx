'use client';

import React from 'react';
import { Hotspot } from '@/types';

interface HotspotPopoverProps {
  hotspot: Hotspot;
  visible: boolean;
  position: { x: number; y: number } | null;
  scenes?: { id: string; title?: string }[];
}

export const HotspotPopover: React.FC<HotspotPopoverProps> = ({
  hotspot,
  visible,
  position,
  scenes = [],
}) => {
  if (!visible || !position) return null;

  const getTargetSceneName = () => {
    if (hotspot.type !== 'LINK' || !hotspot.targetImageId) return '';
    const scene = scenes.find(s => s.id === hotspot.targetImageId);
    return scene?.title || 'Unknown Scene';
  };

  const getPreviewContent = () => {
    switch (hotspot.type) {
      case 'LINK':
        return (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-400">Go to:</div>
            <div className="text-sm font-medium text-white truncate">
              {getTargetSceneName()}
            </div>
          </div>
        );
      case 'INFO':
        return (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-400">Information</div>
            <div className="text-sm text-gray-200 line-clamp-3 max-w-xs">
              {hotspot.content || 'No content'}
            </div>
          </div>
        );
      case 'URL':
        return (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-400">External Link</div>
            <div className="text-sm text-blue-400 truncate max-w-xs">
              {hotspot.url || 'No URL'}
            </div>
          </div>
        );
      case 'VIDEO':
        return (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-400">Video</div>
            <div className="text-sm text-gray-200 truncate max-w-xs">
              {hotspot.videoUrl || 'No video'}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-2 pointer-events-none"
      style={{
        left: `${position.x + 10}px`,
        top: `${position.y + 10}px`,
        maxWidth: '280px',
      }}
    >
      {hotspot.title && (
        <div className="text-sm font-bold text-white mb-2 truncate">
          {hotspot.title}
        </div>
      )}
      {getPreviewContent()}
    </div>
  );
};
