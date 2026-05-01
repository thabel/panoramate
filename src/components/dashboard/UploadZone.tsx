'use client';

import React, { useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, RotateCw } from 'lucide-react';
import { FileUploadState, TourImage } from '@/types';
import toast from 'react-hot-toast';

interface UploadZoneProps {
  tourId: string;
  onUploadComplete: (files: TourImage[]) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ tourId, onUploadComplete }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploads, setUploads] = React.useState<FileUploadState[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRefs = useRef<Map<string, XMLHttpRequest>>(new Map());

  const uploadFile = async (uploadState: FileUploadState) => {
    const formData = new FormData();
    formData.append('file', uploadState.file);

    return new Promise<TourImage>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhrRefs.current.set(uploadState.id, xhr);

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploads((prev) =>
            prev.map((u) =>
              u.id === uploadState.id
                ? { ...u, progress: Math.round(percentComplete), status: 'uploading' }
                : u
            )
          );
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        console.log('Upload response:', xhr.status, xhr.responseText);
        if (xhr.status === 200 || xhr.status === 201) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success && response.data) {
              setUploads((prev) =>
                prev.map((u) =>
                  u.id === uploadState.id
                    ? {
                        ...u,
                        progress: 100,
                        status: 'complete',
                        result: response.data,
                      }
                    : u
                )
              );
              resolve(response.data);
            } else {
              throw new Error(response.error || 'Upload failed');
            }
          } catch (error) {
            const errorMsg =
              error instanceof Error ? error.message : 'Failed to parse response';
            setUploads((prev) =>
              prev.map((u) =>
                u.id === uploadState.id
                  ? { ...u, status: 'error', error: errorMsg }
                  : u
              )
            );
            reject(error);
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            const errorMsg = error.error || `Upload failed (${xhr.status})`;
            setUploads((prev) =>
              prev.map((u) =>
                u.id === uploadState.id
                  ? { ...u, status: 'error', error: errorMsg }
                  : u
              )
            );
            reject(new Error(errorMsg));
          } catch {
            setUploads((prev) =>
              prev.map((u) =>
                u.id === uploadState.id
                  ? { ...u, status: 'error', error: `Upload failed (${xhr.status})` }
                  : u
              )
            );
            reject(new Error(`Upload failed (${xhr.status})`));
          }
        }
        xhrRefs.current.delete(uploadState.id);
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        const errorMsg = 'Network error during upload';
        setUploads((prev) =>
          prev.map((u) =>
            u.id === uploadState.id
              ? { ...u, status: 'error', error: errorMsg }
              : u
          )
        );
        reject(new Error(errorMsg));
        xhrRefs.current.delete(uploadState.id);
      });

      xhr.addEventListener('abort', () => {
        const errorMsg = 'Upload cancelled';
        setUploads((prev) =>
          prev.map((u) =>
            u.id === uploadState.id
              ? { ...u, status: 'error', error: errorMsg }
              : u
          )
        );
        reject(new Error(errorMsg));
        xhrRefs.current.delete(uploadState.id);
      });

      // Start upload
      xhr.open('POST', `/api/tours/${tourId}/images`);
      xhr.send(formData);
    });
  };

  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files);

    // Create upload states for all files
    const newUploads: FileUploadState[] = fileArray.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      filename: file.name,
      originalName: file.name,
      file,
      progress: 0,
      status: 'pending',
    }));

    setUploads((prev) => [...prev, ...newUploads]);

    // Upload files sequentially (you can change to parallel if needed)
    const completedImages: TourImage[] = [];

    for (const uploadState of newUploads) {
      try {
        const result = await uploadFile(uploadState);
        completedImages.push(result);
      } catch (error) {
        console.error(`Failed to upload ${uploadState.filename}:`, error);
        // Continue with next file even if one fails
      }
    }

    // Notify parent of completed uploads
    if (completedImages.length > 0) {
      toast.success(`${completedImages.length} image(s) uploaded successfully`);
      onUploadComplete(completedImages);
    }

    // Clear input for next upload
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRetry = (id: string) => {
    const upload = uploads.find((u) => u.id === id);
    if (upload) {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === id
            ? { ...u, progress: 0, status: 'pending', error: undefined }
            : u
        )
      );
      uploadFile({ ...upload, progress: 0, status: 'pending', error: undefined })
        .then((result) => {
          // Already updated in uploadFile
        })
        .catch((error) => {
          console.error('Retry failed:', error);
        });
    }
  };

  const handleCancel = (id: string) => {
    const xhr = xhrRefs.current.get(id);
    if (xhr && xhr.readyState !== XMLHttpRequest.DONE) {
      xhr.abort();
    }
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const handleClearCompleted = () => {
    setUploads((prev) => prev.filter((u) => u.status !== 'complete'));
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

  const isUploading = uploads.some((u) => u.status === 'uploading');
  const completedCount = uploads.filter((u) => u.status === 'complete').length;
  const errorCount = uploads.filter((u) => u.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Upload Drop Zone */}
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
          disabled={isUploading}
          className="hidden"
        />

        {uploads.length === 0 ? (
          <>
            <Upload className="mx-auto mb-3 text-primary-400" size={32} />
            <p className="mb-1 font-medium text-white">Drag and drop 360° images</p>
            <p className="mb-4 text-sm text-dark-400">or click to select files</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-6 py-2 font-medium text-white transition-colors rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-dark-500 disabled:cursor-not-allowed"
            >
              Select Images
            </button>
            <p className="mt-4 text-xs text-dark-500">
              Supported formats: JPEG, PNG, WebP (up to 100MB each)
            </p>
          </>
        ) : (
          <div className="space-y-3">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="flex items-center gap-4 p-4 text-left rounded-lg bg-dark-700"
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  {upload.status === 'complete' ? (
                    <CheckCircle className="text-green-500" size={24} />
                  ) : upload.status === 'error' ? (
                    <AlertCircle className="text-red-500" size={24} />
                  ) : upload.status === 'uploading' ? (
                    <div className="w-6 h-6 border-2 rounded-full border-primary-500 border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-dark-600" />
                  )}
                </div>

                {/* File Info & Progress */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-white truncate">
                      {upload.filename}
                    </p>
                    <span className="flex-shrink-0 ml-2 text-xs text-dark-400">
                      {upload.progress}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 overflow-hidden rounded-full bg-dark-600">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        upload.status === 'complete'
                          ? 'bg-green-500'
                          : upload.status === 'error'
                          ? 'bg-red-500'
                          : 'bg-primary-500'
                      }`}
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>

                  {/* Status Text */}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-dark-400">
                      {upload.status === 'uploading' && 'Uploading...'}
                      {upload.status === 'complete' && 'Upload complete'}
                      {upload.status === 'error' && upload.error}
                      {upload.status === 'pending' && 'Waiting...'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-shrink-0 gap-2">
                  {upload.status === 'error' && (
                    <button
                      onClick={() => handleRetry(upload.id)}
                      className="p-2 transition-colors rounded hover:bg-dark-600"
                      title="Retry upload"
                    >
                      <RotateCw size={16} className="text-primary-400" />
                    </button>
                  )}
                  {upload.status !== 'complete' && (
                    <button
                      onClick={() => handleCancel(upload.id)}
                      className="p-2 transition-colors rounded hover:bg-dark-600"
                      title="Remove from queue"
                    >
                      <X size={16} className="text-red-500" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Summary and Actions */}
            {(completedCount > 0 || errorCount > 0) && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-dark-600">
                <p className="text-sm text-dark-300">
                  {completedCount > 0 && (
                    <span className="font-medium text-green-500">{completedCount} completed</span>
                  )}
                  {completedCount > 0 && errorCount > 0 && ' • '}
                  {errorCount > 0 && (
                    <span className="font-medium text-red-500">{errorCount} failed</span>
                  )}
                </p>
                {completedCount > 0 && (
                  <button
                    onClick={handleClearCompleted}
                    className="text-sm transition-colors text-primary-400 hover:text-primary-300"
                  >
                    Clear completed
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
