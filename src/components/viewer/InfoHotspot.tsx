'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Hotspot } from '@/types';

interface InfoHotspotProps {
  hotspot: Hotspot;
  position: { x: number; y: number };
  onClose?: () => void;
}

export const InfoHotspot: React.FC<InfoHotspotProps> = ({ hotspot, position, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    // Detect if device supports touch
    const isMobile = () => {
      return (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.matchMedia('(hover: none)').matches
      );
    };
    setIsTouchDevice(isMobile());
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  // Desktop: Show expanded header on hover (if not already open)
  const showHoverExpanded = !isTouchDevice && isHovering && !isOpen;

  // Mobile: Show full modal
  const showMobileModal = isTouchDevice && isOpen;

  return (
    <>
      {/* Desktop Version */}
      {!isTouchDevice && (
        <div
          className="fixed z-50"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => {
            if (!isOpen) setIsHovering(false);
          }}
        >
          {/* Header (Circle or Expanded Rectangle) */}
          <div
            className={`flex items-center gap-3 bg-gray-900 border border-gray-700 transition-all duration-300 cursor-pointer ${
              isOpen
                ? 'w-72 px-4 py-3 rounded-t-lg rounded-bl-lg'
                : showHoverExpanded
                  ? 'w-64 px-4 py-3 rounded-lg'
                  : 'w-10 h-10 rounded-full justify-center'
            }`}
            onClick={() => setIsOpen(!isOpen)}
          >
            {/* Icon (always visible) */}
            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-blue-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </div>

            {/* Title (visible on hover/open) */}
            {(showHoverExpanded || isOpen) && (
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">{hotspot.title || 'Info'}</h3>
              </div>
            )}

            {/* Close Button (visible on open) */}
            {isOpen && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="flex-shrink-0 p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <X size={16} className="text-gray-400" />
              </button>
            )}
          </div>

          {/* Text Panel (visible on open) */}
          {isOpen && (
            <div
              className="w-72 bg-gray-900 border border-t-0 border-gray-700 rounded-b-lg px-4 py-3 max-h-64 overflow-y-auto"
              style={{
                animation: 'panelSlide 0.4s ease-out',
              }}
            >
              <p className="text-sm text-gray-200 whitespace-pre-wrap">{hotspot.content || 'No content'}</p>
            </div>
          )}
        </div>
      )}

      {/* Mobile Version - Full Screen Modal */}
      {isTouchDevice && isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex flex-col"
          onClick={() => handleClose()}
        >
          <div
            className="flex-1 flex flex-col m-4 bg-gray-900 rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-700">
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-blue-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              </div>
              <h2 className="flex-1 text-lg font-semibold text-white">{hotspot.title || 'Info'}</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <p className="text-sm text-gray-200 whitespace-pre-wrap">{hotspot.content || 'No content'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile: Click to open */}
      {isTouchDevice && !isOpen && (
        <div
          className="fixed z-50 w-10 h-10 rounded-full bg-gray-900 border border-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
          onClick={() => setIsOpen(true)}
        >
          <div className="w-5 h-5 flex items-center justify-center text-blue-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes panelSlide {
          from {
            opacity: 0;
            transform: rotateX(-10deg);
            transform-origin: top;
          }
          to {
            opacity: 1;
            transform: rotateX(0deg);
          }
        }
      `}</style>
    </>
  );
};
