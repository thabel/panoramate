'use client';

import { HOTSPOT_ICONS, HotspotIconId } from '@/lib/hotspotIcons';
import { Modal } from '@/components/ui/Modal';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface HotspotIconPickerProps {
  isOpen: boolean;
  onSelect: (iconId: HotspotIconId) => void;
  onCancel: () => void;
}

export const HotspotIconPicker: React.FC<HotspotIconPickerProps> = ({
  isOpen,
  onSelect,
  onCancel,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Choose Hotspot Icon">
      <div className="p-6">
        <p className="mb-6 text-sm text-dark-300">
          Select an icon for your hotspot. The icon defines what the hotspot does.
        </p>

        {/* Icon Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6 md:grid-cols-5">
          {HOTSPOT_ICONS.map((iconConfig) => {
            // Get the actual Lucide icon component
            const IconComponent = (LucideIcons as Record<string, any>)[iconConfig.iconName];

            if (!IconComponent) {
              console.warn(`Icon not found: ${iconConfig.iconName}`);
              return null;
            }

            return (
              <button
                key={iconConfig.id}
                onClick={() => onSelect(iconConfig.id as HotspotIconId)}
                className="flex flex-col items-center gap-2 p-4 rounded-lg transition-all border-2 border-transparent hover:border-primary-500 hover:bg-dark-700 active:bg-primary-600/20"
                title={iconConfig.description}
              >
                <div
                  className="p-3 rounded-lg transition-colors"
                  style={{ backgroundColor: `${iconConfig.color}20` }}
                >
                  <IconComponent
                    size={28}
                    style={{ color: iconConfig.color }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-white">
                    {iconConfig.name}
                  </p>
                  <p className="text-[10px] text-dark-400">
                    {iconConfig.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-3 justify-end border-t border-dark-700 pt-4">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};
