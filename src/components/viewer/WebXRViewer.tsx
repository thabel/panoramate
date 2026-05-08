'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { TourImage, Hotspot as HotspotType } from '@/types';
import { logger } from '@/lib/logger';
import { X } from 'lucide-react';
import { createHotspotGeometry, createHotspotHaloMaterial } from '@/lib/webxr-hotspot-texture';

interface WebXRViewerProps {
  scenes: TourImage[];
  hotspots?: HotspotType[];
  currentSceneId?: string;
  onExitVR?: () => void;
  onHotspotClick?: (hotspot: HotspotType) => void;
  onHotspotSelected?: (hotspot: HotspotType | null) => void;
  showControllerRays?: boolean;
}

interface HotspotMesh extends THREE.Mesh {
  hotspotData?: HotspotType;
}

export const WebXRViewer: React.FC<WebXRViewerProps> = ({
  scenes,
  hotspots = [],
  currentSceneId,
  onExitVR,
  onHotspotClick,
  onHotspotSelected,
  showControllerRays = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  const hotspotGroupRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const tempMatrixRef = useRef<THREE.Matrix4>(new THREE.Matrix4());
  const rotationMatrixRef = useRef<THREE.Matrix3>(new THREE.Matrix3());
  const directionVectorRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const [isInitialized, setIsInitialized] = useState(false);
  const [vrSession, setVrSession] = useState<XRSession | null>(null);
  const sessionRef = useRef<XRSession | null>(null);
  const hotspotsRef = useRef<HotspotMesh[]>([]);

  // Visual feedback tracking
  const hoveredHotspotRef = useRef<HotspotMesh | null>(null);
  const selectedHotspotRef = useRef<HotspotMesh | null>(null);
  const originalScalesRef = useRef<Map<HotspotMesh, THREE.Vector3>>(new Map());
  const reticleRef = useRef<THREE.Mesh | null>(null);
  const lastButtonStateRef = useRef<Map<number, boolean>>(new Map());

  // Controller rays
  const controllerRaysRef = useRef<Map<number, THREE.Line>>(new Map());
  const rayMaterialHitRef = useRef<THREE.LineBasicMaterial>(new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 3 }));
  const rayMaterialDefaultRef = useRef<THREE.LineBasicMaterial>(new THREE.LineBasicMaterial({ color: 0x0066ff, linewidth: 2 }));

  // Set hotspot as hovered with visual feedback
  const setHotspotHovered = (hotspot: HotspotMesh) => {
    if (hoveredHotspotRef.current === hotspot) return; // Already hovered

    // Clear previous hover
    clearHotspotHovered();

    hoveredHotspotRef.current = hotspot;

    // Save original scale and apply visual highlight by scaling up
    const originalScale = hotspot.scale.clone();
    originalScalesRef.current.set(hotspot, originalScale);

    // Scale up hotspot slightly to indicate hover
    hotspot.scale.multiplyScalar(1.15);

    logger.debug(
      { hotspotId: hotspot.hotspotData?.id },
      '[WebXR] Hotspot hover highlighted'
    );
  };

  // Clear hotspot hover highlight
  const clearHotspotHovered = () => {
    if (!hoveredHotspotRef.current) return;

    const hotspot = hoveredHotspotRef.current;
    const originalScale = originalScalesRef.current.get(hotspot);

    if (originalScale) {
      hotspot.scale.copy(originalScale);
      originalScalesRef.current.delete(hotspot);
    }

    logger.debug(
      { hotspotId: hotspot.hotspotData?.id },
      '[WebXR] Hotspot hover cleared'
    );

    hoveredHotspotRef.current = null;
  };

  // Create or update controller ray visual
  const createOrUpdateControllerRay = (
    sourceIndex: number,
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    hitDistance: number | null
  ) => {
    if (!sceneRef.current || !showControllerRays) return;

    // Get or create ray line
    let rayLine = controllerRaysRef.current.get(sourceIndex);

    // Ray length: if hitting hotspot, draw to hit point; otherwise draw 100 units
    const rayLength = hitDistance !== null ? hitDistance : 100;
    const endPoint = origin.clone().addScaledVector(direction, rayLength);

    if (!rayLine) {
      // Create new ray line
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(
        new Float32Array([origin.x, origin.y, origin.z, endPoint.x, endPoint.y, endPoint.z]),
        3
      ));

      const material = hitDistance !== null ? rayMaterialHitRef.current : rayMaterialDefaultRef.current;
      rayLine = new THREE.Line(geometry, material);
      sceneRef.current.add(rayLine);
      controllerRaysRef.current.set(sourceIndex, rayLine);
    } else {
      // Update existing ray
      const geometry = rayLine.geometry as THREE.BufferGeometry;
      const positions = geometry.attributes.position.array as Float32Array;

      positions[0] = origin.x;
      positions[1] = origin.y;
      positions[2] = origin.z;
      positions[3] = endPoint.x;
      positions[4] = endPoint.y;
      positions[5] = endPoint.z;

      geometry.attributes.position.needsUpdate = true;

      // Change material color based on hit
      rayLine.material = hitDistance !== null ? rayMaterialHitRef.current : rayMaterialDefaultRef.current;
    }
  };

  // Clean up controller rays
  const cleanupControllerRays = () => {
    if (!sceneRef.current) return;

    controllerRaysRef.current.forEach((ray) => {
      sceneRef.current?.remove(ray);
      ray.geometry.dispose();
    });
    controllerRaysRef.current.clear();
  };

  // Create reticle (crosshair at center of screen)
  const createReticle = (scene: THREE.Scene) => {
    if (reticleRef.current) {
      scene.remove(reticleRef.current);
    }

    // Create a canvas texture for the reticle
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Draw reticle (white circle with center dot)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    // Center dot
    ctx.beginPath();
    ctx.arc(32, 32, 3, 0, Math.PI * 2);
    ctx.fill();

    // Ring around center
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(32, 32, 8, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshair lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    // Horizontal
    ctx.beginPath();
    ctx.moveTo(20, 32);
    ctx.lineTo(12, 32);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(44, 32);
    ctx.lineTo(52, 32);
    ctx.stroke();
    // Vertical
    ctx.beginPath();
    ctx.moveTo(32, 20);
    ctx.lineTo(32, 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(32, 44);
    ctx.lineTo(32, 52);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    // Create plane geometry that always stays in front of camera
    const geometry = new THREE.PlaneGeometry(0.1, 0.1);
    const reticle = new THREE.Mesh(geometry, material);

    // Position far in front of camera (in front of everything)
    reticle.position.z = -3;

    scene.add(reticle);
    reticleRef.current = reticle;
  };

  // Initialize Three.js scene
  const initializeScene = () => {
    if (!containerRef.current) return;

    try {
      // Scene setup
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 0);
      cameraRef.current = camera;

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;
      renderer.xr.setReferenceSpaceType('local');
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Hotspot group
      const hotspotGroup = new THREE.Group();
      scene.add(hotspotGroup);
      hotspotGroupRef.current = hotspotGroup;

      // Create reticle
      createReticle(scene);

      setIsInitialized(true);
      logger.info({}, '[WebXR] Scene initialized');
    } catch (err) {
      logger.error({ error: String(err) }, '[WebXR] Scene initialization failed');
    }
  };

  // Load panorama texture
  const loadPanorama = async (sceneId: string) => {
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene || !sceneRef.current || !rendererRef.current) {
      logger.warn({ sceneId }, '[WebXR] Scene or renderer not found');
      return;
    }

    try {
      const textureLoader = new THREE.TextureLoader();
      const imageUrl = `/api/uploads/${scene.filename}`;

      const texture = await new Promise<THREE.Texture>((resolve, reject) => {
        textureLoader.load(
          imageUrl,
          (tex) => {
            tex.magFilter = THREE.LinearFilter;
            tex.minFilter = THREE.LinearMipmapLinearFilter;
            resolve(tex);
          },
          undefined,
          reject
        );
      });

      // Remove old sphere
      if (sphereRef.current) {
        sceneRef.current.remove(sphereRef.current);
        sphereRef.current.geometry.dispose();
        (sphereRef.current.material as THREE.Material).dispose();
      }

      // Create new sphere with panorama texture
      const geometry = new THREE.SphereGeometry(500, 64, 32);
      // Flip the sphere so the texture is on the inside
      geometry.scale(-1, 1, 1);

      const material = new THREE.MeshBasicMaterial({ map: texture });
      const sphere = new THREE.Mesh(geometry, material);
      sceneRef.current.add(sphere);
      sphereRef.current = sphere;

      logger.info({ sceneId }, '[WebXR] Panorama loaded');
    } catch (err) {
      logger.error({ sceneId, error: String(err) }, '[WebXR] Failed to load panorama');
    }
  };

  // Update hotspots in VR
  const updateHotspots = () => {
    if (!hotspotGroupRef.current) return;

    // Clear hover state when updating hotspots
    clearHotspotHovered();

    // Clear existing hotspots
    hotspotsRef.current = [];
    hotspotGroupRef.current.children.slice().forEach((child) => {
      hotspotGroupRef.current?.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          (child.material as THREE.Material).dispose();
        }
      }
    });

    // Clean up original scales map
    originalScalesRef.current.clear();

    // Add hotspots for current scene
    const sceneHotspots = hotspots.filter((h) => h.imageId === currentSceneId);

    sceneHotspots.forEach((hotspot) => {
      try {
        // Convert spherical coordinates to 3D position
        const phi = (Math.PI / 2) - hotspot.pitch;
        const theta = hotspot.yaw;

        const x = 400 * Math.sin(phi) * Math.cos(theta);
        const y = 400 * Math.cos(phi);
        const z = 400 * Math.sin(phi) * Math.sin(theta);

        // Create hotspot with icon texture
        const iconName = hotspot.iconName || (hotspot.type === 'LINK_SCENE' ? 'MapPin' : 'info');
        const { geometry, material } = createHotspotGeometry(iconName);

        const hotspotMesh = new THREE.Mesh(geometry, material) as HotspotMesh;
        hotspotMesh.position.set(x, y, z);
        hotspotMesh.hotspotData = hotspot;

        // Make the hotspot face the camera (billboard effect)
        hotspotMesh.lookAt(0, 0, 0);

        hotspotGroupRef.current?.add(hotspotMesh);
        hotspotsRef.current.push(hotspotMesh);

        // Add glow halo effect around hotspot
        const haloGeometry = new THREE.PlaneGeometry(55, 55);
        const haloMaterial = createHotspotHaloMaterial();
        const halo = new THREE.Mesh(haloGeometry, haloMaterial);

        // Position halo slightly behind the hotspot to prevent z-fighting
        // Since we're looking from (0,0,0), moving it further away (multiply by 1.01) puts it behind
        halo.position.copy(hotspotMesh.position).multiplyScalar(1.005);
        halo.lookAt(0, 0, 0);
        hotspotGroupRef.current?.add(halo);

        logger.debug(
          { hotspotId: hotspot.id, iconName },
          '[WebXR] Hotspot created with icon'
        );
      } catch (err) {
        logger.error(
          { hotspotId: hotspot.id, error: String(err) },
          '[WebXR] Failed to create hotspot'
        );
      }
    });

    logger.debug({ count: sceneHotspots.length }, '[WebXR] Hotspots updated');
  };

  // Handle VR controller input for hotspot clicks
  const handleVRInput = (session: XRSession, frame: XRFrame) => {
    // Validate frame and session
    if (!frame || !session) {
      logger.warn({}, '[WebXR] Invalid frame or session in handleVRInput');
      return;
    }

    // Try to get the reference space for the session
    const referenceSpace = frame.session.renderState.baseLayer as any;

    if (!referenceSpace?.getSpace) {
      // Fallback: just handle input without precise pose data
      const inputSources = Array.from(session.inputSources);

      inputSources.forEach((inputSource) => {
        if (inputSource.gamepad?.buttons[0]?.pressed) {
          logger.debug({}, '[WebXR] Controller trigger pressed (no precise pose data)');
        }
      });
      return;
    }

    const inputSources = Array.from(session.inputSources);
    let anyHotspotHovered = false;

    inputSources.forEach((inputSource, sourceIndex) => {
      try {
        const space = (referenceSpace as any).space || (session as any).renderState.baseLayer?.space;
        if (!space) return;

        const pose = frame.getPose(inputSource.targetRaySpace, space);

        if (!pose) {
          logger.warn({ sourceIndex }, '[WebXR] Failed to get controller pose');
          lastButtonStateRef.current.set(sourceIndex, false);
          return;
        }

        if (!pose.transform || !pose.transform.matrix) {
          logger.warn({ sourceIndex }, '[WebXR] Pose has no transform matrix');
          lastButtonStateRef.current.set(sourceIndex, false);
          return;
        }

        if (!cameraRef.current || !sceneRef.current) {
          logger.warn({}, '[WebXR] Camera or scene not initialized');
          return;
        }

        // Set raycaster from controller direction (do this every frame for continuous raycasting)
        const poseMatrix = pose.transform.matrix;
        if (!poseMatrix || poseMatrix.length !== 16) {
          logger.warn({ matrixLength: poseMatrix?.length }, '[WebXR] Invalid pose matrix');
          return;
        }

        tempMatrixRef.current.fromArray(poseMatrix);
        raycasterRef.current.ray.origin.setFromMatrixPosition(tempMatrixRef.current);

        // FIXED: Direction vectors should only be rotated, not translated
        // Extract the rotation part (3x3) from the 4x4 matrix and apply it to the direction
        // This ensures the ray direction is properly oriented in world space
        rotationMatrixRef.current.setFromMatrix4(tempMatrixRef.current);
        directionVectorRef.current.set(0, 0, -1).applyMatrix3(rotationMatrixRef.current).normalize();
        raycasterRef.current.ray.direction.copy(directionVectorRef.current);

        // Check for intersections with hotspots (continuous raycasting)
        const intersects = raycasterRef.current.intersectObjects(hotspotsRef.current);
        const hitDistance = intersects.length > 0 ? intersects[0].distance : null;

        // Create or update the visible controller ray
        createOrUpdateControllerRay(
          sourceIndex,
          raycasterRef.current.ray.origin,
          raycasterRef.current.ray.direction,
          hitDistance
        );

        // Debug logging for raycasting (only log when there are changes)
        if (process.env.NODE_ENV === 'development') {
          logger.debug(
            {
              controllerIndex: sourceIndex,
              rayOrigin: { x: raycasterRef.current.ray.origin.x, y: raycasterRef.current.ray.origin.y, z: raycasterRef.current.ray.origin.z },
              rayDirection: { x: raycasterRef.current.ray.direction.x, y: raycasterRef.current.ray.direction.y, z: raycasterRef.current.ray.direction.z },
              hotspotsInScene: hotspotsRef.current.length,
              intersectionsFound: intersects.length,
            },
            '[WebXR] Raycasting debug info'
          );
        }

        if (intersects.length > 0) {
          const hitObject = intersects[0].object as HotspotMesh;
          anyHotspotHovered = true;

          // Visual feedback: highlight the hovered hotspot
          if (hitObject.hotspotData) {
            setHotspotHovered(hitObject);

            // Track selected hotspot (when pointing at it)
            if (selectedHotspotRef.current !== hitObject) {
              selectedHotspotRef.current = hitObject;
              onHotspotSelected?.(hitObject.hotspotData);
              logger.debug(
                { hotspotId: hitObject.hotspotData.id, title: hitObject.hotspotData.title },
                '[WebXR] Hotspot selected (raycasting)'
              );
            }

            // Check if trigger was just pressed (transition from not-pressed to pressed)
            const triggerPressed = inputSource.gamepad?.buttons[0]?.pressed || false;
            const wasPreviouslyPressed = lastButtonStateRef.current.get(sourceIndex) || false;
            const justPressed = triggerPressed && !wasPreviouslyPressed;

            // Update button state
            lastButtonStateRef.current.set(sourceIndex, triggerPressed);

            if (justPressed) {
              // Haptic feedback: vibrate controller on click
              if (inputSource.gamepad?.hapticActuators && inputSource.gamepad.hapticActuators.length > 0) {
                inputSource.gamepad.hapticActuators[0].pulse(0.8, 100).catch((err) => {
                  logger.warn({ error: String(err) }, '[WebXR] Haptic feedback failed');
                });
              }

              // Trigger the callback
              if (onHotspotClick) {
                onHotspotClick(hitObject.hotspotData);
                logger.info(
                  { hotspotId: hitObject.hotspotData.id, title: hitObject.hotspotData.title },
                  '[WebXR] ✅ Hotspot clicked with haptic feedback'
                );
              }
            }
          }
        } else {
          // Not hovering over any hotspot - clear highlight and selection
          lastButtonStateRef.current.set(sourceIndex, false);

          // Clear selected hotspot if moving away
          if (selectedHotspotRef.current) {
            onHotspotSelected?.(null);
            logger.debug({}, '[WebXR] Hotspot deselected');
            selectedHotspotRef.current = null;
          }
        }
      } catch (err) {
        logger.warn({ error: String(err) }, '[WebXR] Error getting controller pose');
      }
    });

    // If no hotspots are being hovered, clear the previous highlight
    if (!anyHotspotHovered && hoveredHotspotRef.current) {
      clearHotspotHovered();
    }
  };

  // Handle window resize
  const onWindowResize = () => {
    if (!cameraRef.current || !rendererRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  };

  // Animation loop
  const animate = (time: number, frame?: XRFrame) => {
    if (frame && sessionRef.current) {
      // Handle VR input in the frame
      handleVRInput(sessionRef.current, frame);
    }

    if (sceneRef.current && cameraRef.current && rendererRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  // Initialize on mount
  useEffect(() => {
    initializeScene();
    window.addEventListener('resize', onWindowResize);

    return () => {
      window.removeEventListener('resize', onWindowResize);

      // Clean up VR resources
      clearHotspotHovered();
      originalScalesRef.current.clear();
      lastButtonStateRef.current.clear();
      cleanupControllerRays();

      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  // Load panorama when scene changes
  useEffect(() => {
    if (isInitialized && currentSceneId) {
      loadPanorama(currentSceneId);
      updateHotspots();
    }
  }, [currentSceneId, isInitialized, scenes]);

  // Update hotspots when they change
  useEffect(() => {
    if (isInitialized) {
      updateHotspots();
    }
  }, [hotspots, currentSceneId, isInitialized]);

  // Start rendering loop
  useEffect(() => {
    if (!rendererRef.current) return;

    // Create animation loop that handles both regular and XR frames
    const animationLoop = (time: number, frame?: XRFrame) => {
      animate(time, frame);
    };

    rendererRef.current.setAnimationLoop(animationLoop as any);

    return () => {
      rendererRef.current?.setAnimationLoop(null);
    };
  }, [isInitialized]);

  // Handle VR session start
  const startVRSession = async () => {
    try {
      if (!navigator.xr) {
        logger.error({}, '[WebXR] WebXR not available');
        return;
      }

      const session = await navigator.xr.requestSession('immersive-vr', {
        requiredFeatures: ['local-floor'],
        optionalFeatures: ['dom-overlay', 'dom-overlay-for-handheld-ar'],
      });

      sessionRef.current = session;
      setVrSession(session);

      if (rendererRef.current) {
        await rendererRef.current.xr.setSession(session);
      }

      logger.info({}, '[WebXR] VR session started');

      // Handle session end
      session.addEventListener('end', () => {
        sessionRef.current = null;
        setVrSession(null);
        onExitVR?.();
      });
    } catch (err) {
      logger.error({ error: String(err) }, '[WebXR] Failed to start VR session');
    }
  };

  // Handle exit VR
  const exitVR = async () => {
    if (sessionRef.current) {
      try {
        await sessionRef.current.end();
      } catch (err) {
        logger.error({ error: String(err) }, '[WebXR] Failed to end VR session');
      }
    }
  };

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />

      {/* Exit VR Button */}
      {vrSession && (
        <button
          onClick={exitVR}
          className="absolute top-4 right-4 z-50 flex items-center justify-center p-3 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all"
          title="Exit VR"
        >
          <X size={20} />
        </button>
      )}

      {/* Start VR Button */}
      {!vrSession && (
        <button
          onClick={startVRSession}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all font-medium"
        >
          📱 Start VR Session
        </button>
      )}
    </div>
  );
};
