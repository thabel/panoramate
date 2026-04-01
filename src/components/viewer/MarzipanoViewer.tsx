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
  showHotspotTitles?: boolean;
  onHotspotClick?: (hotspot: HotspotType) => void;
  onPanoramaClick?: (yaw: number, pitch: number) => void;
  onTempHotspotSettings?: () => void;
  onTempHotspotCancel?: () => void;
}

export const MarzipanoViewer: React.FC<MarzipanoViewerProps> = ({
  scenes,
  hotspots = [],
  initialSceneId,
  editorMode = false,
  addHotspotMode = false,
  tempHotspot = null,
  showHotspotTitles = true,
  onHotspotClick,
  onPanoramaClick,
  onTempHotspotSettings,
  onTempHotspotCancel,
}) => {

  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const scenesRef = useRef<{ [key: string]: any }>({});
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const hotspotElementsRef = useRef<{ [key: string]: any }>({});

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
  }, [scenes]);

  // Separate Hotspot Click/Create Handler
  useEffect(() => {
    const handleContainerClick = (e: MouseEvent) => {
      if (!addHotspotMode || !viewerRef.current || !containerRef.current) return;

      const scene = viewerRef.current.scene();
      if (!scene) return;

      const view = scene.view();

      const canvas = containerRef.current.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

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
      const scene = scenesRef.current[initialSceneId];
      if (scene) {
        scene.switchTo();
        setCurrentSceneId(initialSceneId);
      } else {
        console.warn('Scene not found in scenesRef:', initialSceneId);
      }
    }
  }, [initialSceneId, currentSceneId]);

  // Helper function to create consistent hotspot elements
  const createHotspotElement = (
    type: 'LINK' | 'INFO' | 'TEMP',
    hotspotId?: string,
    onClick?: () => void,
    title?: string
  ) => {
    const host = document.createElement('div');
    host.className = 'marzipano-hotspot-host';
    host.style.position = 'absolute';
    host.style.width = '0px';
    host.style.height = '0px';

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
    visual.style.flexDirection = 'column';

    const iconContainer = document.createElement('div');
    iconContainer.style.display = 'flex';
    iconContainer.style.alignItems = 'center';
    iconContainer.style.justifyContent = 'center';

    if (type === 'TEMP') {
      visual.className += ' text-white border-2 border-white rounded-full shadow-lg bg-primary-500 ';
      iconContainer.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14M5 12h14"></path>
        </svg>
      `;

      visual.appendChild(iconContainer);

      // ── Circular ring with Settings & Cancel icons ──────────────────────
      const RING_RADIUS = 32; // px from center to icon center
      const ICON_SIZE = 28;   // px for each icon button

      // Icons config: alternating settings / cancel at 8 positions (every 45°)
      const ringItems = [
        

        { angleDeg: 180, type: 'settings' },
        // { angleDeg: 225, type: 'cancel'   },

        { angleDeg: 296, type: 'cancel'   },

   
      ];

      // SVG paths for each icon type
      const settingsSVG = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06
            a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09
            A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83
            l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09
            A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83
            l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09
            a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83
            l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09
            a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>`;

      const cancelSVG = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6"  y1="6" x2="18" y2="18"/>
        </svg>`;

      ringItems.forEach(({ angleDeg, type: iconType }) => {
        const rad = (angleDeg * Math.PI) / 180;
        const cx = Math.cos(rad) * RING_RADIUS; // offset from hotspot center
        const cy = Math.sin(rad) * RING_RADIUS;

        const btn = document.createElement('div');
        btn.style.cssText = `
          position: absolute;
          width: ${ICON_SIZE}px;
          height: ${ICON_SIZE}px;
          left: ${cx - ICON_SIZE / 2}px;
          top:  ${cy - ICON_SIZE / 2}px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.95);
          border: 1px solid rgba(0,0,0,0.12);
          border-radius: 6px;
          cursor: pointer;
          color: ${iconType === 'settings' ? '#6366f1' : '#ef4444'};
          box-shadow: 0 1px 4px rgba(0,0,0,0.18);

          z-index: 20;
        `;
        btn.innerHTML = iconType === 'settings' ? settingsSVG : cancelSVG;

        btn.onmouseenter = () => {
          btn.style.transform = 'scale(1.18)';
          btn.style.background = iconType === 'settings'
            ? 'rgba(99,102,241,0.10)'
            : 'rgba(239,68,68,0.10)';
        };
        btn.onmouseleave = () => {
          btn.style.transform = 'scale(1)';
          btn.style.background = 'rgba(255,255,255,0.95)';
        };
        btn.onmousedown = (e: MouseEvent) => {
          e.stopPropagation();
          if (iconType === 'settings' && onTempHotspotSettings) {
            onTempHotspotSettings();
          } else if (iconType === 'cancel' && onTempHotspotCancel) {
            onTempHotspotCancel();
          }
        };

        visual.appendChild(btn);
      });
      // ── end ring ────────────────────────────────────────────────────────

    } else if (type === 'LINK') {
      iconContainer.innerHTML = `<img src="/icons/link.png" style="width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));" alt="Link" />`;
      visual.appendChild(iconContainer);
    } else {
      visual.style.borderRadius = '50%';
      visual.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
      visual.style.border = '2px solid #6366f1';
      iconContainer.innerHTML = '<span style="color: #6366f1; font-weight: bold; font-size: 18px;">i</span>';
      visual.appendChild(iconContainer);
    }

    // Title label (only if showHotspotTitles and title exists)
    if (showHotspotTitles && title && type !== 'TEMP') {
      const titleLabel = document.createElement('div');
      titleLabel.style.position = 'absolute';
      titleLabel.style.top = `${size + 4}px`;
      titleLabel.style.whiteSpace = 'nowrap';
      titleLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      titleLabel.style.color = 'white';
      titleLabel.style.padding = '2px 8px';
      titleLabel.style.borderRadius = '4px';
      titleLabel.style.fontSize = '12px';
      titleLabel.style.fontWeight = '500';
      titleLabel.style.zIndex = '10';
      titleLabel.style.pointerEvents = 'none';
      titleLabel.style.border = '1px solid rgba(255, 255, 255, 0.2)';
      titleLabel.textContent = title;
      visual.appendChild(titleLabel);
    }

    host.appendChild(visual);

    if (onClick) {
      visual.onmousedown = (e: MouseEvent) => {
        e.stopPropagation();
        onClick();
      };

      visual.onmouseover = () => {
        visual.style.transform = 'translate(-50%, -50%) scale(1.15)';
      };
      visual.onmouseout = () => {
        visual.style.transform = 'translate(-50%, -50%)';
      };
    }

    return host;
  };

  // Hotspot Synchronization
  useEffect(() => {
    if (!viewerRef.current) return;

    Object.values(scenesRef.current).forEach(scene => {
      const container = scene.hotspotContainer();
      if (container && typeof container.listHotspots === 'function') {
        const existing = container.listHotspots();
        existing.forEach((h: any) => container.destroyHotspot(h));
      }
    });
    hotspotElementsRef.current = {};

    hotspots.forEach(hotspot => {
      const scene = scenesRef.current[hotspot.imageId];
      if (!scene) return;

      const element = createHotspotElement(
        hotspot.type as any,
        hotspot.id,
        () => {
          if (onHotspotClick) onHotspotClick(hotspot);
        },
        hotspot.title
      );

      const marzipanoHotspot = scene.hotspotContainer().createHotspot(element, {
        yaw: hotspot.yaw,
        pitch: hotspot.pitch,
      });

      hotspotElementsRef.current[hotspot.id] = marzipanoHotspot;
    });

    // Add temporary preview hotspot on the CURRENT scene
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
  }, [hotspots, onHotspotClick, tempHotspot, currentSceneId, editorMode, addHotspotMode, showHotspotTitles]);

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
          0%   { transform: scale(1);    box-shadow: 0 0 0 0   rgba(99,102,241,0.7); }
          70%  { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(99,102,241,0); }
          100% { transform: scale(1);    box-shadow: 0 0 0 0   rgba(99,102,241,0); }
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