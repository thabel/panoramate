'use client';

import { useEffect, useRef } from 'react';
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
  onHotspotClick?: (hotspot: HotspotType) => void;
  onPanoramaClick?: (yaw: number, pitch: number) => void;
}

export const MarzipanoViewer: React.FC<MarzipanoViewerProps> = ({
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
    if (!containerRef.current) {

      console.error('Marzipano container not found');
      return;
    };

    // Wait for Marzipano to be available
    const initViewer = () => {
      if (!window.Marzipano || !containerRef.current) return false;

      // Destroy existing viewer if any
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch (e) {
          console.error('Error destroying viewer:', e);
        }
      }

      try {
        console.log('Initializing Marzipano with', scenes.length, 'scenes');
        
        // Initialize Marzipano viewer
        const viewerOpts = {
          controls: !editorMode
            ? { mouseViewMode: 'drag' }
            : { mouseViewMode: 'qtvr' },
          autorotate: false,
        };

        const viewer = new window.Marzipano.Viewer(containerRef.current, viewerOpts);
        viewerRef.current = viewer;

        // Use a simpler geometry for single equirectangular images
        // Marzipano works better with a single level geometry for non-tiled sources
        const geometry = new window.Marzipano.EquirectGeometry([{ width: 4000 }]);

        // Add scenes
        let initialSceneToDisplay: any = null;

        scenes.forEach((scene) => {
          const source = window.Marzipano.ImageUrlSource.fromString(
            `/api/uploads/${scene.filename}`
          );

          // Create view
          const viewParams = {
            yaw: scene.initialYaw || 0,
            pitch: scene.initialPitch || 0,
            fov: scene.initialFov || Math.PI / 2,
          };
          
          const view = new window.Marzipano.RectilinearView(viewParams);

          const scene_ = viewer.createScene({
            source,
            geometry,
            view,
            name: scene.title || `Scene ${scene.order + 1}`,
          });

          if (!initialSceneToDisplay || scene.id === initialSceneId) {
            initialSceneToDisplay = scene_;
          }
        });

        // Display initial scene
        if (initialSceneToDisplay) {
          initialSceneToDisplay.switchTo();
        }

        return true;
      } catch (err) {
        console.error('Marzipano init error:', err);
        return false;
      }
    };

    // Try immediate initialization
    if (!initViewer()) {
      // If not ready, poll for it
      const interval = setInterval(() => {
        if (initViewer()) {
          console.log('Marzipano initialized via polling');
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
  }, [scenes, editorMode, initialSceneId]);

  useEffect(() => {
    if (!viewerRef.current || !editorMode || !onPanoramaClick) return;

    const handleCanvasClick = (e: MouseEvent) => {
      const viewer = viewerRef.current;
      if (!viewer || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Get view parameters
      const view = viewer.view();
      if (!view) return;

      // screenToCoordinates conversion
      const coords = view.screenToCoordinates({ x, y });
      if (coords) {
        onPanoramaClick(coords.yaw, coords.pitch);
      }
    };

    const container = containerRef.current;
    container?.addEventListener('click', handleCanvasClick);

    return () => {
      container?.removeEventListener('click', handleCanvasClick);
    };
  }, [editorMode, onPanoramaClick]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-black"
      style={{ minHeight: '500px' }}
    />
  );
};
