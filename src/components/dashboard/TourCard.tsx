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
    <div className="overflow-hidden transition-colors border rounded-lg bg-dark-800 border-dark-700 hover:border-primary-500 group">
      {/* Cover Image */}
      <div className="relative h-48 overflow-hidden bg-dark-700">
        {coverImage ? (
          <img
            src={`/api/uploads/${coverImage.filename}`}
            alt={tour.title}
            className="object-cover w-full h-full transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-dark-500">
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
            <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white rounded bg-primary-600">
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
          <p className="mt-1 text-sm text-dark-400 line-clamp-2">
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
            className="flex items-center justify-center flex-1 gap-1 px-3 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-primary-600 hover:bg-primary-700"
          >
            <Edit size={14} />
            
          </Link>

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="relative px-3 py-2 transition-colors rounded-lg hover:bg-dark-700"
          >
            <MoreVertical size={16} className="text-dark-400" />

            {showMenu && (
              <div className="absolute right-0 z-10 mt-1 border rounded-lg shadow-lg top-full bg-dark-900 border-dark-700 min-w-max">
                <button
                  onClick={() => {
                    onShare?.(tour.id);
                    setShowMenu(false);
                  }}
                  className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left text-dark-200 hover:bg-dark-800"
                >
                  <Share2 size={14} />
                  Share
                </button>
                <button
                  onClick={() => {
                    onDelete?.(tour.id);
                    setShowMenu(false);
                  }}
                  className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left text-red-400 border-t hover:bg-dark-800 border-dark-700"
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
