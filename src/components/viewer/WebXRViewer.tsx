'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { XRButton } from 'three/addons/webxr/XRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';


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
  const [isInitialized, setIsInitialized] = useState(false);
  const [vrSession, setVrSession] = useState<XRSession | null>(null);
  const sessionRef = useRef<XRSession | null>(null);
  const hotspotsRef = useRef<HotspotMesh[]>([]);


  function getIntersections(controller: THREE.XRTargetRaySpace) {

    controller.updateMatrixWorld();

    raycasterRef.current.setFromXRController(controller);
    // recursive search is set to false here

    return raycasterRef.current.intersectObjects(sceneRef.current?.children || [], true);

  }

  function onSelectStart(event: any) {
    const controller = event.target as THREE.XRTargetRaySpace;

    const intersections = getIntersections(controller);
    if (intersections.length > 0) {
      const intersection = intersections[0];
      const object = intersection.object as HotspotMesh;

      // Check if the clicked object is a hotspot and trigger the callback
      if (object.hotspotData && onHotspotClick) {
        onHotspotClick(object.hotspotData);
        logger.info(
          { hotspotId: object.hotspotData.id, title: object.hotspotData.title },
          '[WebXR] ✅ Hotspot clicked via selectstart'
        );
      }
    }
  }



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
      const xrButton = XRButton.createButton(renderer, {
        'optionalFeatures': ['depth-sensing'],
        'depthSensing': { 'usagePreference': ['gpu-optimized'], 'dataFormatPreference': [] }
      });
      // make xr btn a little higher
      xrButton.style.position = 'absolute';
      xrButton.style.bottom = '100px';
      xrButton.style.left = '50%';
      xrButton.style.transform = 'translateX(-50%)';
      containerRef.current.appendChild(xrButton);
      // Controllers

      const controller1 = renderer.xr.getController(0);
      controller1.addEventListener('selectstart', onSelectStart);
      scene.add(controller1);

      const controller2 = renderer.xr.getController(1);
      controller2.addEventListener('selectstart', onSelectStart);
      scene.add(controller2);

      const controllerModelFactory = new XRControllerModelFactory();

      const controllerGrip1 = renderer.xr.getControllerGrip(0);
      controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
      scene.add(controllerGrip1);

      const controllerGrip2 = renderer.xr.getControllerGrip(1);
      controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
      scene.add(controllerGrip2);



      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, - 1)]));
      line.name = 'line';
      line.scale.z = 5;

      controller1.add(line.clone());
      controller2.add(line.clone());


      // Hotspot group
      const hotspotGroup = new THREE.Group();
      scene.add(hotspotGroup);
      hotspotGroupRef.current = hotspotGroup;

      // Create reticle
      // createReticle(scene);

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
  const animate = () => {
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

    // Create animation loop
    const animationLoop = () => {
      animate();
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



  return (
    <div className="relative w-full h-full">

      <div ref={containerRef} className="w-full h-full" />

    </div>
  );
};
