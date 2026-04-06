'use client';

import React, { useState, useMemo } from 'react';
import {
  HOTSPOT_ICON_CONFIG,
  HotspotIconType,
  getIconConfig,
  validateHotspotData,
} from '@/lib/hotspotIconsConfig';
import { TourImage } from '@/types';
import { Search, AlertCircle } from 'lucide-react';

interface HotspotConfigFormProps {
  iconName: HotspotIconType;
  tourImages: TourImage[];
  currentImageId: string;
  formData: Record<string, any>;
  onFormChange: (field: string, value: any) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

export const HotspotConfigForm: React.FC<HotspotConfigFormProps> = ({
  iconName,
  tourImages,
  currentImageId,
  formData,
  onFormChange,
  onValidationChange,
}) => {
  const [sceneSearchQuery, setSceneSearchQuery] = useState('');
  const [selectionMode, setSelectionMode] = useState<'name' | 'image'>('name');
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({});

  const config = getIconConfig(iconName);

  // Validate form whenever data changes
  React.useEffect(() => {
    const validation = validateHotspotData(iconName, formData);
    onValidationChange?.(validation.valid, validation.errors);
  }, [formData, iconName, onValidationChange]);

  const renderFieldInput = (fieldName: string, fieldConfig: any) => {
    const fieldValue = formData[fieldName] || '';

    switch (fieldConfig.type) {
      case 'text':
        return (
          <input
            type="text"
            value={fieldValue}
            onChange={(e) => onFormChange(fieldName, e.target.value)}
            placeholder={fieldConfig.placeholder}
            className="w-full px-3 py-2 text-sm text-white transition-all border rounded-lg outline-none bg-dark-700 border-dark-600 focus:border-primary-500"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={fieldValue}
            onChange={(e) => onFormChange(fieldName, e.target.value)}
            placeholder={fieldConfig.placeholder}
            rows={4}
            className="w-full px-3 py-2 text-sm text-white transition-all border rounded-lg outline-none resize-none bg-dark-700 border-dark-600 focus:border-primary-500"
          />
        );

      case 'select':
        // For target scene selection
        if (fieldName === 'targetImageId') {
          return (
            <div className="space-y-3">
              <div className="flex w-full p-1 border rounded-lg bg-dark-900 border-dark-700">
                <button
                  onClick={() => setSelectionMode('name')}
                  className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all ${
                    selectionMode === 'name' ? 'bg-primary-600 text-white' : 'text-dark-400'
                  }`}
                >
                  By Name
                </button>
                <button
                  onClick={() => setSelectionMode('image')}
                  className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all ${
                    selectionMode === 'image' ? 'bg-primary-600 text-white' : 'text-dark-400'
                  }`}
                >
                  By Image
                </button>
              </div>

              {selectionMode === 'name' ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute -translate-y-1/2 left-3 top-1/2 text-dark-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search scene..."
                      value={sceneSearchQuery}
                      onChange={(e) => setSceneSearchQuery(e.target.value)}
                      className="w-full py-2 pl-10 pr-4 text-xs text-white border rounded-lg outline-none bg-dark-900 border-dark-700 focus:border-primary-500"
                    />
                  </div>
                  <div className="pr-1 space-y-1 overflow-y-auto max-h-48 scrollbar-thin">
                    {tourImages
                      .filter((img) =>
                        img.id !== currentImageId &&
                        (img.title || `Scene ${img.order + 1}`).toLowerCase().includes(sceneSearchQuery.toLowerCase())
                      )
                      .map((img) => (
                        <button
                          key={img.id}
                          onClick={() => onFormChange('targetImageId', img.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all border ${
                            fieldValue === img.id
                              ? 'bg-primary-600/20 border-primary-500 text-white'
                              : 'bg-dark-900/40 border-transparent text-dark-300'
                          }`}
                        >
                          {img.title || `Scene ${img.order + 1}`}
                        </button>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pr-1 overflow-y-auto max-h-48 scrollbar-thin">
                  {tourImages
                    .filter((img) => img.id !== currentImageId)
                    .map((img) => (
                      <button
                        key={img.id}
                        onClick={() => onFormChange('targetImageId', img.id)}
                        className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                          fieldValue === img.id ? 'border-primary-500' : 'border-transparent'
                        }`}
                      >
                        <img
                          src={`/api/uploads/${img.filename}`}
                          alt={img.title || 'Scene'}
                          className="object-cover w-full h-16"
                        />
                      </button>
                    ))}
                </div>
              )}
            </div>
          );
        }
        return null;

      case 'file-upload':
        // For single video/image upload
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-4 border-2 border-dashed rounded-lg border-dark-600 hover:border-primary-500 transition-colors bg-dark-900/50">
              <input
                type="file"
                accept={fieldName === 'videoUrl' ? 'video/*' : 'image/*'}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadedFiles({ ...uploadedFiles, [fieldName]: file });
                    onFormChange(fieldName, file.name);
                  }
                }}
                className="hidden"
                id={`upload-${fieldName}`}
              />
              <label
                htmlFor={`upload-${fieldName}`}
                className="flex-1 cursor-pointer text-sm text-dark-300 hover:text-primary-400 transition-colors"
              >
                {uploadedFiles[fieldName] ? (
                  <span className="text-primary-400">✓ {uploadedFiles[fieldName].name}</span>
                ) : (
                  <span>Click to upload {fieldName === 'videoUrl' ? 'video' : 'image'}</span>
                )}
              </label>
            </div>
            <div className="text-xs text-dark-400">
              Or paste a URL:
              <input
                type="text"
                value={fieldValue}
                onChange={(e) => onFormChange(fieldName, e.target.value)}
                placeholder={fieldConfig.placeholder}
                className="w-full mt-2 px-3 py-2 text-sm text-white transition-all border rounded-lg outline-none bg-dark-700 border-dark-600 focus:border-primary-500"
              />
            </div>
          </div>
        );

      case 'file-upload-multiple':
        // For 1-2 image upload (Camera)
        const imageUrls = Array.isArray(fieldValue)
          ? fieldValue
          : typeof fieldValue === 'string' && fieldValue
          ? JSON.parse(fieldValue)
          : [];

        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-4 border-2 border-dashed rounded-lg border-dark-600 hover:border-primary-500 transition-colors bg-dark-900/50">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []).slice(0, 2); // Limit to 2
                  if (files.length > 0) {
                    setUploadedFiles({ ...uploadedFiles, [fieldName]: files[0] });
                    onFormChange(fieldName, files.map(f => f.name).join(', '));
                  }
                }}
                className="hidden"
                id={`upload-${fieldName}`}
              />
              <label
                htmlFor={`upload-${fieldName}`}
                className="flex-1 cursor-pointer text-sm text-dark-300 hover:text-primary-400 transition-colors"
              >
                {uploadedFiles[fieldName] ? (
                  <span className="text-primary-400">✓ {uploadedFiles[fieldName].name}</span>
                ) : (
                  <span>Click to upload 1-2 images</span>
                )}
              </label>
            </div>
            {imageUrls.length > 0 && (
              <div className="text-xs text-dark-400">
                {imageUrls.length} image{imageUrls.length > 1 ? 's' : ''} selected
              </div>
            )}
            <div className="text-xs text-dark-400">
              Or paste image URLs (comma-separated):
              <textarea
                value={typeof fieldValue === 'string' ? fieldValue : ''}
                onChange={(e) => onFormChange(fieldName, e.target.value)}
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                rows={3}
                className="w-full mt-2 px-3 py-2 text-sm text-white transition-all border rounded-lg outline-none resize-none bg-dark-700 border-dark-600 focus:border-primary-500"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto scrollbar-hide">
      {/* Config Description */}
      <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
        <p className="text-sm font-medium text-primary-300">{config.label}</p>
        <p className="mt-1 text-xs text-primary-200">{config.description}</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {config.fields.map((field) => (
          <div key={field.name} className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-dark-200">
              {field.label}
              {field.required && <span className="text-red-400">*</span>}
            </label>

            {field.description && (
              <p className="text-xs text-dark-400">{field.description}</p>
            )}

            {renderFieldInput(field.name, field)}
          </div>
        ))}
      </div>

      {/* Validation Errors */}
      {(() => {
        const validation = validateHotspotData(iconName, formData);
        return (
          !validation.valid && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-400" />
                <div className="text-xs text-red-300">
                  {validation.errors.map((error, idx) => (
                    <div key={idx}>{error}</div>
                  ))}
                </div>
              </div>
            </div>
          )
        );
      })()}
    </div>
  );
};
