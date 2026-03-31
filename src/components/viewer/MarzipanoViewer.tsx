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
  tempHotspot?: { yaw: number; pitch: number } | null;
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
  tempHotspot = null,
  onHotspotClick,
  onPanoramaClick,
  onHotspotMove,
}) => {

  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const scenesRef = useRef<{ [key: string]: any }>({});
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const hotspotElementsRef = useRef<{ [key: string]: any }>({});
  const draggingRef = useRef<{
    hotspotId: string;
    isDragging: boolean;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  // Store hotspots in a ref to access latest values in handlers without re-binding
  const hotspotsRef = useRef(hotspots);
  useEffect(() => {
    hotspotsRef.current = hotspots;
  }, [hotspots]);

  const prevScenesIdsRef = useRef<string>('');

  // Main Viewer Initialization
  useEffect(() => {
    if (!containerRef.current || scenes.length === 0) return;

    // Only re-initialize if the scene IDs or order changed
    const currentScenesIds = scenes.map(s => s.id).join(',');
    if (currentScenesIds === prevScenesIdsRef.current && viewerRef.current) {
      return;
    }
    prevScenesIdsRef.current = currentScenesIds;

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

  // Separate Hotspot Click/Create Handler - FIXED coordinate calculation
  useEffect(() => {
    const handleContainerClick = (e: MouseEvent) => {
      if (!addHotspotMode || !viewerRef.current || !containerRef.current) return;

      const scene = viewerRef.current.scene();
      if (!scene) return;

      const view = scene.view();

      // FIXED: Get the exact canvas dimensions and position
      const canvas = containerRef.current.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      // Calculate position relative to canvas element accounting for any offset
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Validate coordinates are within canvas bounds
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

      const coords = view.screenToCoordinates({ x, y });
      if (coords && onPanoramaClick) {
        logger.debug({ x, y, yaw: coords.yaw, pitch: coords.pitch }, 'Hotspot position clicked');
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

  // Helper function to create consistent hotspot elements with drag support
  const createHotspotElement = (
    type: 'LINK' | 'INFO' | 'TEMP',
    hotspotId?: string,
    onClick?: () => void,
    onDragStart?: (e: MouseEvent) => void
  ) => {
    // 1. The Host element: Marzipano will manage this element's transform.
    const host = document.createElement('div');
    host.className = 'marzipano-hotspot-host';
    host.style.position = 'absolute';
    host.style.width = '0px';
    host.style.height = '0px';

    // 2. The Visual element: This is where we put our styles, size and centering.
    const visual = document.createElement('div');
    const size = type === 'TEMP' ? 32 : 42;
    visual.className = `marzipano-hotspot-visual ${type === 'TEMP' ? 'temp-preview' : 'cursor-pointer'}`;

    visual.style.position = 'absolute';
    visual.style.width = `${size}px`;
    visual.style.height = `${size}px`;
    visual.style.left = '0px';
    visual.style.top = '0px';
    visual.style.transform = 'translate(-50%, -50%)';
    visual.style.transition = 'transform 0.2s ease-out';
    visual.style.display = 'flex';
    visual.style.alignItems = 'center';
    visual.style.justifyContent = 'center';
    visual.style.willChange = 'transform';

    if (type === 'TEMP') {
      visual.className += ' text-white border-2 border-white rounded-full shadow-lg bg-primary-500 animate-pulse';
      visual.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14M5 12h14"></path>
        </svg>
      `;
    } else if (type === 'LINK') {
      visual.innerHTML = `<img src="/icons/link.png" style="width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));" alt="Link" />`;
    } else {
      visual.style.borderRadius = '50%';
      visual.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
      visual.style.border = '2px solid #6366f1';
      visual.innerHTML = '<span style="color: #6366f1; font-weight: bold; font-size: 18px;">i</span>';
    }

    // Store hotspot ID for drag operations
    if (hotspotId && editorMode && type !== 'TEMP') {
      (visual as any).dataset.hotspotId = hotspotId;
      visual.style.cursor = 'grab';
    }

    host.appendChild(visual);

    if (onClick) {
      visual.onmousedown = (e: MouseEvent) => {
        // Check if this is a drag operation in editor mode
        if (editorMode && hotspotId && !addHotspotMode) {
          if (onDragStart) {
            onDragStart(e);
          }
          return;
        }
        // Regular click handling
        e.stopPropagation();
        onClick();
      };

      visual.onmouseover = () => {
        if (!draggingRef.current?.isDragging) {
          visual.style.transform = 'translate(-50%, -50%) scale(1.15)';
          if (editorMode && type !== 'TEMP') {
            (visual as any).style.cursor = 'grab';
          }
        }
      };
      visual.onmouseout = () => {
        if (!draggingRef.current?.isDragging) {
          visual.style.transform = 'translate(-50%, -50%)';
        }
      };
    }

    return host;
  };

  // Handle hotspot dragging
  const handleHotspotDragStart = (hotspotId: string, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!viewerRef.current || !containerRef.current) return;

    draggingRef.current = {
      hotspotId,
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    };

    const canvas = containerRef.current.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!draggingRef.current || !draggingRef.current.isDragging) return;

      const scene = viewerRef.current.scene();
      if (!scene) return;

      const view = scene.view();
      const rect = canvas.getBoundingClientRect();

      const x = moveEvent.clientX - rect.left;
      const y = moveEvent.clientY - rect.top;

      // Validate coordinates are within canvas bounds
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

      const coords = view.screenToCoordinates({ x, y });
      if (coords) {
        draggingRef.current.moved = true;
        // Optionally could update preview here
        logger.debug({ hotspotId, x, y, yaw: coords.yaw, pitch: coords.pitch }, 'Dragging hotspot');
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      if (!draggingRef.current || !draggingRef.current.isDragging) return;

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      if (draggingRef.current.moved) {
        const scene = viewerRef.current.scene();
        if (!scene) return;

        const view = scene.view();
        const rect = canvas.getBoundingClientRect();

        const x = upEvent.clientX - rect.left;
        const y = upEvent.clientY - rect.top;

        // Validate final coordinates
        if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
          const coords = view.screenToCoordinates({ x, y });
          if (coords && onHotspotMove) {
            const hotspot = hotspotsRef.current.find(h => h.id === draggingRef.current!.hotspotId);
            if (hotspot) {
              logger.info({ hotspotId, newYaw: coords.yaw, newPitch: coords.pitch }, 'Hotspot drag completed');
              onHotspotMove(hotspot, coords.yaw, coords.pitch);
            }
          }
        }
      }

      draggingRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Hotspot Synchronization with improved coordinate handling
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
    hotspotElementsRef.current = {};

    // Add hotspots to their respective scenes
    hotspots.forEach(hotspot => {
      const scene = scenesRef.current[hotspot.imageId];
      if (!scene) return;

      const element = createHotspotElement(
        hotspot.type as any,
        hotspot.id,
        () => {
          if (onHotspotClick) onHotspotClick(hotspot);
        },
        (e) => handleHotspotDragStart(hotspot.id, e)
      );

      const marzipanoHotspot = scene.hotspotContainer().createHotspot(element, {
        yaw: hotspot.yaw,
        pitch: hotspot.pitch,
      });

      hotspotElementsRef.current[hotspot.id] = marzipanoHotspot;
    });

    // Add temporary preview hotspot if it exists on the CURRENT scene
    if (tempHotspot && currentSceneId) {
      const scene = scenesRef.current[currentSceneId];
      if (scene) {
        const element = createHotspotElement('TEMP');
        scene.hotspotContainer().createHotspot(element, {
          yaw: tempHotspot.yaw,
          pitch: tempHotspot.pitch,
        });
      }
    }
  }, [hotspots, onHotspotClick, tempHotspot, currentSceneId, editorMode, addHotspotMode]);
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
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }
        .animate-pulse {
          animation: pulse 2s infinite;
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
