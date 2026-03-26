'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { MarzipanoViewer } from '@/components/viewer/MarzipanoViewer';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Maximize, Minimize, ChevronUp, ChevronDown, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { TourWithImages } from '@/types';

export default function PublicTourPage({
  params,
}: {
  params: { shareToken: string };
}) {
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get('embed') === 'true';
  const [tour, setTour] = useState<TourWithImages | null>(null);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTour();
    
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const getNextSceneId = () => {
    if (!tour || !currentSceneId) return null;
    const currentIndex = tour.images.findIndex(img => img.id === currentSceneId);
    const nextIndex = (currentIndex + 1) % tour.images.length;
    return tour.images[nextIndex].id;
  };

  const getPrevSceneId = () => {
    if (!tour || !currentSceneId) return null;
    const currentIndex = tour.images.findIndex(img => img.id === currentSceneId);
    const prevIndex = (currentIndex - 1 + tour.images.length) % tour.images.length;
    return tour.images[prevIndex].id;
  };

  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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
        if (data.data.images && data.data.images.length > 0) {
          setCurrentSceneId(data.data.images[0].id);
        }
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

  const handleHotspotClick = (hotspot: any) => {
    if (hotspot.type === 'LINK' && hotspot.targetImageId) {
      setCurrentSceneId(hotspot.targetImageId);
    } else if (hotspot.type === 'INFO') {
      // Potentially show info content if we want
      if (hotspot.title || hotspot.content) {
        alert(`${hotspot.title || ''}\n\n${hotspot.content || ''}`);
      }
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
      <div className="flex-1 relative group/viewer">
        {tour.images.length > 0 ? (
          <>
            <MarzipanoViewer
              scenes={tour.images}
              hotspots={tour.images.flatMap(img => (img as any).hotspots || [])}
              initialSceneId={currentSceneId || undefined}
              onHotspotClick={handleHotspotClick}
              editorMode={false}
            />

            {/* Main Carousel Navigation */}
            {tour.images.length > 1 && (
              <>
                <button
                  onClick={() => {
                    const id = getPrevSceneId();
                    if (id) setCurrentSceneId(id);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-dark-900/40 hover:bg-dark-900/80 text-white rounded-full backdrop-blur-md transition-all border border-dark-700/50 opacity-0 group-hover/viewer:opacity-100 active:scale-90"
                  title="Previous Scene"
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  onClick={() => {
                    const id = getNextSceneId();
                    if (id) setCurrentSceneId(id);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-dark-900/40 hover:bg-dark-900/80 text-white rounded-full backdrop-blur-md transition-all border border-dark-700/50 opacity-0 group-hover/viewer:opacity-100 active:scale-90"
                  title="Next Scene"
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}

            {/* Full screen button toggle */}
            <button
              onClick={toggleFullScreen}
              className="absolute top-4 right-4 z-30 p-2 bg-dark-900/60 hover:bg-dark-800 text-white rounded-lg backdrop-blur-sm transition-all border border-dark-700/50"
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            >
              {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>

            {/* Scene Switcher */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center w-full max-w-[95vw]">
              <button
                onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                className={`flex items-center gap-2 bg-dark-900/80 hover:bg-dark-800 text-white px-4 py-2 rounded-full backdrop-blur-md border border-dark-700/50 transition-all shadow-lg mb-3 active:scale-95 ${
                  isSwitcherOpen ? 'ring-2 ring-primary-500/50' : ''
                }`}
              >
                <Layers size={18} className="text-primary-400" />
                <span className="text-sm font-medium">Browse scenes</span>
                {isSwitcherOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
              
              {isSwitcherOpen && (
                <div className="relative w-full max-w-4xl px-12 group/switcher">
                  {/* Thumbnail Scroll Buttons */}
                  <button
                    onClick={() => scrollThumbnails('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-40 p-2 bg-dark-900/80 hover:bg-primary-600 text-white rounded-full shadow-xl border border-dark-700/50 transition-all active:scale-90 opacity-0 group-hover/switcher:opacity-100"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div 
                    ref={scrollContainerRef}
                    className="bg-dark-900/80 backdrop-blur-md border border-dark-700/50 rounded-2xl p-3 w-full overflow-x-auto flex gap-3 scrollbar-hide shadow-2xl animate-fade-in"
                  >
                    {tour.images.map((image) => (
                      <button
                        key={image.id}
                        onClick={() => setCurrentSceneId(image.id)}
                        className={`relative flex-shrink-0 w-28 h-20 rounded-xl overflow-hidden border-2 transition-all group ${
                          currentSceneId === image.id 
                            ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                            : 'border-transparent hover:border-dark-500'
                        }`}
                      >
                        <img
                          src={`/api/uploads/${image.filename}`}
                          alt={image.title || image.originalName}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2 text-[10px] font-medium text-white truncate text-center">
                          {image.title || image.originalName}
                        </div>
                        {currentSceneId === image.id && (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                        )}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => scrollThumbnails('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-40 p-2 bg-dark-900/80 hover:bg-primary-600 text-white rounded-full shadow-xl border border-dark-700/50 transition-all active:scale-90 opacity-0 group-hover/switcher:opacity-100"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>

            <style jsx global>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>
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
