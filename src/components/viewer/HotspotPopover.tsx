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
            <div className="max-w-xs text-sm text-gray-200 line-clamp-3">
              {hotspot.content || 'No content'}
            </div>
          </div>
        );
      case 'URL':
        return (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-400">External Link</div>
            <div className="max-w-xs text-sm text-blue-400 truncate">
              {hotspot.url || 'No URL'}
            </div>
          </div>
        );
      case 'VIDEO':
        return (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-400">Video</div>
            <div className="max-w-xs text-sm text-gray-200 truncate">
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
      className="fixed p-1 bg-black pointer-events-none"
      style={{
        left: `${position.x + 48}px`,
        top: `${position.y}px`,
        maxWidth: '280px',
      }}
    >
     
      {getPreviewContent()}
    </div>
  );
};
