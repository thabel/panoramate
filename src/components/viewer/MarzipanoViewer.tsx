'use client';

import { useEffect, useRef, useState } from 'react';
import { TourImage, Hotspot as HotspotType } from '@/types';
import { logger } from '@/lib/logger';
import { HotspotPopover } from './HotspotPopover';
import { getHotspotIconSvg } from '@/lib/hotspotIconsSvg';

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
  tempHotspot?: { yaw: number; pitch: number; iconName?: string } | null;
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

  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const scenesRef = useRef<{ [key: string]: any }>({});
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const hotspotElementsRef = useRef<{ [key: string]: any }>({});
  const [hoveredHotspot, setHoveredHotspot] = useState<HotspotType | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null);

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

  // Helper function to create consistent hotspot elements
  const createHotspotElement = (
    type: 'LINK' | 'INFO' | 'TEMP',
    hotspotId?: string,
    onClick?: (element: HTMLElement) => void,
    title?: string,
    options?: {
      color?: string;
      scale?: number;
      animationType?: string;
      iconUrl?: string;
      iconName?: string;
    },
    onHover?: (hotspot: HotspotType | null, position: { x: number; y: number } | null) => void,
    hotspotData?: HotspotType
  ) => {
    // 1. The Host element: Marzipano will manage this element's transform.
    const host = document.createElement('div');
    host.className = 'marzipano-hotspot-host';
    host.style.position = 'absolute';
    host.style.width = '0px';
    host.style.height = '0px';

    // 2. The Visual element: This is where we put our styles, size and centering.
    const visual = document.createElement('div');
    // Fixed size for TEMP hotspots (48px), apply scale only to non-TEMP hotspots
    const baseSize = type === 'TEMP' ? 48 : 42;
    const scale = type === 'TEMP' ? 1.0 : (options?.scale || 1.0);
    const size = baseSize * scale;

    let animationClass = '';
    if (type !== 'TEMP' && options?.animationType) {
      switch (options.animationType) {
        case 'PULSE':
          animationClass = 'hotspot-animate-pulse';
          break;
        case 'GLOW':
          animationClass = 'hotspot-animate-glow';
          break;
        case 'BOUNCE':
          animationClass = 'hotspot-animate-bounce';
          break;
        case 'FLOAT':
          animationClass = 'hotspot-animate-float';
          break;
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
    visual.style.flexDirection = 'column';

    const iconName = options?.iconName || (type === 'LINK' ? 'MapPin' : 'info');
    const iconSvg = getHotspotIconSvg(iconName);

    // INFO hotspots get special DOM structure for Marzipano-style animations
    if (type === 'INFO') {
      visual.className = 'info-hotspot no-touch';
      visual.style.position = 'relative';
      visual.style.width = '40px';
      visual.style.height = '40px';
      visual.style.borderRadius = '50%';
      visual.style.backgroundColor = '#3b3b3b';
      visual.style.border = '2px solid rgba(255, 255, 255, 0.3)';
      visual.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
      visual.style.cursor = 'pointer';
      visual.style.display = 'flex';
      visual.style.alignItems = 'center';
      visual.style.justifyContent = 'center';

      // Header (small circle by default, expands on hover)
      const header = document.createElement('div');
      header.className = 'info-hotspot-header';
      header.style.position = 'absolute';
      header.style.width = '40px';
      header.style.height = '40px';
      header.style.borderRadius = '50%';
      header.style.backgroundColor = '#3b3b3b';
      header.style.border = '2px solid rgba(255, 255, 255, 0.3)';
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.justifyContent = 'center';
      header.style.gap = '8px';
      header.style.padding = '0 12px';
      header.style.transition = 'width 0.3s ease-in-out, border-radius 0.3s ease-in-out';
      header.style.zIndex = '10';
      header.style.cursor = 'pointer';

      // Icon inside header
      const iconContainer = document.createElement('div');
      iconContainer.style.display = 'flex';
      iconContainer.style.alignItems = 'center';
      iconContainer.style.justifyContent = 'center';
      iconContainer.style.width = '24px';
      iconContainer.style.height = '24px';
      iconContainer.style.flexShrink = '0';
      iconContainer.style.color = '#ffffff';
      iconContainer.innerHTML = iconSvg;
      const svgElement = iconContainer.querySelector('svg');
      if (svgElement) {
        svgElement.style.width = '20px';
        svgElement.style.height = '20px';
      }
      header.appendChild(iconContainer);

      // Title wrapper (hidden by default, reveals on hover)
      const titleWrapper = document.createElement('div');
      titleWrapper.className = 'info-hotspot-title-wrapper';
      titleWrapper.style.width = '0px';
      titleWrapper.style.overflow = 'hidden';
      titleWrapper.style.transition = 'width 0s 0.4s';
      titleWrapper.style.whiteSpace = 'nowrap';
      const titleSpan = document.createElement('span');
      titleSpan.style.color = 'white';
      titleSpan.style.fontSize = '13px';
      titleSpan.style.fontWeight = '500';
      titleSpan.textContent = title || 'Info';
      titleWrapper.appendChild(titleSpan);
      header.appendChild(titleWrapper);

      // Close button (hidden by default, rotates on hover)
      const closeBtn = document.createElement('button');
      closeBtn.className = 'info-hotspot-close';
      closeBtn.innerHTML = '×';
      closeBtn.style.position = 'absolute';
      closeBtn.style.right = '4px';
      closeBtn.style.top = '50%';
      closeBtn.style.transform = 'translateY(-50%) perspective(200px) rotateY(90deg)';
      closeBtn.style.transition = 'transform 0.4s ease-in-out 0.2s';
      closeBtn.style.width = '28px';
      closeBtn.style.height = '28px';
      closeBtn.style.border = 'none';
      closeBtn.style.backgroundColor = 'transparent';
      closeBtn.style.color = 'white';
      closeBtn.style.fontSize = '20px';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.padding = '0';
      closeBtn.style.zIndex = '11';
      closeBtn.style.opacity = '0';
      closeBtn.style.transition = 'opacity 0.3s, transform 0.4s ease-in-out 0.2s';
      header.appendChild(closeBtn);

      // Content panel (hidden by default, appears on click)
      const contentPanel = document.createElement('div');
      contentPanel.className = 'info-hotspot-content';
      contentPanel.style.position = 'absolute';
      contentPanel.style.top = '48px';
      contentPanel.style.left = '0';
      contentPanel.style.width = '260px';
      contentPanel.style.maxHeight = '200px';
      contentPanel.style.backgroundColor = '#1f2937';
      contentPanel.style.border = '1px solid rgba(255, 255, 255, 0.1)';
      contentPanel.style.borderRadius = '0 0 5px 5px';
      contentPanel.style.padding = '12px';
      contentPanel.style.color = 'white';
      contentPanel.style.fontSize = '12px';
      contentPanel.style.overflowY = 'auto';
      contentPanel.style.transformOrigin = 'top';
      contentPanel.style.transform = 'rotateX(-89.999deg)';
      contentPanel.style.transition = 'transform 0.5s ease-in-out 0.3s';
      contentPanel.style.opacity = '0';
      contentPanel.style.pointerEvents = 'none';
      contentPanel.textContent = hotspotData?.content || 'No content';
      visual.appendChild(contentPanel);

      visual.appendChild(header);

      // Event listeners
      let isOpen = false;

      header.addEventListener('mouseenter', () => {
        // Expand header
        header.style.width = '260px';
        header.style.borderRadius = '5px';
        // Show title
        titleWrapper.style.width = '180px';
        // Show close button
        closeBtn.style.opacity = '1';
        closeBtn.style.transform = 'translateY(-50%) perspective(200px) rotateY(0deg)';
      });

      header.addEventListener('mouseleave', () => {
        if (!isOpen) {
          // Collapse header
          header.style.width = '40px';
          header.style.borderRadius = '50%';
          // Hide title
          titleWrapper.style.width = '0px';
          // Hide close button
          closeBtn.style.opacity = '0';
          closeBtn.style.transform = 'translateY(-50%) perspective(200px) rotateY(90deg)';
          // Hide content
          contentPanel.style.transform = 'rotateX(-89.999deg)';
          contentPanel.style.opacity = '0';
          contentPanel.style.pointerEvents = 'none';
        }
      });

      header.addEventListener('click', (e) => {
        e.stopPropagation();
        isOpen = !isOpen;
        if (isOpen) {
          contentPanel.style.transform = 'rotateX(0deg)';
          contentPanel.style.opacity = '1';
          contentPanel.style.pointerEvents = 'auto';
        } else {
          contentPanel.style.transform = 'rotateX(-89.999deg)';
          contentPanel.style.opacity = '0';
          contentPanel.style.pointerEvents = 'none';
        }
      });

      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isOpen = false;
        header.style.width = '40px';
        header.style.borderRadius = '50%';
        titleWrapper.style.width = '0px';
        closeBtn.style.opacity = '0';
        closeBtn.style.transform = 'translateY(-50%) perspective(200px) rotateY(90deg)';
        contentPanel.style.transform = 'rotateX(-89.999deg)';
        contentPanel.style.opacity = '0';
        contentPanel.style.pointerEvents = 'none';
      });

      host.appendChild(visual);
    } else {
      // LINK and TEMP hotspots - keep original implementation
      // Icon container
      const iconContainer = document.createElement('div');
      iconContainer.style.display = 'flex';
      iconContainer.style.alignItems = 'center';
      iconContainer.style.justifyContent = 'center';
      iconContainer.style.width = '100%';
      iconContainer.style.height = '100%';

      iconContainer.style.color = '#ffffff';
      iconContainer.innerHTML = iconSvg;

      const svgElement = iconContainer.querySelector('svg');
      if (svgElement) {
        svgElement.style.width = '60%';
        svgElement.style.height = '60%';
      }

      visual.appendChild(iconContainer);

      visual.style.borderRadius = '50%';
      visual.style.backgroundColor = '#3b3b3b';
      visual.className += ' link-hotspot__inner__icon__rotate';

      host.appendChild(visual);

      if (onClick) {
        visual.onmousedown = (e: MouseEvent) => {
          e.stopPropagation();
          onClick(visual);
        };

        visual.onmouseover = (e: MouseEvent) => {
          visual.style.transform = 'translate(-50%, -50%) scale(1.15)';
          if (onHover && hotspotData) {
            const rect = visual.getBoundingClientRect();
            onHover(hotspotData, { x: rect.left, y: rect.top });
          }
        };
        visual.onmouseout = () => {
          visual.style.transform = 'translate(-50%, -50%)';
          if (onHover) {
            onHover(null, null);
          }
        };
      }
    }

    return host;
  };

  // Hotspot Synchronization with improved coordinate handling
  useEffect(() => {
    if (!viewerRef.current) return;

    // Clear hoveredHotspot if it's no longer in the current hotspots list
    if (hoveredHotspot) {
      const isStillExists = hotspots.some(h => h.id === hoveredHotspot.id);
      if (!isStillExists) {
        setHoveredHotspot(null);
        setPopoverPosition(null);
      }
    }

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
        hotspot.type === 'INFO' ? undefined : ((clickElement) => {
          if (onHotspotClick) onHotspotClick(hotspot);
        }),
        hotspot.title,
        {
          color: hotspot.color || undefined,
          scale: hotspot.scale || 1.0,
          animationType: hotspot.animationType || undefined,
          iconUrl: hotspot.iconUrl || undefined,
          iconName: hotspot.iconName || undefined,
        },
        (h, pos) => {
          setHoveredHotspot(h);
          setPopoverPosition(pos);
        },
        hotspot
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
        const element = createHotspotElement('TEMP', undefined, undefined, undefined, {
          iconName: tempHotspot.iconName,
          color: '#3b3b3b',
        });
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
      {hoveredHotspot && (
        <HotspotPopover
          hotspot={hoveredHotspot}
          visible={true}
          position={popoverPosition}
          scenes={scenes.map(s => ({ id: s.id, title: s.title }))}
        />
      )}
      <style jsx global>{`
        .marzipano-hotspot {
          z-index: 10;
        }
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }
        @keyframes hotspot-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.35);
            transform: scale(1);
          }
          70% {
            box-shadow: 0 0 0 18px rgba(0, 0, 0, 0);
            transform: scale(1.04);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
            transform: scale(1);
          }
        }
        .link-hotspot__inner__icon__rotate {
          animation: hotspot-pulse 1.9s ease-in-out infinite;
          transition: background-color 220ms ease, transform 220ms ease;
        }
        .link-hotspot__inner__icon__rotate:hover {
          background-color: #000000;
        }
        .link-hotspot__inner__icon__rotate svg {
          display: block;
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
