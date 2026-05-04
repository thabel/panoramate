'use client';

import { useEffect, useRef, useState } from 'react';
import { TourImage, Hotspot as HotspotType } from '@/types';
import { logger } from '@/lib/logger';
import { HotspotPopover } from './HotspotPopover';
import { InfoHotspot } from './InfoHotspot';
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
  autorotate?: boolean;
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
  autorotate = false,
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
  const [openedInfoHotspot, setOpenedInfoHotspot] = useState<{ hotspot: HotspotType; position: { x: number; y: number } } | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoadingImages, setIsLoadingImages] = useState(true);

  // Store hotspots in a ref to access latest values in handlers without re-binding
  
  console.log('MarzipanoViewer - hotspots from props:', hotspots);

  const prevScenesIdsRef = useRef<string>('');

  // Preload all images to track loading progress
  useEffect(() => {
    if (scenes.length === 0) {
      setIsLoadingImages(false);
      return;
    }

    // Only reload images if scene IDs actually changed
    const currentSceneIds = scenes.map(s => s.id).join(',');
    if (currentSceneIds === prevScenesIdsRef.current) {
      // Same scenes, don't reload images
      return;
    }
    prevScenesIdsRef.current = currentSceneIds;

    setIsLoadingImages(true);
    setLoadingProgress(0);

    let loadedCount = 0;
    const totalImages = scenes.length;

    scenes.forEach((scene) => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        const progress = Math.round((loadedCount / totalImages) * 100);
        setLoadingProgress(progress);

        if (loadedCount === totalImages) {
          // Give a small delay for smooth transition
          setTimeout(() => {
            setIsLoadingImages(false);
          }, 300);
        }
      };
      img.onerror = () => {
        loadedCount++;
        const progress = Math.round((loadedCount / totalImages) * 100);
        setLoadingProgress(progress);

        if (loadedCount === totalImages) {
          setTimeout(() => {
            setIsLoadingImages(false);
          }, 300);
        }
      };
      img.src = `/api/uploads/${scene.filename}`;
    });
  }, [scenes]);

  // Update currentSceneId when initialSceneId prop changes (for scene switching)
  useEffect(() => {
    if (initialSceneId && viewerRef.current && initialSceneId !== currentSceneId) {
      const scene = scenesRef.current[initialSceneId];
      if (scene) {
        scene.switchTo();
        setCurrentSceneId(initialSceneId);
        logger.debug({ sceneId: initialSceneId }, '[Marzipano] Scene switched via prop change');
      }
    }
  }, [initialSceneId, currentSceneId]);

  // Main Viewer Initialization
  useEffect(() => {
    if (!containerRef.current || scenes.length === 0 || isLoadingImages) {
      logger.warn({
        containerExists: !!containerRef.current,
        scenesCount: scenes.length,
        isLoadingImages
      }, '[Marzipano] Early return - missing container or scenes or still loading');
      return;
    }

    // Debug device info
    const deviceDebugInfo = {
      userAgent: navigator.userAgent,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      containerWidth: containerRef.current?.offsetWidth,
      containerHeight: containerRef.current?.offsetHeight,
      canvasWidth: containerRef.current?.querySelector('canvas')?.width,
      canvasHeight: containerRef.current?.querySelector('canvas')?.height,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
    };
    logger.info(deviceDebugInfo, '[Marzipano] Device Debug Info');

    // Only re-initialize if the scene IDs or order changed
    const currentScenesIds = scenes.map(s => s.id).join(',');
    if (currentScenesIds === prevScenesIdsRef.current && viewerRef.current) {
      logger.debug({}, '[Marzipano] Skipping re-init - same scene IDs');
      return;
    }
    prevScenesIdsRef.current = currentScenesIds;

    let viewer: any = null;
    let retryInterval: NodeJS.Timeout;

    const initViewer = () => {
      const Marzipano = window.Marzipano;

      if (!Marzipano) {
        logger.warn({}, '[Marzipano] Marzipano library not available in window');
        return false;
      }

      logger.debug({ marzipanoLoaded: true }, '[Marzipano] Library available');

      try {
        if (viewerRef.current) {
          logger.debug({}, '[Marzipano] Destroying previous viewer');
          viewerRef.current.destroy();
        }

        // Check container dimensions BEFORE creating viewer
        const containerRect = containerRef.current?.getBoundingClientRect();
        logger.debug(
          {
            containerWidth: containerRect?.width,
            containerHeight: containerRect?.height,
            containerDisplay: window.getComputedStyle(containerRef.current!).display,
          },
          '[Marzipano] Container dimensions before viewer creation'
        );

        if (!containerRect || containerRect.width === 0 || containerRect.height === 0) {
          logger.error(
            { containerRect },
            '[Marzipano] ❌ Container has zero dimensions!'
          );
        }

        const viewerOpts = {
          controls: { mouseViewMode: 'drag' }
        };

        viewer = new Marzipano.Viewer(containerRef.current, viewerOpts);
        viewerRef.current = viewer;

        logger.info({}, '[Marzipano] ✅ Viewer instance created successfully');

        const marzipanoScenes: { [key: string]: any } = {};

        scenes.forEach((sceneData, index) => {
          const imageUrl = `/api/uploads/${sceneData.filename}`;

          logger.debug(
            {
              sceneIndex: index,
              sceneId: sceneData.id,
              imageUrl,
              filename: sceneData.filename,
            },
            '[Marzipano] Creating scene'
          );

          // Test image loading separately
          const img = new Image();
          img.onload = () => {
            logger.debug(
              {
                sceneId: sceneData.id,
                imageWidth: img.naturalWidth,
                imageHeight: img.naturalHeight,
                aspectRatio: img.naturalWidth / img.naturalHeight,
              },
              '[Marzipano] ✅ Image loaded successfully'
            );
          };
          img.onerror = (err) => {
            logger.error(
              {
                sceneId: sceneData.id,
                imageUrl,
                error: String(err),
              },
              '[Marzipano] ❌ Image failed to load'
            );
          };
          img.src = imageUrl;

          const source = Marzipano.ImageUrlSource.fromString(imageUrl);

          // Reduce geometry width for mobile to prevent GPU memory issues
          // 4000 = desktop, 2000 = mobile-friendly, 1000 = low-end devices
          const geometryWidth = window.innerWidth < 768 ? 2000 : 4000;

          logger.debug(
            {
              sceneId: sceneData.id,
              deviceWidth: window.innerWidth,
              geometryWidth,
            },
            '[Marzipano] Creating geometry with dynamic width'
          );

          const geometry = new Marzipano.EquirectGeometry([{ width: geometryWidth }]);

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

          logger.debug(
            {
              sceneId: sceneData.id,
              yaw: sceneData.initialYaw || 0,
              pitch: sceneData.initialPitch || 0,
              fov: ((sceneData.initialFov || (110 * Math.PI) / 180) * 180) / Math.PI,
            },
            '[Marzipano] View parameters set'
          );

          marzipanoScenes[sceneData.id] = viewer.createScene({
            source, geometry, view, pinFirstLevel: false
          });

          logger.debug(
            {
              sceneId: sceneData.id,
              created: true,
              pinFirstLevel: false,
            },
            '[Marzipano] ✅ Scene created in viewer'
          );
        });

        scenesRef.current = marzipanoScenes;
        const initialSceneIdToUse = initialSceneId || scenes[0].id;
        const initialScene = marzipanoScenes[initialSceneIdToUse];

        logger.debug(
          {
            initialSceneId: initialSceneIdToUse,
            scenesCount: Object.keys(marzipanoScenes).length,
            availableScenes: Object.keys(marzipanoScenes),
            sceneFound: !!initialScene,
          },
          '[Marzipano] Scene lookup before switchTo'
        );

        if (initialScene) {
          try {
            logger.info(
              { sceneId: initialSceneIdToUse },
              '[Marzipano] ℹ️ About to call switchTo()'
            );

            initialScene.switchTo();

            logger.info(
              { sceneId: initialSceneIdToUse },
              '[Marzipano] ✅ switchTo() completed successfully'
            );

            setCurrentSceneId(initialSceneIdToUse);

            // Verify scene is actually the active one with multiple checks
            const verifyScene = () => {
              const currentScene = viewer.scene();
              const canvasElement = containerRef.current?.querySelector('canvas') as HTMLCanvasElement;
              const canvasPixels = canvasElement?.width && canvasElement?.height ?
                canvasElement.width * canvasElement.height : 0;

              logger.debug(
                {
                  requestedSceneId: initialSceneIdToUse,
                  sceneActive: !!currentScene,
                  canvasPixels,
                  canvasRenderingContext: canvasElement?.getContext('webgl') ? '✅ WebGL' : '❌ No WebGL',
                },
                '[Marzipano] Scene verification'
              );
            };

            // Verify at different intervals
            setTimeout(verifyScene, 100);
            setTimeout(verifyScene, 500);
            setTimeout(verifyScene, 1000);
          } catch (switchErr) {
            logger.error(
              {
                sceneId: initialSceneIdToUse,
                error: String(switchErr),
                stack: (switchErr as any).stack,
              },
              '[Marzipano] ❌ switchTo() threw error'
            );
          }
        } else {
          logger.error(
            { initialSceneId: initialSceneIdToUse, availableScenes: Object.keys(marzipanoScenes) },
            '[Marzipano] ❌ Initial scene not found'
          );
        }

        // Check canvas after creation
        const canvas = containerRef.current?.querySelector('canvas') as HTMLCanvasElement;
        if (canvas) {
          logger.info(
            {
              canvasWidth: canvas.width,
              canvasHeight: canvas.height,
              canvasDisplayWidth: canvas.offsetWidth,
              canvasDisplayHeight: canvas.offsetHeight,
              webglContext: canvas.getContext('webgl2') ? '✅ WebGL2' :
                           canvas.getContext('webgl') ? '✅ WebGL' : '❌ No WebGL',
            },
            '[Marzipano] Canvas info after creation'
          );
        } else {
          logger.error({}, '[Marzipano] ❌ Canvas element not found');
        }

        return true;
      } catch (err) {
        logger.error(
          { error: String(err), stack: (err as any).stack },
          '[Marzipano] ❌ Initialization error'
        );
        return false;
      }
    };

    if (!initViewer()) {
      logger.warn({}, '[Marzipano] First init failed, retrying...');
      let retryCount = 0;
      const maxRetries = 60; // 30 seconds max (60 * 500ms)

      retryInterval = setInterval(() => {
        retryCount++;
        logger.debug(
          { retryCount, maxRetries },
          '[Marzipano] Retry attempt'
        );

        if (initViewer()) {
          logger.info(
            { retryCount },
            '[Marzipano] ✅ Initialized successfully after retries'
          );
          clearInterval(retryInterval);
        } else if (retryCount >= maxRetries) {
          logger.error(
            { retryCount, maxRetries },
            '[Marzipano] ❌ Failed to initialize after all retries'
          );
          clearInterval(retryInterval);
        }
      }, 500);
    }

    return () => {
      if (retryInterval) clearInterval(retryInterval);
      if (viewerRef.current) {
        logger.debug({}, '[Marzipano] Cleaning up viewer');
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [scenes, isLoadingImages]);

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
      logger.debug(
        { initialSceneId, currentSceneId },
        '[Marzipano] Scene change requested'
      );

      // Clear hover states immediately on scene change to prevent stuck popovers
      setHoveredHotspot(null);
      setPopoverPosition(null);

      const scene = scenesRef.current[initialSceneId];
      if (scene) {
        logger.info(
          { initialSceneId },
          '[Marzipano] ✅ Switching to scene'
        );
        scene.switchTo();
        setCurrentSceneId(initialSceneId);
      } else {
        logger.error(
          {
            initialSceneId,
            availableScenes: Object.keys(scenesRef.current),
          },
          '[Marzipano] ❌ Scene not found in scenesRef'
        );
      }
    }
  }, [initialSceneId, currentSceneId]);

  // Helper function to create consistent hotspot elements
  const createHotspotElement = (
    type: 'LINK_SCENE' | 'INFO' | 'TEMP',
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



    // Icon container
    const iconContainer = document.createElement('div');
    iconContainer.className = 'hotspot-icon-container';
    iconContainer.style.borderRadius = '50%';
    iconContainer.style.display = 'flex';
    iconContainer.style.alignItems = 'center';
    iconContainer.style.justifyContent = 'center';
    iconContainer.style.width = '100%';
    iconContainer.style.height = '100%';

    const iconName = options?.iconName || (type === 'LINK_SCENE' ? 'MapPin' : 'info');
    const iconSvg = getHotspotIconSvg(iconName);

    // Default styling for all hotspots
    
    visual.style.backgroundColor = options?.color || '#3b3b3b';
    // visual.style.border = '2px solid rgba(255, 255, 255, 0.3)';
    // visual.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';

    // Hot spot general stylings 

    visual.style.backgroundColor = '#3b3b3b';
    // visual.className += ' link-hotspot__inner__icon__rotate';


    iconContainer.style.color = '#ffffff';
    iconContainer.innerHTML = iconSvg;

    // Ensure the SVG or IMG inside the container is properly sized
    const iconElement = iconContainer.querySelector('svg, img') as HTMLElement;
    if (iconElement) {
      iconElement.style.width = '60%';
      iconElement.style.height = '60%';
    }

    visual.appendChild(iconContainer);

    // Title label (only if showHotspotTitles and title exists)
    if (showHotspotTitles && title && type !== 'TEMP') {
      const TextAndIcon = document.createElement('div');
      TextAndIcon.classList.add('hotspot-title-icon');

      // Title element with proper text handling
      const titleLabel = document.createElement('div');
      titleLabel.style.flex = '1';
      titleLabel.style.overflow = 'hidden';
      titleLabel.style.textOverflow = 'ellipsis';
      titleLabel.style.whiteSpace = 'nowrap';
      titleLabel.style.fontSize = '14px';
      titleLabel.style.fontWeight = '500';
      titleLabel.style.color = '#ffffff';
      titleLabel.style.maxWidth = '240px';
      titleLabel.title = title; // Show full text on tooltip
      titleLabel.textContent = title;

      // Close element
      const closeWrapper = document.createElement('div');
      closeWrapper.classList.add('info-hotspot-close-wrapper');
      closeWrapper.style.flexShrink = '0';
      closeWrapper.style.marginLeft = '8px';

      const closeIcon = document.createElement('img');
      closeIcon.src = '/icons/close.png';
      closeIcon.classList.add('info-hotspot-close-icon');
      closeIcon.style.cursor = 'pointer';
      closeIcon.style.transition = 'transform 0.2s ease-out';

      closeWrapper.appendChild(closeIcon);
      
      
      closeWrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        TextAndIcon.classList.remove('visible');
        visual.classList.add('hotspot-closed');
        console.log('Hotspot closed');
      });

      // TextAndIcon adding 2 children
      TextAndIcon.appendChild(titleLabel);
      TextAndIcon.appendChild(closeWrapper);

      visual.appendChild(TextAndIcon);
    }


    host.appendChild(visual);
    if (onClick) {
      visual.onmousedown = (e: MouseEvent) => {
        e.stopPropagation();
        onClick(visual);
      };

      visual.onmouseover = (e: MouseEvent) => {
        e.preventDefault();
        // Reset the closed state on hover to allow title to reappear
        visual.classList.remove('hotspot-closed');

        // Show popover on hover
        if (onHover && hotspotData) {
          const rect = visual.getBoundingClientRect();
          onHover(hotspotData, { x: rect.left, y: rect.top });
        }
      };

      visual.onmouseout = () => {
        if (onHover) {
          onHover(null, null);
        }
      };
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
        () => {
          if (onHotspotClick) onHotspotClick(hotspot);
        },
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
  }, [hotspots]);

  // Autorotate effect
  useEffect(() => {
    if (!viewerRef.current || !autorotate) return;

    let animationFrameId: number;
    const rotationSpeed = 0.0005; // radians per frame

    const rotate = () => {
      const viewer = viewerRef.current;
      if (!viewer) return;

      const scenes = viewer.listScenes();
      if (scenes.length === 0) return;

      const currentScene = viewer.scene();
      if (!currentScene) return;

      const view = currentScene.view();
      if (!view) return;

      const currentParams = view.parameters();
      const newYaw = currentParams.yaw + rotationSpeed;

      view.setParameters({
        yaw: newYaw,
        pitch: currentParams.pitch,
        fov: currentParams.fov,
      });

      animationFrameId = requestAnimationFrame(rotate);
    };

    animationFrameId = requestAnimationFrame(rotate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [autorotate]);

  return (
    <div className={`w-full h-full bg-black relative ${addHotspotMode ? 'hotspot-cursor' : ''}`}>
      {/* Loading Overlay with Progress Circle */}
      {isLoadingImages && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6">
            {/* Circular Progress */}
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                {/* Background circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="8"
                />
                {/* Progress circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - loadingProgress / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-300 ease-out"
                />
              </svg>
              {/* Percentage text in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">{loadingProgress}%</div>
                  <div className="text-xs text-dark-400 mt-1">Loading images...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden"
        style={{ display: 'flex' }}
      />
      {/* {hoveredHotspot && (
        <HotspotPopover
          hotspot={hoveredHotspot}
          visible={true}
          position={popoverPosition}
          scenes={scenes.map(s => ({ id: s.id, title: s.title }))}
        />
      )} */}
      {openedInfoHotspot && (
        <InfoHotspot
          hotspot={openedInfoHotspot.hotspot}
          position={openedInfoHotspot.position}
          onClose={() => setOpenedInfoHotspot(null)}
        />
      )}
      <style jsx global>{`
        .marzipano-hotspot {
          z-index: 10;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7);
          }
          70% {
            transform: scale(1.05);
            box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
          }
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

        .link-hotspot__inner__icon__rotate:hover {
          background-color: #000000;
        }

        .link-hotspot__inner__icon__rotate svg {
          display: block;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
                      filter 0.3s ease-out;
        }

        .link-hotspot__inner__icon__rotate:hover svg {
          transform: scale(1.15) rotate(8deg);
          filter: brightness(1.3) drop-shadow(0 0 8px rgba(99, 102, 241, 0.6));
        }

        .hotspot-cursor,
        .hotspot-cursor *,
        .hotspot-cursor canvas,
        .hotspot-cursor .marzipano-container {
          cursor: url('/icons/link.png') 16 16, crosshair !important;
        }

        /* Advanced hotspot title styling */
        .marzipano-hotspot-visual .hotspot-title-icon > div:first-child {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .marzipano-hotspot-visual .hotspot-title-icon .info-hotspot-close-icon {
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          opacity: 0.7;
        }

        .marzipano-hotspot-visual:hover .hotspot-title-icon .info-hotspot-close-icon {
          opacity: 1;
        }

        .info-hotspot-close-wrapper:hover .info-hotspot-close-icon {
          filter: brightness(1.5) drop-shadow(0 0 4px rgba(255, 0, 0, 0.5));
        }
      `}</style>
    </div>
  );
};
