'use client';

import React from 'react';
import { HOTSPOT_ICONS_SVG } from '@/lib/hotspotIconsSvg';
import { HOTSPOT_ICON_CONFIG, HotspotIconType } from '@/lib/hotspotIconsConfig';

interface HotspotIconSelectorProps {
  selectedIcon: HotspotIconType;
  onIconSelect: (icon: HotspotIconType) => void;
}

/**
 * Renders SVG icon content
 */
const renderIcon = (iconName: string, size: number = 20) => {
  const svg = HOTSPOT_ICONS_SVG[iconName];
  if (!svg) return null;

  return (
    <div
      dangerouslySetInnerHTML={{ __html: svg }}
      style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      className="text-white"
    />
  );
};

export const HotspotIconSelector: React.FC<HotspotIconSelectorProps> = ({
  selectedIcon,
  onIconSelect,
}) => {
  const navigationIcons: HotspotIconType[] = ['ArrowRight', 'MapPin'];
  const actionIcons: HotspotIconType[] = ['ExternalLink', 'Link', 'Play', 'Video'];
  const contentIcons: HotspotIconType[] = ['MessageCircle', 'Camera'];
  const otherIcons: HotspotIconType[] = ['info'];

  const renderIconGroup = (title: string, icons: HotspotIconType[]) => (
    <div className="space-y-3">
      <p className="text-[10px] font-bold text-dark-500 uppercase tracking-wider">{title}</p>
      <div className="grid grid-cols-4 gap-2">
        {icons.map((iconName) => {
          const config = HOTSPOT_ICON_CONFIG[iconName];
          return (
            <button
              key={iconName}
              onClick={() => onIconSelect(iconName)}
              className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all group ${
                selectedIcon === iconName
                  ? 'bg-primary-500/30 border-2 border-primary-500'
                  : 'bg-dark-700 border-2 border-dark-600 hover:border-primary-400'
              }`}
              title={config.label}
            >
              <div className="flex items-center justify-center mb-2">
                {renderIcon(iconName, 24)}
              </div>
              <span className="text-[10px] font-medium text-center text-dark-300 group-hover:text-primary-300 line-clamp-2">
                {config.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="block mb-3 text-sm font-medium text-dark-300">Hotspot Icon Type</label>
        <p className="mb-4 text-xs text-dark-400">Select an icon type to configure</p>
      </div>

      {renderIconGroup('Navigation', navigationIcons)}
      {renderIconGroup('External Links', actionIcons)}
      {renderIconGroup('Content', contentIcons)}
      {renderIconGroup('Other', otherIcons)}
    </div>
  );
};
