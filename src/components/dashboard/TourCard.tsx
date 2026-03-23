'use client';

import React from 'react';
import Link from 'next/link';
import { TourWithImages } from '@/types';
import { Eye, Image, MoreVertical, Edit, Share2, Trash2, Globe } from 'lucide-react';
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
    <div className="rounded-lg bg-dark-800 border border-dark-700 overflow-hidden hover:border-primary-500 transition-colors group">
      {/* Cover Image */}
      <div className="relative h-48 bg-dark-700 overflow-hidden">
        {coverImage ? (
          <img
            src={`/api/uploads/${coverImage.filename}`}
            alt={tour.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-dark-500">
            <Image size={40} />
          </div>
        )}

        {/* 360° Badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="plan">360°</Badge>
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant={tour.status === 'PUBLISHED' ? 'success' : 'warning'}>
            {tour.status}
          </Badge>
        </div>

        {/* Public Badge */}
        {tour.isPublic && (
          <div className="absolute bottom-3 right-3">
            <div className="bg-primary-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
              <Globe size={12} />
              Public
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white truncate">{tour.title}</h3>

        {tour.description && (
          <p className="text-dark-400 text-sm mt-1 line-clamp-2">
            {tour.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 text-sm text-dark-400">
          <div className="flex items-center gap-1">
            <Image size={16} />
            <span>{tour.images.length} scenes</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye size={16} />
            <span>{tour.viewCount} views</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Link
            href={`/tours/${tour.id}/editor`}
            className="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
          >
            <Edit size={14} />
            Edit
          </Link>

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="px-3 py-2 hover:bg-dark-700 rounded-lg transition-colors relative"
          >
            <MoreVertical size={16} className="text-dark-400" />

            {showMenu && (
              <div className="absolute top-full right-0 mt-1 bg-dark-900 border border-dark-700 rounded-lg shadow-lg z-10 min-w-max">
                <button
                  onClick={() => {
                    onShare?.(tour.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-dark-200 hover:bg-dark-800 flex items-center gap-2 text-sm"
                >
                  <Share2 size={14} />
                  Share
                </button>
                <button
                  onClick={() => {
                    onDelete?.(tour.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-red-400 hover:bg-dark-800 flex items-center gap-2 text-sm border-t border-dark-700"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
