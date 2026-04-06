'use client';

import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Play, Image as ImageIcon, FileText } from 'lucide-react';
import { Hotspot } from '@/types';

interface HotspotContentPanelProps {
  hotspot: Hotspot | null;
  onClose: () => void;
}

export const HotspotContentPanel: React.FC<HotspotContentPanelProps> = ({ hotspot, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (hotspot) {
      // Small delay to trigger animation
      const timer = setTimeout(() => setIsOpen(true), 10);
      return () => clearTimeout(timer);
    }
    setIsOpen(false);
    return undefined;
  }, [hotspot]);

  if (!hotspot && !isOpen) return null;

  const renderContent = () => {
    if (!hotspot) return null;

    switch (hotspot.type) {
      case 'INFO':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary-400">
              <FileText size={20} />
              <span className="font-semibold uppercase tracking-wider text-xs">Information</span>
            </div>
            <h3 className="text-xl font-bold text-white">{hotspot.title}</h3>
            <div className="text-dark-200 leading-relaxed whitespace-pre-wrap">
              {hotspot.content}
            </div>
          </div>
        );

      case 'URL':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-primary-400">
              <ExternalLink size={20} />
              <span className="font-semibold uppercase tracking-wider text-xs">External Link</span>
            </div>
            <h3 className="text-xl font-bold text-white">{hotspot.title}</h3>
            <p className="text-dark-300">Click the button below to visit the linked website.</p>
            <a
              href={hotspot.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-900/20"
            >
              Visit Website
              <ExternalLink size={18} />
            </a>
          </div>
        );

      case 'VIDEO':
        const isExternal = hotspot.videoUrl?.startsWith('http');
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary-400">
              <Play size={20} />
              <span className="font-semibold uppercase tracking-wider text-xs">Video Content</span>
            </div>
            <h3 className="text-xl font-bold text-white">{hotspot.title}</h3>
            <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl border border-dark-700">
              {isExternal ? (
                <iframe
                  src={hotspot.videoUrl?.replace('watch?v=', 'embed/')}
                  className="w-full h-full"
                  allowFullScreen
                />
              ) : (
                <video
                  src={`/api/uploads/${hotspot.videoUrl}`}
                  controls
                  className="w-full h-full"
                />
              )}
            </div>
          </div>
        );

      case 'IMAGE':
        const imageUrls = hotspot.imageUrls ? JSON.parse(hotspot.imageUrls) : (hotspot.imageUrl ? [hotspot.imageUrl] : []);
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary-400">
              <ImageIcon size={20} />
              <span className="font-semibold uppercase tracking-wider text-xs">Image Gallery</span>
            </div>
            <h3 className="text-xl font-bold text-white">{hotspot.title}</h3>
            <div className="grid gap-4">
              {imageUrls.map((url: string, idx: number) => (
                <div key={idx} className="rounded-xl overflow-hidden border border-dark-700 shadow-xl">
                  <img
                    src={url.startsWith('http') ? url : `/api/uploads/${url}`}
                    alt={`${hotspot.title} ${idx + 1}`}
                    className="w-full h-auto object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-dark-400 text-sm">No content available for this hotspot type.</p>
          </div>
        );
    }
  };

  return (
    <div 
      className={`fixed inset-y-0 left-0 z-[100] w-full max-w-md bg-dark-900/95 backdrop-blur-xl border-r border-dark-700 shadow-2xl transition-transform duration-500 ease-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <div className="text-lg font-bold text-white">Hotspot Details</div>
          <button
            onClick={() => {
              setIsOpen(false);
              setTimeout(onClose, 500);
            }}
            className="p-2 hover:bg-dark-800 rounded-full text-dark-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-dark-700 bg-dark-950/50">
          <button
            onClick={() => {
              setIsOpen(false);
              setTimeout(onClose, 500);
            }}
            className="w-full py-3 bg-dark-800 hover:bg-dark-700 text-white rounded-xl font-medium transition-colors border border-dark-700"
          >
            Close
          </button>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}</style>
    </div>
  );
};
