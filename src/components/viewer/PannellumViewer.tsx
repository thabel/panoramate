'use client';

import { useEffect, useRef, useState } from 'react';
import { TourImage, Hotspot as HotspotType } from '@/types';

declare global {
  interface Window {
    pannellum: any;
  }
}

interface PannellumViewerProps {
  scenes: TourImage[];
  hotspots?: HotspotType[];
  initialSceneId?: string;
  editorMode?: boolean;
  addHotspotMode?: boolean;
  onHotspotClick?: (hotspot: HotspotType) => void;
  onPanoramaClick?: (yaw: number, pitch: number) => void;
  onHotspotMove?: (hotspot: HotspotType, newYaw: number, newPitch: number) => void;
}

export const PannellumViewer: React.FC<PannellumViewerProps> = ({
  scenes,
  hotspots = [],
  initialSceneId,
  editorMode = false,
  addHotspotMode = false,
  onHotspotClick,
  onPanoramaClick,
  onHotspotMove,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
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

    const container = containerRef.current;
    let pollInterval: NodeJS.Timeout;

    const initViewer = () => {
      if (!window.pannellum || !container) return false;

      // Clear previous viewer if it exists
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch (e) {}
        viewerRef.current = null;
      }

      try {
        const initialScene = scenes.find(s => s.id === initialSceneId) || scenes[0];
        
        const config: any = {
          default: {
            firstScene: initialScene.id,
            sceneFadeDuration: 1000,
            autoLoad: true,
          },
          scenes: {},
        };

        scenes.forEach((scene) => {
          config.scenes[scene.id] = {
            title: scene.title || `Scene ${scene.order + 1}`,
            type: 'equirectangular',
            panorama: `/api/uploads/${scene.filename}`,
            yaw: (scene.initialYaw || 0) * (180 / Math.PI),
            pitch: (scene.initialPitch || 0) * (180 / Math.PI),
            hfov: (scene.initialFov || Math.PI / 2) * (180 / Math.PI),
            hotSpots: [], // Hotspots will be managed dynamically
          };
        });

        const viewer = window.pannellum.viewer(container, config);
        viewerRef.current = viewer;

        // Set initial scene ID
        setCurrentSceneId(initialScene.id);

        // Listen for scene changes
        viewer.on('load', () => {
          const loadedSceneId = viewer.getScene();
          setCurrentSceneId(loadedSceneId);
        });

        return true;
      } catch (err) {
        console.error('Pannellum init error:', err);
        return false;
      }
    };

    // Global mouse handlers for dragging and adding
    const handleMouseDown = (e: MouseEvent) => {
      if (addHotspotMode && viewerRef.current) {
        const [pitch, yaw] = viewerRef.current.mouseEventToCoords(e);
        if (pitch !== undefined && yaw !== undefined) {
          onPanoramaClick?.(yaw * (Math.PI / 180), pitch * (Math.PI / 180));
        }
        return;
      }

      if (!editorMode || !viewerRef.current) return;

      const target = e.target as HTMLElement;
      const hotspotEl = target.closest('.pnlm-hotspot-base');
      
      if (hotspotEl) {
        const hotspotId = hotspotsRef.current.find(h => 
          hotspotEl.classList.contains(`custom-hotspot-${h.id}`)
        )?.id;

        if (hotspotId) {
          draggingRef.current = {
            hotspotId,
            isDragging: true,
            moved: false
          };
          viewerRef.current.setUpdate(false);
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current?.isDragging || !viewerRef.current) return;

      const { hotspotId } = draggingRef.current;
      const [pitch, yaw] = viewerRef.current.mouseEventToCoords(e);
      
      if (pitch !== undefined && yaw !== undefined) {
        draggingRef.current.moved = true;
        
        const hotspot = hotspotsRef.current.find(h => h.id === hotspotId);
        if (!hotspot) return;

        try {
          viewerRef.current.removeHotSpot(hotspotId);
        } catch (e) {}

        viewerRef.current.addHotSpot({
          id: hotspotId,
          pitch,
          yaw,
          type: hotspot.type === 'LINK' ? 'scene' : 'info',
          text: hotspot.title,
          sceneId: hotspot.targetImageId,
          cssClass: `custom-hotspot-${hotspotId} cursor-move`,
          clickHandlerFunc: () => {
            if (draggingRef.current?.moved) return;
            const latestHotspot = hotspotsRef.current.find(h => h.id === hotspotId);
            if (latestHotspot && onHotspotClick) onHotspotClick(latestHotspot);
          }
        });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!draggingRef.current?.isDragging || !viewerRef.current) {
        draggingRef.current = null;
        return;
      }

      const { hotspotId, moved } = draggingRef.current;
      const hotspot = hotspotsRef.current.find(h => h.id === hotspotId);
      
      if (moved && hotspot && onHotspotMove) {
        const [pitch, yaw] = viewerRef.current.mouseEventToCoords(e);
        if (pitch !== undefined && yaw !== undefined) {
          onHotspotMove(hotspot, yaw * (Math.PI / 180), pitch * (Math.PI / 180));
        }
      }

      viewerRef.current.setUpdate(true);
      setTimeout(() => {
        draggingRef.current = null;
      }, 100);
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    if (!initViewer()) {
      pollInterval = setInterval(() => {
        if (initViewer()) clearInterval(pollInterval);
      }, 200);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch (e) {}
        viewerRef.current = null;
      }
    };
  }, [scenes, editorMode, addHotspotMode]); // Re-init only when critical config changes

  // Hotspot Synchronization
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !currentSceneId) return;

    // We get the hotspots for the CURRENT scene only
    const sceneHotspots = hotspots.filter(h => h.imageId === currentSceneId);
    
    // Use the internal config to find which hotspots are currently in the viewer
    // Pannellum might not expose a clean list of IDs, so we track what we add
    const syncHotspots = () => {
      // Clear existing hotspots for this scene to prevent duplicates
      // Note: Pannellum's internal state can be finicky, we try-catch removals
      const currentConfig = viewer.getConfig();
      const existingHotspots = [...(currentConfig.hotSpots || [])];
      
      existingHotspots.forEach((hs: any) => {
        if (hs.id) {
          try {
            viewer.removeHotSpot(hs.id);
          } catch (e) {}
        }
      });

      // Add all hotspots for the current scene
      sceneHotspots.forEach((hotspot) => {
        try {
          viewer.addHotSpot({
            id: hotspot.id,
            pitch: hotspot.pitch * (180 / Math.PI),
            yaw: hotspot.yaw * (180 / Math.PI),
            type: hotspot.type === 'LINK' ? 'scene' : 'info',
            text: hotspot.title,
            sceneId: hotspot.targetImageId,
            URL: hotspot.type === 'URL' ? hotspot.url : undefined,
            cssClass: `custom-hotspot-${hotspot.id} ${editorMode ? 'cursor-move' : ''}`,
            clickHandlerFunc: (e: any) => {
              if (draggingRef.current?.moved) return;
              if (onHotspotClick) onHotspotClick(hotspot);
            }
          });
        } catch (e) {
          console.warn('Failed to add hotspot:', hotspot.id, e);
        }
      });
    };

    syncHotspots();
  }, [hotspots, currentSceneId, editorMode, onHotspotClick]);

  // Scene Navigation Control
  useEffect(() => {
    if (viewerRef.current && initialSceneId) {
      const current = viewerRef.current.getScene();
      if (current !== initialSceneId) {
        viewerRef.current.loadScene(initialSceneId);
      }
    }
  }, [initialSceneId]);

  return (
    <div className={`w-full h-full bg-black relative ${addHotspotMode ? 'cursor-crosshair' : ''}`}>
      <div
        ref={containerRef}
        className="w-full h-full"
      />
    </div>
  );
};
