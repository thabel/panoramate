'use client';

import { useEffect, useRef } from 'react';
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
  onHotspotClick?: (hotspot: HotspotType) => void;
  onPanoramaClick?: (yaw: number, pitch: number) => void;
}

export const PannellumViewer: React.FC<PannellumViewerProps> = ({
  scenes,
  hotspots = [],
  initialSceneId,
  editorMode = false,
  onHotspotClick,
  onPanoramaClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || scenes.length === 0) return;

    const initViewer = () => {
      if (!window.pannellum || !containerRef.current) return false;

      // Destroy existing viewer if any
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch (e) {
          console.error('Error destroying viewer:', e);
        }
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
            yaw: (scene.initialYaw || 0) * (180 / Math.PI), // Pannellum uses degrees
            pitch: (scene.initialPitch || 0) * (180 / Math.PI),
            hfov: (scene.initialFov || Math.PI / 2) * (180 / Math.PI),
            hotSpots: [],
          };
        });

        // Add hotspots if any
        hotspots.forEach((hotspot) => {
          if (config.scenes[hotspot.imageId]) {
            config.scenes[hotspot.imageId].hotSpots.push({
              pitch: hotspot.pitch * (180 / Math.PI),
              yaw: hotspot.yaw * (180 / Math.PI),
              type: hotspot.type === 'LINK' ? 'scene' : 'info',
              text: hotspot.title,
              sceneId: hotspot.targetImageId,
              URL: hotspot.type === 'URL' ? hotspot.url : undefined,
              clickHandlerFunc: (e: any, args: any) => {
                if (onHotspotClick) onHotspotClick(hotspot);
              }
            });
          }
        });

        const viewer = window.pannellum.viewer(containerRef.current, config);
        viewerRef.current = viewer;

        // Handle clicks for editor mode
        if (editorMode && onPanoramaClick) {
          containerRef.current.addEventListener('mousedown', (e) => {
            // Pannellum's mouse event handling is a bit tricky
            // We use their API to get the coordinates
            const [pitch, yaw] = viewer.mouseEventToCoords(e);
            if (pitch !== undefined && yaw !== undefined) {
              // Convert back to radians for our storage
              onPanoramaClick(yaw * (Math.PI / 180), pitch * (Math.PI / 180));
            }
          });
        }

        return true;
      } catch (err) {
        console.error('Pannellum init error:', err);
        return false;
      }
    };

    // Try immediate initialization
    if (!initViewer()) {
      const interval = setInterval(() => {
        if (initViewer()) {
          clearInterval(interval);
        }
      }, 200);
      
      return () => {
        clearInterval(interval);
        if (viewerRef.current) {
          viewerRef.current.destroy();
        }
      };
    }

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }
    };
  }, [scenes, hotspots, editorMode, onHotspotClick, onPanoramaClick]);

  // Handle scene switching when initialSceneId changes
  useEffect(() => {
    if (viewerRef.current && initialSceneId) {
      const currentScene = viewerRef.current.getScene();
      if (currentScene !== initialSceneId) {
        viewerRef.current.loadScene(initialSceneId);
      }
    }
  }, [initialSceneId]);

  return (
    <div className="w-full h-full bg-black relative">
      <div
        ref={containerRef}
        className="w-full h-full"
      />
    </div>
  );
};
