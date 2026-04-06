'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { MarzipanoViewer } from '@/components/viewer/MarzipanoViewer';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SceneNavigation } from '@/components/viewer/SceneNavigation';
import { TopSceneMenu } from '@/components/viewer/TopSceneMenu';
import { HotspotContentPanel } from '@/components/viewer/HotspotContentPanel';
import { Maximize, Minimize, ChevronLeft, ChevronRight, Volume2, VolumeX, Play, Pause, Settings, Grid3x3, ChevronDown } from 'lucide-react';

export default function PublicTourPage({
  params,
}: {
  params: { shareToken: string };
}) {
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get('embed') === 'true';
  const [tour, setTour] = useState<any | null>(null);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [showHotspotTitles, setShowHotspotTitles] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<any | null>(null);
  const [showSceneNavigation, setShowSceneNavigation] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetchTour();
    
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  useEffect(() => {
    if (tour?.backgroundAudioVolume !== undefined) {
      setVolume(tour.backgroundAudioVolume);
    }
  }, [tour]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error('Audio playback failed:', err);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const getNextSceneId = () => {
    if (!tour || !currentSceneId) return null;
    const currentIndex = tour.images.findIndex((img: any) => img.id === currentSceneId);
    const nextIndex = (currentIndex + 1) % tour.images.length;
    return tour.images[nextIndex].id;
  };

  const getPrevSceneId = () => {
    if (!tour || !currentSceneId) return null;
    const currentIndex = tour.images.findIndex((img: any) => img.id === currentSceneId);
    const prevIndex = (currentIndex - 1 + tour.images.length) % tour.images.length;
    return tour.images[prevIndex].id;
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
        setShowHotspotTitles(data.data.showHotspotTitles ?? true);
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
    if ((hotspot.type === 'LINK' || hotspot.type === 'LINK_SCENE') && hotspot.targetImageId) {
      setCurrentSceneId(hotspot.targetImageId);
      setActiveHotspot(null);
    } else {
      setActiveHotspot(hotspot);
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
      <div className="flex items-center justify-center h-screen bg-dark-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-900">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-white">{error}</h1>
          <p className="text-dark-400">
            The tour you're looking for doesn't exist or is no longer public.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col h-screen overflow-hidden bg-black">
      {/* Compact Header - Top Left Corner */}
      {!isEmbed && !isFullScreen && (
        <div className="absolute top-4 left-4 z-30 max-w-xs">
          <h1 className="text-sm font-semibold text-white truncate">{tour.title}</h1>
          <p className="text-xs text-dark-400">
            {tour.viewCount} views {tour.organization && `• ${tour.organization.name}`}
          </p>
        </div>
      )}

      {/* Viewer */}
      <div className="relative flex-1 group/viewer">
        {tour.images.length > 0 ? (
          <>
            <MarzipanoViewer
              scenes={tour.images}
              hotspots={tour.images.flatMap((img: any) => img.hotspots || [])}
              initialSceneId={currentSceneId || undefined}
              onHotspotClick={handleHotspotClick}
              editorMode={false}
              showHotspotTitles={showHotspotTitles}
            />

            {/* Custom Logo overlay */}
            {tour.customLogoUrl && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-[120px] max-h-[120px] pointer-events-none drop-shadow-2xl opacity-80">
                <img
                  src={`/api/uploads/${tour.customLogoUrl}`}
                  alt="Logo"
                  className="object-contain w-full h-full filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
                />
              </div>
            )}

            {/* Bottom Navigation Controls */}
            {tour.images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
                {/* Previous Scene Button */}
                <button
                  onClick={() => {
                    const id = getPrevSceneId();
                    if (id) setCurrentSceneId(id);
                  }}
                  className="p-3 text-white transition-all border rounded-full bg-dark-900/50 hover:bg-dark-800 backdrop-blur-md border-dark-700/50 active:scale-90"
                  title="Previous Scene"
                >
                  <ChevronLeft size={24} />
                </button>

                {/* Scene Counter */}
                <div className="px-4 py-2 text-sm font-medium text-white bg-dark-900/50 rounded-full backdrop-blur-md border border-dark-700/50">
                  {tour.images.findIndex((img: any) => img.id === currentSceneId) + 1} / {tour.images.length}
                </div>

                {/* Next Scene Button */}
                <button
                  onClick={() => {
                    const id = getNextSceneId();
                    if (id) setCurrentSceneId(id);
                  }}
                  className="p-3 text-white transition-all border rounded-full bg-dark-900/50 hover:bg-dark-800 backdrop-blur-md border-dark-700/50 active:scale-90"
                  title="Next Scene"
                >
                  <ChevronRight size={24} />
                </button>

                {/* Toggle Scene Grid Button */}
                {tour.showSceneMenu !== false && tour.images.length > 1 && (
                  <button
                    onClick={() => setShowSceneNavigation(!showSceneNavigation)}
                    className="p-3 text-white transition-all border rounded-full bg-dark-900/50 hover:bg-dark-800 backdrop-blur-md border-dark-700/50 active:scale-90"
                    title={showSceneNavigation ? 'Hide scenes grid' : 'Show scenes grid'}
                  >
                    <Grid3x3 size={20} />
                  </button>
                )}
              </div>
            )}

            {/* Top Right Controls Group */}
            <div className="absolute z-30 flex items-center gap-2 top-4 right-4">
              {/* Scene Menu */}
              {tour.showSceneMenu !== false && tour.images.length > 1 && (
                <TopSceneMenu
                  scenes={tour.images}
                  currentSceneId={currentSceneId}
                  onSceneSelect={setCurrentSceneId}
                />
              )}

              {/* Audio Controls */}
              {tour.backgroundAudioUrl && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-900/60 hover:bg-dark-800 backdrop-blur-sm border border-dark-700/50 rounded-lg transition-all group/audio">
                  <button
                    onClick={togglePlay}
                    className="text-white transition-colors hover:text-primary-400"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                  
                  <div className="w-px h-4 mx-1 bg-dark-700/50" />
                  
                  <button
                    onClick={toggleMute}
                    className="text-white transition-colors hover:text-primary-400"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>

                  <div className="flex items-center w-0 overflow-hidden transition-all duration-300 group-hover/audio:w-20">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => {
                        setVolume(parseFloat(e.target.value));
                        if (isMuted) setIsMuted(false);
                      }}
                      className="w-full h-1 ml-2 rounded-lg appearance-none cursor-pointer bg-dark-700 accent-primary-500"
                    />
                  </div>
                  
                  <audio
                    ref={audioRef}
                    src={`/api/uploads/${tour.backgroundAudioUrl}`}
                    loop
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                </div>
              )}

              {/* Full screen button toggle */}
              <button
                onClick={toggleFullScreen}
                className="flex items-center justify-center p-2 text-white transition-all border rounded-lg bg-dark-900/60 hover:bg-dark-800 backdrop-blur-sm border-dark-700/50"
                title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
              >
                {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>

              {/* Settings Panel Button */}
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="flex items-center justify-center p-2 text-white transition-all border rounded-lg bg-dark-900/60 hover:bg-dark-800 backdrop-blur-sm border-dark-700/50"
                title="Viewer Settings"
              >
                <Settings size={20} />
              </button>
            </div>

            {/* Bottom Scene Navigation Grid - Collapsible */}
            {tour.showSceneMenu !== false && showSceneNavigation && (
              <SceneNavigation
                scenes={tour.images}
                currentSceneId={currentSceneId}
                onSceneSelect={setCurrentSceneId}
                showMenu={true}
              />
            )}

            {isSettingsOpen && (
              <div className="absolute z-30 w-64 p-4 space-y-4 border shadow-2xl top-20 right-4 rounded-xl bg-dark-900/95 backdrop-blur-md border-dark-700/50 animate-fade-in">
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-white">Display Settings</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 p-2 transition-all rounded cursor-pointer hover:bg-dark-800">
                      <input
                        type="checkbox"
                        checked={showHotspotTitles}
                        onChange={(e) => setShowHotspotTitles(e.target.checked)}
                        className="w-4 h-4 rounded accent-primary-500"
                      />
                      <span className="text-sm text-dark-300">Show hotspot titles</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-dark-400">
            <p>No scenes in this tour</p>
          </div>
        )}
      </div>

      {/* Compact Footer - Bottom Right Corner */}
      {!isEmbed && !isFullScreen && (
        <div className="absolute bottom-4 right-4 z-20 text-xs text-dark-400">
          Powered by <span className="font-semibold text-primary-400">Panoramate</span>
        </div>
      )}

      <HotspotContentPanel
        hotspot={activeHotspot}
        onClose={() => setActiveHotspot(null)}
      />
    </div>
  );
}
