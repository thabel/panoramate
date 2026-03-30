'use client';

import { useEffect, useRef, useState } from 'react';
import { TourImage, Hotspot as HotspotType } from '@/types';
import { logger } from '@/lib/logger';

declare global {
  interface Window {
    Marzipano: any;
  }
}

interface MarzipanoViewerProps {
  scenes: TourImage[];
  hotspots?: HotspotType[];
  initialSceneId?: string;
  editorMode?: boolean;
  addHotspotMode?: boolean;
  onHotspotClick?: (hotspot: HotspotType) => void;
  onPanoramaClick?: (yaw: number, pitch: number) => void;
  onHotspotMove?: (hotspot: HotspotType, newYaw: number, newPitch: number) => void;
}

export const MarzipanoViewer: React.FC<MarzipanoViewerProps> = ({
  scenes,
  hotspots = [],
  initialSceneId,
  editorMode = false,
  addHotspotMode = false,
  onHotspotClick,
  onPanoramaClick,
  onHotspotMove,
}) => {

  console.log('MarzipanoViewer props:', { scenes, hotspots, initialSceneId, editorMode, addHotspotMode });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const scenesRef = useRef<{ [key: string]: any }>({});
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const draggingRef = useRef<{
    hotspotId: string;
    isDragging: boolean;
    moved: boolean;
  } | null>(null);

  // Store hotspots in a ref to access latest values in handlers without re-binding
  const hotspotsRef = useRef(hotspots);
  useEffect(() => {
    hotspotsRef.current = hotspots;
  }, [hotspots]);

  // Main Viewer Initialization
  useEffect(() => {
    if (!containerRef.current || scenes.length === 0) return;

    let viewer: any = null;
    let retryInterval: NodeJS.Timeout;

    const initViewer = () => {
      const Marzipano = window.Marzipano;
      if (!Marzipano) return false;

      try {
        if (viewerRef.current) {
          viewerRef.current.destroy();
        }

        const viewerOpts = {
          controls: { mouseViewMode: 'drag' }
        };

        viewer = new Marzipano.Viewer(containerRef.current, viewerOpts);
        viewerRef.current = viewer;

        const marzipanoScenes: { [key: string]: any } = {};
        scenes.forEach((sceneData) => {
          const source = Marzipano.ImageUrlSource.fromString(`/api/uploads/${sceneData.filename}`);
          const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);
          const limiter = Marzipano.RectilinearView.limit.traditional(
            1024, 
            (120 * Math.PI) / 180,
            (120 * Math.PI) / 180
          );
          const view = new Marzipano.RectilinearView({
            yaw: sceneData.initialYaw || 0,
            pitch: sceneData.initialPitch || 0,
            fov: sceneData.initialFov || (110 * Math.PI) / 180
          }, limiter);

          marzipanoScenes[sceneData.id] = viewer.createScene({
            source, geometry, view, pinFirstLevel: true
          });
        });

        scenesRef.current = marzipanoScenes;
        const initialScene = marzipanoScenes[initialSceneId || scenes[0].id];
        if (initialScene) {
          initialScene.switchTo();
          setCurrentSceneId(initialSceneId || scenes[0].id);
        }

        return true;
      } catch (err) {
        console.error('Marzipano initialization error:', err);
        return false;
      }
    };

    if (!initViewer()) {
      retryInterval = setInterval(() => {
        if (initViewer()) clearInterval(retryInterval);
      }, 500);
    }

    return () => {
      if (retryInterval) clearInterval(retryInterval);
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [scenes]); // Removed addHotspotMode from dependencies

  // Separate Hotspot Click Handler
  useEffect(() => {
    const handleContainerClick = (e: MouseEvent) => {
      if (!addHotspotMode || !viewerRef.current || !containerRef.current) return;
      
      const scene = viewerRef.current.scene();
      if (!scene) return;
      
      const view = scene.view();
      const rect = containerRef.current.getBoundingClientRect();
      const localPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      
      const coords = view.screenToCoordinates(localPoint);
      if (coords && onPanoramaClick) {
        onPanoramaClick(coords.yaw, coords.pitch);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('click', handleContainerClick);
    }

    return () => {
      if (container) {
        container.removeEventListener('click', handleContainerClick);
      }
    };
  }, [addHotspotMode, onPanoramaClick]);

  // Handle scene switching
  useEffect(() => {
    if (viewerRef.current && initialSceneId && initialSceneId !== currentSceneId) {
      console.log('Detected scene change request to:', initialSceneId);
      const scene = scenesRef.current[initialSceneId];
      if (scene) {
        console.log('Switching to scene:', initialSceneId);
        scene.switchTo();
        setCurrentSceneId(initialSceneId);
      } else {
        console.warn('Scene not found in scenesRef:', initialSceneId);
      }
    }
  }, [initialSceneId, currentSceneId]);

  // Hotspot Synchronization
  useEffect(() => {
    if (!viewerRef.current) return;

    // Clear all hotspots first (Marzipano keeps them per scene)
    Object.values(scenesRef.current).forEach(scene => {
      const container = scene.hotspotContainer();
      if (container && typeof container.listHotspots === 'function') {
        const existing = container.listHotspots();
        existing.forEach((h: any) => container.destroyHotspot(h));
      }
    });

    // Add hotspots to their respective scenes
    hotspots.forEach(hotspot => {
      const scene = scenesRef.current[hotspot.imageId];
      if (!scene) return;

      const element = document.createElement('div');
      element.className = `marzipano-hotspot custom-hotspot-${hotspot.id} cursor-pointer`;
      
      // Styling for hotspot using link.png
      element.style.width = '42px';
      element.style.height = '42px';
      element.style.display = 'flex';
      element.style.alignItems = 'center';
      element.style.justifyContent = 'center';
      
      if (hotspot.type === 'LINK') {
        element.innerHTML = `<img src="/icons/link.png" style="width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));" alt="Link" />`;
      } else {
        // Info hotspot styling (fallback if needed)
        element.style.borderRadius = '50%';
        element.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        element.style.border = '2px solid #6366f1';
        element.innerHTML = '<span style="color: #6366f1; font-weight: bold; font-size: 18px;">i</span>';
        element.style.width = '32px';
        element.style.height = '32px';
      }

      element.onclick = (e) => {
        e.stopPropagation();
        if (onHotspotClick) onHotspotClick(hotspot);
      };

      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });
  }, [hotspots, onHotspotClick]); // Removed editorMode and onHotspotMove from dependencies

  // Debug logs for hotspot mode
  useEffect(() => {
    logger.debug({ addHotspotMode }, 'addHotspotMode changed');
    if (containerRef.current) {
      const parentClass = containerRef.current.parentElement?.className;
      logger.debug({ parentClass }, 'Container cursor class update');
    }
  }, [addHotspotMode]);

  return (
    <div className={`w-full h-full min-h-[400px] bg-black relative ${addHotspotMode ? 'hotspot-cursor' : ''}`}>
      <div
        ref={containerRef}
        className="w-full h-full"
      />
      <style jsx global>{`
        .marzipano-hotspot {
          z-index: 10;
        }
        .marzipano-hotspot:hover {
          transform: scale(1.1);
        }
        .hotspot-cursor, 
        .hotspot-cursor *,
        .hotspot-cursor canvas,
        .hotspot-cursor .marzipano-container {
          cursor: url('/icons/link.png') 16 16, crosshair !important;
        }
      `}</style>
    </div>
  );
};
