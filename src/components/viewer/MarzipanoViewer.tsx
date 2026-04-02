'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { TourImage, Hotspot as HotspotType } from '@/types';
import { logger } from '@/lib/logger';
import { useUI } from '@/context/UIContext';
import { HotspotPopover } from './HotspotPopover';

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
}) => {
  const { isHotspotPanelOpen, isHotspotPanelCollapsed } = useUI();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const scenesRef = useRef<{ [key: string]: any }>({});
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const hotspotElementsRef = useRef<{ [key: string]: any }>({});
  const [hoveredHotspot, setHoveredHotspot] = useState<HotspotType | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null);

  // 1. TRANSITION SYNC LOOP: Force resize during any layout transition (sidebar/panel)
  useEffect(() => {
    if (!viewerRef.current) return;

    let frameId: number;
    const startTime = Date.now();
    const duration = 600; // Covers the 300ms CSS transition + buffer

    const syncResize = () => {
      if (viewerRef.current) {
        viewerRef.current.resize();
      }
      
      const elapsed = Date.now() - startTime;
      if (elapsed < duration) {
        frameId = requestAnimationFrame(syncResize);
      }
    };

    syncResize();
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [isHotspotPanelOpen, isHotspotPanelCollapsed]);

  // Store hotspots in a ref to access latest values in handlers
  const hotspotsRef = useRef(hotspots);
  useEffect(() => {
    hotspotsRef.current = hotspots;
  }, [hotspots]);

  const prevScenesIdsRef = useRef<string>('');

  // Main Viewer Initialization
  useEffect(() => {
    if (!containerRef.current || scenes.length === 0) return;

    const currentScenesIds = scenes.map(s => s.id).join(',');
    if (currentScenesIds === prevScenesIdsRef.current && viewerRef.current) {
      return;
    }
    prevScenesIdsRef.current = currentScenesIds;

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

        const viewer = new Marzipano.Viewer(containerRef.current, viewerOpts);
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

  // 2. IMMEDIATE CLICK HANDLER: Calculate coordinates while the view is stable
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

      // Validate coordinates
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

      const coords = view.screenToCoordinates({ x, y });
      if (coords && onPanoramaClick) {
        // We call the callback immediately with precise coords
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
      }
    }
  }, [initialSceneId, currentSceneId]);

  // Helper function to create consistent hotspot elements
  const createHotspotElement = (
    type: 'LINK' | 'INFO' | 'TEMP',
    hotspotId?: string,
    onClick?: () => void,
    title?: string,
    options?: {
      color?: string;
      scale?: number;
      animationType?: string;
      iconUrl?: string;
    },
    onHover?: (hotspot: HotspotType | null, position: { x: number; y: number } | null) => void,
    hotspotData?: HotspotType
  ) => {
    const host = document.createElement('div');
    host.className = 'marzipano-hotspot-host';
    host.style.position = 'absolute';
    host.style.width = '0px';
    host.style.height = '0px';

    const visual = document.createElement('div');
    const baseSize = type === 'TEMP' ? 32 : 42;
    const scale = options?.scale || 1.0;
    const size = baseSize * scale;

    let animationClass = '';
    if (type !== 'TEMP' && options?.animationType) {
      switch (options.animationType) {
        case 'PULSE': animationClass = 'hotspot-animate-pulse'; break;
        case 'GLOW': animationClass = 'hotspot-animate-glow'; break;
        case 'BOUNCE': animationClass = 'hotspot-animate-bounce'; break;
        case 'FLOAT': animationClass = 'hotspot-animate-float'; break;
      }
    }

    visual.className = `marzipano-hotspot-visual ${type === 'TEMP' ? 'temp-preview' : 'cursor-pointer'} ${animationClass}`;
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

    const iconContainer = document.createElement('div');
    iconContainer.style.display = 'flex';
    iconContainer.style.alignItems = 'center';
    iconContainer.style.justifyContent = 'center';
    iconContainer.style.width = '100%';
    iconContainer.style.height = '100%';

    if (type === 'TEMP') {
      visual.className += ' text-white border-2 border-white rounded-full shadow-lg bg-primary-500 animate-pulse';
      iconContainer.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14M5 12h14"></path>
        </svg>
      `;
    } else if (type === 'LINK') {
      const iconUrl = options?.iconUrl ? `/api/uploads/${options.iconUrl}` : '/icons/link.png';
      iconContainer.innerHTML = `<img src="${iconUrl}" style="width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));" alt="Link" />`;
    } else {
      visual.style.borderRadius = '50%';
      const color = options?.color || '#6366f1';
      visual.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
      visual.style.border = `2px solid ${color}`;
      iconContainer.innerHTML = '<span style="color: inherit; font-weight: bold; font-size: 18px;">i</span>';
      iconContainer.style.color = color;
    }

    visual.appendChild(iconContainer);

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
      titleLabel.style.pointerEvents = 'none';
      titleLabel.style.border = '1px solid rgba(255, 255, 255, 0.2)';
      titleLabel.textContent = title;
      visual.appendChild(titleLabel);
    }

    host.appendChild(visual);

    if (onClick) {
      visual.onmousedown = (e) => { e.stopPropagation(); onClick(); };
      visual.onmouseover = () => {
        visual.style.transform = 'translate(-50%, -50%) scale(1.15)';
        if (onHover && hotspotData) {
          const rect = visual.getBoundingClientRect();
          onHover(hotspotData, { x: rect.left, y: rect.top });
        }
      };
      visual.onmouseout = () => {
        visual.style.transform = 'translate(-50%, -50%)';
        if (onHover) onHover(null, null);
      };
    }

    return host;
  };

  // Hotspot Synchronization
  useEffect(() => {
    if (!viewerRef.current) return;

    // Force an immediate resize before updating hotspots to ensure correct projection
    viewerRef.current.resize();

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
        () => onHotspotClick?.(hotspot),
        hotspot.title,
        {
          color: hotspot.color || undefined,
          scale: hotspot.scale || 1.0,
          animationType: hotspot.animationType || undefined,
          iconUrl: hotspot.iconUrl || undefined,
        },
        (h, pos) => { setHoveredHotspot(h); setPopoverPosition(pos); },
        hotspot
      );

      hotspotElementsRef.current[hotspot.id] = scene.hotspotContainer().createHotspot(element, {
        yaw: hotspot.yaw,
        pitch: hotspot.pitch,
      });
    });

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
  }, [hotspots, tempHotspot, currentSceneId, addHotspotMode, showHotspotTitles]);

  return (
    <div className={`w-full h-full min-h-[400px] bg-black relative ${addHotspotMode ? 'hotspot-cursor' : ''}`}>
      <div ref={containerRef} className="w-full h-full" />
      {hoveredHotspot && (
        <HotspotPopover
          hotspot={hoveredHotspot}
          visible={true}
          position={popoverPosition}
          scenes={scenes.map(s => ({ id: s.id, title: s.title }))}
        />
      )}
      <style jsx global>{`
        .marzipano-hotspot { z-index: 10; }
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }
        .animate-pulse { animation: pulse 2s infinite; }
        .hotspot-cursor, .hotspot-cursor *, .hotspot-cursor canvas, .hotspot-cursor .marzipano-container {
          cursor: url('/icons/link.png') 16 16, crosshair !important;
        }
      `}</style>
    </div>
  );
};
