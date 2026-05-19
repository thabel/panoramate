import * as THREE from 'three';
import { getHotspotIconSvg } from './hotspotIconsSvg';

/**
 * Create a Three.js Canvas Texture from a hotspot icon
 * Used for rendering hotspot icons in WebXR viewer
 */
export function createHotspotIconTexture(iconName: string): THREE.Texture {
  // Create canvas - increased from 256 to 512 for better clarity in VR
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Failed to get canvas context');
    return new THREE.CanvasTexture(canvas);
  }

  try {
    // Draw background circle (dark gray) - scaled for 512x512
    ctx.fillStyle = '#3b3b3b';
    ctx.beginPath();
    ctx.arc(256, 256, 256, 0, Math.PI * 2);
    ctx.fill();

    // Draw outer glow circle - scaled for 512x512
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(256, 256, 256, 0, Math.PI * 2);
    ctx.stroke();

    // Get SVG from the hotspot icon function
    let svgString = getHotspotIconSvg(iconName);

    // Replace currentColor with white to ensure visibility on dark background
    svgString = svgString.replace(/currentColor/g, 'white');

    // Create a blob from SVG string
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create and return texture early, it will be updated when image loads
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;

    // Create image and load SVG
    const img = new Image();
    img.onload = () => {
      // Draw the SVG icon centered on canvas (scaled down a bit)
      const iconSize = 280; // Size of the icon - scaled for 512x512
      const x = (512 - iconSize) / 2;
      const y = (512 - iconSize) / 2;

      ctx.drawImage(img, x, y, iconSize, iconSize);
      
      // IMPORTANT: Signal Three.js that the texture needs to be updated
      texture.needsUpdate = true;
      
      URL.revokeObjectURL(svgUrl);
    };

    img.onerror = () => {
      console.error('Failed to load SVG icon:', iconName);
      URL.revokeObjectURL(svgUrl);

      // Fallback: draw a simple question mark
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 100px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 128, 128);
      texture.needsUpdate = true;
    };

    img.src = svgUrl;

    return texture;
  } catch (err) {
    console.error('Error creating hotspot icon texture:', err);

    // Fallback: draw error icon
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', 128, 128);
    
    return new THREE.CanvasTexture(canvas);
  }
}

/**
 * Create a textured hotspot geometry
 * Uses a plane that always faces the camera (billboard effect)
 */
export function createHotspotGeometry(iconName: string): {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
} {
  // Use a plane instead of sphere for better icon visibility
  // Reduced from 40x40 to 20x20 for proper VR scale
  const geometry = new THREE.PlaneGeometry(20, 20);

  const texture = createHotspotIconTexture(iconName);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    alphaTest: 0.1, // Only render pixels with some opacity
  });

  return { geometry, material };
}

/**
 * Create a glowing halo effect material
 */
export function createHotspotHaloMaterial(): THREE.Material {
  // Create a circular radial gradient for the halo
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(59, 59, 59, 0.5)');
    gradient.addColorStop(0.7, 'rgba(59, 59, 59, 0.2)');
    gradient.addColorStop(1, 'rgba(59, 59, 59, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
  }
  
  const texture = new THREE.CanvasTexture(canvas);

  return new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false, // Don't write to depth buffer to avoid occlusion issues
  });
}
