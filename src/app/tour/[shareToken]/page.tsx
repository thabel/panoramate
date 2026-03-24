'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { MarzipanoViewer } from '@/components/viewer/MarzipanoViewer';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Maximize, Minimize } from 'lucide-react';
import { TourWithImages } from '@/types';

export default function PublicTourPage({
  params,
}: {
  params: { shareToken: string };
}) {
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get('embed') === 'true';
  const [tour, setTour] = useState<TourWithImages | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTour();
    
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
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

  const toggleFullScreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
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
    <div ref={containerRef} className="h-screen bg-black flex flex-col overflow-hidden">
      {/* Header - Hidden in embed mode */}
      {!isEmbed && !isFullScreen && (
        <div className="bg-dark-900 border-b border-dark-700 px-4 py-4 z-20">
          <h1 className="text-xl font-bold text-white">{tour.title}</h1>
          <p className="text-dark-400 text-sm">
            {tour.viewCount} views
            {tour.organization && ` • ${tour.organization.name}`}
          </p>
        </div>
      )}

      {/* Viewer */}
      <div className="flex-1 relative">
        {tour.images.length > 0 ? (
          <>
            <MarzipanoViewer
              scenes={tour.images}
              hotspots={tour.images.flatMap(img => (img as any).hotspots || [])}
              editorMode={false}
            />
            {/* Full screen button toggle */}
            <button
              onClick={toggleFullScreen}
              className="absolute top-4 right-4 z-30 p-2 bg-dark-900/60 hover:bg-dark-800 text-white rounded-lg backdrop-blur-sm transition-all border border-dark-700/50"
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            >
              {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-dark-400">
            <p>No scenes in this tour</p>
          </div>
        )}
      </div>

      {/* Footer - Hidden in embed mode */}
      {!isEmbed && !isFullScreen && (
        <div className="bg-dark-900 border-t border-dark-700 px-4 py-3 text-center text-sm text-dark-400 z-20">
          Powered by <span className="text-primary-400 font-semibold">Panoramate</span>
        </div>
      )}
    </div>
  );
}
