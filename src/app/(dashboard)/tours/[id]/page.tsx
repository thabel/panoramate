'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TourWithImages } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { UploadZone } from '@/components/dashboard/UploadZone';
import { ShareModal } from '@/components/dashboard/ShareModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Edit, Trash2, Share2, Eye, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TourDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [tour, setTour] = useState<TourWithImages | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    fetchTour();
  }, []);

  const fetchTour = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tours/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTour(data.data);
      }
    } catch (error) {
      console.error('Fetch tour error:', error);
      toast.error('Failed to load tour');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadComplete = (files: any[]) => {
    if (tour) {
      setTour({
        ...tour,
        images: [...tour.images, ...files],
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="bg-dark-800 border border-dark-700 rounded-lg p-12 text-center">
        <p className="text-dark-400">Tour not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">{tour.title}</h1>
            <Badge variant={tour.status === 'PUBLISHED' ? 'success' : 'warning'}>
              {tour.status}
            </Badge>
          </div>
          {tour.description && (
            <p className="text-dark-400">{tour.description}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Link href={`/tours/${tour.id}/editor`}>
            <Button variant="primary" className="flex items-center gap-2">
              <Edit size={18} />
              Editor
            </Button>
          </Link>
          <Button
            variant="secondary"
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Share2 size={18} />
            Share
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-4">
          <p className="text-dark-400 text-sm mb-1">Scenes</p>
          <p className="text-2xl font-bold text-white flex items-center gap-2">
            <ImageIcon size={20} />
            {tour.images.length}
          </p>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-4">
          <p className="text-dark-400 text-sm mb-1">Views</p>
          <p className="text-2xl font-bold text-white flex items-center gap-2">
            <Eye size={20} />
            {tour.viewCount}
          </p>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-4">
          <p className="text-dark-400 text-sm mb-1">Status</p>
          <p className="text-2xl font-bold text-white">
            {tour.isPublic ? '🌐 Public' : '🔒 Private'}
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Scenes</h2>
        <UploadZone tourId={tour.id} onUploadComplete={handleUploadComplete} />
      </div>

      {/* Images Grid */}
      {tour.images.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Uploaded Scenes ({tour.images.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tour.images.map((image) => (
              <Link
                key={image.id}
                href={`/tours/${tour.id}/editor?scene=${image.id}`}
              >
                <div className="relative group cursor-pointer rounded-lg overflow-hidden bg-dark-700">
                  <img
                    src={`/api/uploads/${image.filename}`}
                    alt={image.title}
                    className="w-full h-32 object-cover group-hover:scale-110 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-medium">
                      {image.title}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        tourId={tour.id}
        tourTitle={tour.title}
        isPublic={tour.isPublic}
      />
    </div>
  );
}
