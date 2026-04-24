'use client';

import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface UploadZoneProps {
  tourId: string;
  onUploadComplete: (files: any[]) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ tourId, onUploadComplete }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [previews, setPreviews] = React.useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    try {
      setIsLoading(true);
      const formData = new FormData();

      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch(`/api/tours/${tourId}/images`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Upload failed');
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast.success(`${data.data.length} images uploaded`);
        onUploadComplete(data.data);
        setPreviews([]);
      }
    } catch (error) {
      toast.error('Upload failed');
      console.error('Upload error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging
          ? 'border-primary-500 bg-primary-900/10'
          : 'border-dark-600 hover:border-primary-500'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center">
          <LoadingSpinner size="md" />
          <p className="text-dark-300 mt-4">Uploading...</p>
        </div>
      ) : (
        <>
          <Upload className="mx-auto mb-3 text-primary-400" size={32} />
          <p className="text-white font-medium mb-1">Drag and drop 360° images</p>
          <p className="text-dark-400 text-sm mb-4">or click to select files</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            Select Images
          </button>
          <p className="text-dark-500 text-xs mt-4">
            Supported formats: JPEG, PNG, WebP (up to 100MB each)
          </p>
        </>
      )}
    </div>
  );
};
