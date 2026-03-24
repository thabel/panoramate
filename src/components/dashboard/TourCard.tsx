'use client';

import React from 'react';
import Link from 'next/link';
import { TourWithImages } from '@/types';
import { Eye, Image, MoreVertical, Edit, Share2, Trash2, Globe, Info, Play } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface TourCardProps {
  tour: TourWithImages;
  onEdit?: (id: string) => void;
  onShare?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const TourCard: React.FC<TourCardProps> = ({
  tour,
  onEdit,
  onShare,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const coverImage = tour.images[0];

  return (
    <div className="overflow-hidden transition-all duration-300 border rounded-xl bg-dark-800 border-dark-700 hover:border-primary-500/50 hover:shadow-2xl hover:shadow-primary-500/10 group">
      {/* Cover Image */}
      <div className="relative h-48 overflow-hidden bg-dark-700">
        {coverImage ? (
          <img
            src={`/api/uploads/${coverImage.filename}`}
            alt={tour.title}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-dark-500">
            <Image size={48} strokeWidth={1.5} />
          </div>
        )}

        {/* Overlays */}
        <div className="absolute inset-0 transition-opacity opacity-0 bg-gradient-to-t from-dark-900/80 via-transparent to-transparent group-hover:opacity-100" />

        {/* 360° Badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="plan" className="backdrop-blur-md bg-white/10">360°</Badge>
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant={tour.status === 'PUBLISHED' ? 'success' : 'warning'} className="shadow-lg">
            {tour.status}
          </Badge>
        </div>

        {/* Public Badge */}
        {tour.isPublic && (
          <div className="absolute bottom-3 right-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-white rounded-full bg-primary-600 shadow-lg border border-primary-400/20">
              <Globe size={12} />
              Public
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-white transition-colors truncate group-hover:text-primary-400">{tour.title}</h3>

        <p className="mt-1.5 text-sm text-dark-400 line-clamp-2 min-h-[2.5rem]">
          {tour.description || "No description provided for this tour."}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 text-xs font-medium text-dark-400">
          <div className="flex items-center gap-1.5">
            <Image size={14} className="text-primary-500" />
            <span>{tour.images.length} scenes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Eye size={14} className="text-primary-500" />
            <span>{tour.viewCount} views</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-5">
          <Link
            href={`/tours/${tour.id}/editor`}
            className="flex items-center justify-center flex-[2] gap-2 px-4 py-2.5 text-sm font-bold text-white transition-all rounded-lg bg-primary-600 hover:bg-primary-500 hover:shadow-lg hover:shadow-primary-600/20 active:scale-95"
          >
            <Play size={16} fill="currentColor" />
            View
          </Link>

          <Link
            href={`/tours/${tour.id}`}
            className="flex items-center justify-center flex-1 gap-2 px-3 py-2.5 text-sm font-bold transition-all border rounded-lg text-dark-100 border-dark-600 hover:bg-dark-700 hover:border-dark-500 active:scale-95"
          >
            <Info size={16} />
            Details
          </Link>

          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowMenu(!showMenu);
              }}
              className={`p-2.5 transition-all rounded-lg hover:bg-dark-700 active:scale-90 ${showMenu ? 'bg-dark-700 text-white' : 'text-dark-400'}`}
            >
              <MoreVertical size={20} />
            </button>

            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)} 
                />
                <div className="absolute bottom-full right-0 mb-2 z-20 w-44 overflow-hidden border rounded-xl shadow-2xl bg-dark-900 border-dark-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <button
                    onClick={() => {
                      onShare?.(tour.id);
                      setShowMenu(false);
                    }}
                    className="flex items-center w-full gap-3 px-4 py-3 text-sm font-medium transition-colors text-dark-200 hover:bg-dark-800 hover:text-white"
                  >
                    <Share2 size={16} className="text-primary-500" />
                    Share
                  </button>
                  <button
                    onClick={() => {
                      onDelete?.(tour.id);
                      setShowMenu(false);
                    }}
                    className="flex items-center w-full gap-3 px-4 py-3 text-sm font-medium text-red-400 transition-colors border-t hover:bg-red-500/10 border-dark-700"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
