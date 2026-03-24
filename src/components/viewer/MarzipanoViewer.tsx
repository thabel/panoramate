'use client';

import { useEffect, useRef, useState } from 'react';
import { TourImage, Hotspot as HotspotType } from '@/types';

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
      if (!Marzipano) {
        console.log('Marzipano not yet loaded, retrying...');
        return false;
      }

      console.log('Initializing Marzipano with', scenes.length, 'scenes');

      try {
        // Clear previous viewer if it exists
        if (viewerRef.current) {
          viewerRef.current.destroy();
          viewerRef.current = null;
        }

        const viewerOpts = {
          controls: {
            mouseViewMode: 'drag'
          }
        };

        viewer = new Marzipano.Viewer(containerRef.current, viewerOpts);
        viewerRef.current = viewer;

        // Create Scenes
        const marzipanoScenes: { [key: string]: any } = {};
        scenes.forEach((sceneData) => {
          const imageUrl = `/api/uploads/${sceneData.filename}`;
          console.log('Creating scene for', imageUrl);
          const source = Marzipano.ImageUrlSource.fromString(imageUrl);
          const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);
          
          const limiter = Marzipano.RectilinearView.limit.traditional(
            1024, 
            (120 * Math.PI) / 180, // max vertical fov
            (120 * Math.PI) / 180  // max horizontal fov
          );
          
          const view = new Marzipano.RectilinearView({
            yaw: sceneData.initialYaw || 0,
            pitch: sceneData.initialPitch || 0,
            fov: sceneData.initialFov || (110 * Math.PI) / 180
          }, limiter);

          const scene = viewer.createScene({
            source: source,
            geometry: geometry,
            view: view,
            pinFirstLevel: true
          });

          marzipanoScenes[sceneData.id] = scene;
        });

        scenesRef.current = marzipanoScenes;

        // Set initial scene
        const initialSceneIdToUse = initialSceneId || scenes[0].id;
        const initialScene = marzipanoScenes[initialSceneIdToUse];
        if (initialScene) {
          console.log('Switching to initial scene:', initialSceneIdToUse);
          initialScene.switchTo();
          setCurrentSceneId(initialSceneIdToUse);
        } else {
          console.warn('Initial scene not found:', initialSceneIdToUse);
        }

        return true;
      } catch (err) {
        console.error('Marzipano initialization error:', err);
        return false;
      }
    };

    if (!initViewer()) {
      retryInterval = setInterval(() => {
        if (initViewer()) {
          clearInterval(retryInterval);
        }
      }, 500);
    }

    // Global click handler for adding hotspots
    const handleContainerClick = (e: MouseEvent) => {
      if (!addHotspotMode || !viewerRef.current) return;
      
      const scene = viewerRef.current.scene();
      if (!scene) return;
      
      const view = scene.view();
      const point = { x: e.clientX, y: e.clientY };
      const rect = containerRef.current!.getBoundingClientRect();
      const localPoint = {
        x: point.x - rect.left,
        y: point.y - rect.top
      };
      
      const coords = view.screenToCoordinates(localPoint);
      if (coords && onPanoramaClick) {
        onPanoramaClick(coords.yaw, coords.pitch);
      }
    };

    containerRef.current.addEventListener('click', handleContainerClick);

    return () => {
      if (retryInterval) clearInterval(retryInterval);
      if (containerRef.current) {
        containerRef.current.removeEventListener('click', handleContainerClick);
      }
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [scenes, addHotspotMode]);

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
      element.className = `marzipano-hotspot custom-hotspot-${hotspot.id} ${editorMode ? 'cursor-move' : 'cursor-pointer'}`;
      
      // Basic styling for hotspot
      element.style.width = '32px';
      element.style.height = '32px';
      element.style.borderRadius = '50%';
      element.style.backgroundColor = hotspot.type === 'LINK' ? 'rgba(99, 102, 241, 0.8)' : 'rgba(255, 255, 255, 0.8)';
      element.style.border = '2px solid white';
      element.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      element.style.display = 'flex';
      element.style.alignItems = 'center';
      element.style.justifyContent = 'center';
      
      // Icon or Text
      if (hotspot.type === 'LINK') {
        element.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>';
      } else {
        element.innerHTML = '<span style="color: #374151; font-weight: bold;">i</span>';
      }

      // Drag logic
      if (editorMode) {
        let isDragging = false;
        let startX = 0;
        let startY = 0;

        element.onmousedown = (e) => {
          e.stopPropagation();
          isDragging = true;
          startX = e.clientX;
          startY = e.clientY;
          draggingRef.current = { hotspotId: hotspot.id, isDragging: true, moved: false };
          
          const onMouseMove = (moveEvent: MouseEvent) => {
            if (!isDragging) return;
            
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
              draggingRef.current!.moved = true;
            }

            const rect = containerRef.current!.getBoundingClientRect();
            const localPoint = {
              x: moveEvent.clientX - rect.left,
              y: moveEvent.clientY - rect.top
            };
            
            const scene = viewerRef.current.scene();
            const view = scene.view();
            const coords = view.screenToCoordinates(localPoint);
            
            if (coords) {
              // We can't easily update hotspot position in Marzipano without destroying/recreating 
              // or accessing private properties. For now, we'll just move the element visually 
              // or let it be updated on mouseup.
              // Actually, Marzipano hotspots have a `setPosition` but it might not be public.
              // Let's try to update the hotspot's position in the container.
              const container = scene.hotspotContainer();
              if (container && typeof container.listHotspots === 'function') {
                const marzipanoHotspot = container.listHotspots().find((h: any) => h.domElement() === element);
                if (marzipanoHotspot && typeof marzipanoHotspot.setPosition === 'function') {
                  marzipanoHotspot.setPosition({ yaw: coords.yaw, pitch: coords.pitch });
                }
              }
            }
          };

          const onMouseUp = (upEvent: MouseEvent) => {
            if (!isDragging) return;
            isDragging = false;
            
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);

            if (draggingRef.current?.moved) {
              const rect = containerRef.current!.getBoundingClientRect();
              const localPoint = {
                x: upEvent.clientX - rect.left,
                y: upEvent.clientY - rect.top
              };
              const scene = viewerRef.current.scene();
              const view = scene.view();
              const coords = view.screenToCoordinates(localPoint);
              
              if (coords && onHotspotMove) {
                onHotspotMove(hotspot, coords.yaw, coords.pitch);
              }
            } else {
              if (onHotspotClick) onHotspotClick(hotspot);
            }
            
            setTimeout(() => {
              draggingRef.current = null;
            }, 100);
          };

          window.addEventListener('mousemove', onMouseMove);
          window.addEventListener('mouseup', onMouseUp);
        };
      } else {
        element.onclick = (e) => {
          e.stopPropagation();
          if (onHotspotClick) onHotspotClick(hotspot);
        };
      }

      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });
  }, [hotspots, editorMode, onHotspotClick, onHotspotMove]);

  return (
    <div className={`w-full h-full min-h-[400px] bg-black relative ${addHotspotMode ? 'cursor-crosshair' : ''}`}>
      <div
        ref={containerRef}
        className="w-full h-full"
      />
      <style jsx global>{`
        .marzipano-hotspot {
          transition: transform 0.2s ease;
          z-index: 10;
        }
        .marzipano-hotspot:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};
