'use client';

import { useEffect, useState } from 'react';
import { MarzipanoViewer } from '@/components/viewer/MarzipanoViewer';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { TourWithImages } from '@/types';

export default function PublicTourPage({
  params,
}: {
  params: { shareToken: string };
}) {
  const [tour, setTour] = useState<TourWithImages | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTour();
  }, []);

  const fetchTour = async () => {
    try {
      const response = await fetch(
        `/api/tours-public/${params.shareToken}/public`
      );

      if (!response.ok) {
        setError('Tour not found or is private');
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setTour(data.data);
      } else {
        setError('Failed to load tour');
      }
    } catch (err) {
      setError('Error loading tour');
      console.error('Fetch tour error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-dark-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="h-screen flex items-center justify-center bg-dark-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">{error}</h1>
          <p className="text-dark-400">
            The tour you're looking for doesn't exist or is no longer public.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-dark-900 border-b border-dark-700 px-4 py-4">
        <h1 className="text-xl font-bold text-white">{tour.title}</h1>
        <p className="text-dark-400 text-sm">
          {tour.viewCount} views
          {tour.organization && ` • ${tour.organization.name}`}
        </p>
      </div>

      {/* Viewer */}
      <div className="flex-1">
        {tour.images.length > 0 ? (
          <MarzipanoViewer
            scenes={tour.images}
            editorMode={false}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-dark-400">
            <p>No scenes in this tour</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-dark-900 border-t border-dark-700 px-4 py-3 text-center text-sm text-dark-400">
        Powered by <span className="text-primary-400 font-semibold">Panoramate</span>
      </div>
    </div>
  );
}
