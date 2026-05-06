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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  const hotspotGroupRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const tempMatrixRef = useRef<THREE.Matrix4>(new THREE.Matrix4());
  const [isInitialized, setIsInitialized] = useState(false);
  const [vrSession, setVrSession] = useState<XRSession | null>(null);
  const sessionRef = useRef<XRSession | null>(null);
  const hotspotsRef = useRef<HotspotMesh[]>([]);

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

    inputSources.forEach((inputSource) => {
      if (inputSource.gamepad?.buttons[0]?.pressed) {
        // Primary button (trigger) pressed on controller
        try {
          const space = (referenceSpace as any).space || (session as any).renderState.baseLayer?.space;
          if (!space) return;

          const pose = frame.getPose(inputSource.targetRaySpace, space);

          if (pose && cameraRef.current && sceneRef.current) {
            // Set raycaster from controller direction
            tempMatrixRef.current.fromArray(pose.transform.matrix);
            raycasterRef.current.ray.origin.setFromMatrixPosition(tempMatrixRef.current);
            raycasterRef.current.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrixRef.current);

            // Check for intersections with hotspots
            const intersects = raycasterRef.current.intersectObjects(hotspotsRef.current);

            if (intersects.length > 0) {
              const hitObject = intersects[0].object as HotspotMesh;
              if (hitObject.hotspotData && onHotspotClick) {
                onHotspotClick(hitObject.hotspotData);
                logger.debug({ hotspotId: hitObject.hotspotData.id }, '[WebXR] Hotspot clicked');
              }
            }
          }
        } catch (err) {
          logger.warn({ error: String(err) }, '[WebXR] Error getting controller pose');
        }
      }
    });
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
