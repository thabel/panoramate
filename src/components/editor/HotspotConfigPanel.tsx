'use client';

import React, { useState } from 'react';
import { TourImage } from '@/types';
import { HotspotIconType } from '@/lib/hotspotIconsConfig';
import { HotspotIconSelector } from './HotspotIconSelector';
import { HotspotConfigForm } from './HotspotConfigForm';
import { Button } from '@/components/ui/Button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface HotspotConfigPanelProps {
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onClose?: () => void;
  tourImages: TourImage[];
  currentImageId: string;
  selectedHotspot?: any;
  onSave: (hotspotData: Record<string, any>) => Promise<void>;
  isSaving?: boolean;
}

export const HotspotConfigPanel: React.FC<HotspotConfigPanelProps> = ({
  isCollapsed = false,
  onCollapsedChange,
  onClose,
  tourImages,
  currentImageId,
  selectedHotspot,
  onSave,
  isSaving = false,
}) => {
  const [selectedIcon, setSelectedIcon] = useState<HotspotIconType>(
    (selectedHotspot?.iconName as HotspotIconType) || 'MapPin'
  );

  console.log('Selected Hotspot:', selectedHotspot);

  const [formData, setFormData] = useState<Record<string, any>>(
    selectedHotspot || {
      title: '',
      content: '',
      url: '',
      videoUrl: '',
      imageUrls: '',
      targetImageId: '',
    }
  );

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isFormValid, setIsFormValid] = useState(false);

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!isFormValid) return;

    try {
      await onSave({
        iconName: selectedIcon,
        ...formData,
      });
    } catch (error) {
      console.error('Error saving hotspot:', error);
    }
  };

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center w-20 gap-6 py-6 border-r bg-dark-800 border-dark-700">
        <button
          onClick={() => onCollapsedChange?.(false)}
          className="p-2 transition-colors rounded-lg hover:bg-dark-700 text-dark-400"
          title="Expand Panel"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="w-px h-12 bg-dark-700" />
        <div
          className="vertical-text text-[10px] font-bold text-dark-400 uppercase tracking-[0.2em] whitespace-nowrap select-none"
          style={{ writingMode: 'vertical-rl' }}
        >
          Configuration
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-l bg-dark-900 border-dark-700">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700 bg-dark-900/50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onCollapsedChange?.(true)}
            className="p-1 transition-colors rounded-lg hover:bg-dark-700 text-dark-400"
            title="Collapse Panel"
          >
            <ChevronRight size={20} />
          </button>
          <h2 className="text-lg font-semibold text-white">Configure Hotspot</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 transition-colors rounded-lg hover:bg-dark-700 text-dark-400"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Icon Selector and Form */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-6 space-y-6">
            {/* Icon Selection */}
            <div className="space-y-4">
              <HotspotIconSelector selectedIcon={selectedIcon} onIconSelect={setSelectedIcon} />
            </div>

            {/* Divider */}
            <div className="h-px bg-dark-700" />

            {/* Dynamic Form */}
            <HotspotConfigForm
              iconName={selectedIcon}
              tourImages={tourImages}
              currentImageId={currentImageId}
              formData={formData}
              onFormChange={handleFormChange}
              onValidationChange={(isValid, errors) => {
                setIsFormValid(isValid);
                setValidationErrors(errors);
              }}
            />
          </div>
        </div>

        {/* Footer - Action Buttons */}
        <div className="flex flex-shrink-0 gap-3 p-6 border-t border-dark-700 bg-dark-900/50">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1 text-xs"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!isFormValid}
            isLoading={isSaving}
            className="flex-1 text-xs"
          >
            {selectedHotspot ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
};
