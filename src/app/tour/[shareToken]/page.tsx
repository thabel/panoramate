'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { MarzipanoViewer } from '@/components/viewer/MarzipanoViewer';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SceneNavigation } from '@/components/viewer/SceneNavigation';
import { TopSceneMenu } from '@/components/viewer/TopSceneMenu';
import { HotspotContentPanel } from '@/components/viewer/HotspotContentPanel';
import { Maximize, Minimize, ChevronLeft, ChevronRight, Volume2, VolumeX, Play, Pause, Settings , ChevronDown  } from 'lucide-react';

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
  const [isCarouselVisible, setIsCarouselVisible] = useState(true);
  const [activeHotspot, setActiveHotspot] = useState<any | null>(null);
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
    <div ref={containerRef} className="relative flex flex-col h-screen overflow-hidden font-sans bg-black">
      {/* Viewer Container */}
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

            {/* Floating Minimal Header */}
            {!isEmbed && !isFullScreen && (
              <div className="absolute z-40 max-w-xs pointer-events-none top-6 left-6 animate-fade-in">
                <div className="p-4 border shadow-2xl pointer-events-auto rounded-2xl bg-dark-900/40 backdrop-blur-md border-white/10">
                  <h1 className="text-lg font-bold leading-tight text-white truncate">{tour.title}</h1>
                  {tour.organization && (
                    <p className="text-[10px] font-medium text-dark-400 uppercase tracking-widest mt-1">
                      {tour.organization.name}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Custom Logo overlay */}
            {tour.customLogoUrl && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 max-w-[100px] max-h-[100px] pointer-events-none drop-shadow-2xl opacity-90 transition-opacity hover:opacity-100">
                <img
                  src={`/api/uploads/${tour.customLogoUrl}`}
                  alt="Logo"
                  className="object-contain w-full h-full filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                />
              </div>
            )}

            {/* Main Navigation Arrows (Side) */}
            {tour.images.length > 1 && (
              <>
                <button
                  onClick={() => {
                    const id = getPrevSceneId();
                    if (id) setCurrentSceneId(id);
                  }}
                  className="absolute z-30 p-4 text-white transition-all -translate-y-1/2 border rounded-full shadow-2xl opacity-0 left-6 top-1/2 bg-dark-900/40 hover:bg-primary-600/80 backdrop-blur-md border-white/10 group-hover/viewer:opacity-100 active:scale-90"
                  title="Previous Scene"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  onClick={() => {
                    const id = getNextSceneId();
                    if (id) setCurrentSceneId(id);
                  }}
                  className="absolute z-30 p-4 text-white transition-all -translate-y-1/2 border rounded-full shadow-2xl opacity-0 right-6 top-1/2 bg-dark-900/40 hover:bg-primary-600/80 backdrop-blur-md border-white/10 group-hover/viewer:opacity-100 active:scale-90"
                  title="Next Scene"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}

            {/* Top Right Controls Group */}
            <div className="absolute z-30 flex items-center gap-3 top-6 right-6">
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
                <div className="flex items-center gap-2 px-3 py-2 transition-all border shadow-xl bg-dark-900/40 hover:bg-dark-900/60 backdrop-blur-md border-white/10 rounded-xl group/audio">
                  <button
                    onClick={togglePlay}
                    className="text-white transition-colors hover:text-primary-400"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  
                  <div className="w-px h-4 mx-1 bg-white/10" />
                  
                  <button
                    onClick={toggleMute}
                    className="text-white transition-colors hover:text-primary-400"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
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
                className="flex items-center justify-center p-2.5 text-white transition-all border rounded-xl bg-dark-900/40 hover:bg-dark-900/60 backdrop-blur-md border-white/10 shadow-xl"
                title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
              >
                {isFullScreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>

              {/* Settings Panel Button */}
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="flex items-center justify-center p-2.5 text-white transition-all border rounded-xl bg-dark-900/40 hover:bg-dark-900/60 backdrop-blur-md border-white/10 shadow-xl"
                title="Viewer Settings"
              >
                <Settings size={18} />
              </button>
            </div>

            {/* Bottom Scene Navigation Carousel Toggle Button */}
            {tour.showSceneMenu !== false && tour.images.length > 1 && (
              <div className="absolute bottom-0 z-40 pb-6 transition-transform duration-500 ease-in-out -translate-x-1/2 left-1/2" 
                   style={{ transform: `translateX(-50%) translateY(${isCarouselVisible ? '-110px' : '0'})` }}>
                <button
                  onClick={() => setIsCarouselVisible(!isCarouselVisible)}
                  className={`flex items-center justify-center w-12 h-12 text-white transition-all border rounded-full shadow-2xl backdrop-blur-md ${
                    isCarouselVisible 
                      ? 'bg-primary-600 border-primary-500 rotate-180' 
                      : 'bg-dark-900/60 border-white/10 hover:bg-dark-900/80'
                  }`}
                  title={isCarouselVisible ? 'Hide Scenes' : 'Show Scenes'}
                >
                  <ChevronDown size={24} />
                </button>
              </div>
            )}

            {/* Bottom Scene Navigation Carousel */}
            {tour.showSceneMenu !== false && (
              <div className={`transition-all duration-500 ease-in-out ${isCarouselVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}>
                <SceneNavigation
                  scenes={tour.images}
                  currentSceneId={currentSceneId}
                  onSceneSelect={setCurrentSceneId}
                  showMenu={true}
                />
              </div>
            )}

            {isSettingsOpen && (
              <div className="absolute z-30 w-64 p-5 space-y-4 border shadow-2xl top-24 right-6 rounded-2xl bg-dark-900/90 backdrop-blur-xl border-white/10 animate-fade-in">
                <div>
                  <h3 className="mb-4 text-xs font-bold tracking-widest uppercase text-dark-400">Display Settings</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 transition-all border border-transparent cursor-pointer rounded-xl bg-white/5 hover:bg-white/10 hover:border-white/10">
                      <input
                        type="checkbox"
                        checked={showHotspotTitles}
                        onChange={(e) => setShowHotspotTitles(e.target.checked)}
                        className="w-4 h-4 rounded accent-primary-500"
                      />
                      <span className="text-sm font-medium text-white">Show titles</span>
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

      {/* Footer Branding - Floating Bottom Right */}
      {!isEmbed && !isFullScreen && (
        <div className="absolute bottom-6 right-6 z-20 px-3 py-1.5 rounded-full text-[10px] font-bold text-white uppercase tracking-widest bg-dark-900/40 backdrop-blur-md border border-white/10 shadow-xl opacity-60 hover:opacity-100 transition-opacity">
          Powered by <span className="text-primary-400">Panoramate</span>
        </div>
      )}

      <HotspotContentPanel
        hotspot={activeHotspot}
        onClose={() => setActiveHotspot(null)}
      />
    </div>
  );
}
