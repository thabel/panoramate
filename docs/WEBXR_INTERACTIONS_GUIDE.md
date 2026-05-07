# WebXR Interactions Guide - Developer Resource

## 📚 Table of Contents
1. [Core Concepts](#core-concepts)
2. [Implementation Architecture](#implementation-architecture)
3. [Key Technologies](#key-technologies)
4. [How Hotspot Interactions Work](#how-hotspot-interactions-work)
5. [Raycastingdeep Dive](#raycasting-deep-dive)
6. [Visual Feedback System](#visual-feedback-system)
7. [Haptic Feedback](#haptic-feedback)
8. [Common Patterns & Best Practices](#common-patterns--best-practices)
9. [Learning Resources](#learning-resources)
10. [Troubleshooting](#troubleshooting)

---

## Core Concepts

### What is WebXR?

**WebXR** is the W3C standard for accessing Extended Reality (XR) devices - VR headsets, AR glasses, and other spatial computing devices - directly from a web browser.

**Key APIs:**
- `navigator.xr` - Entry point for XR sessions
- `XRSession` - Represents active VR/AR session
- `XRFrame` - Single frame of XR rendering (called ~90fps on VR headsets)
- `XRInputSource` - Controller or hand input

### VR Session Lifecycle

```
User clicks "Enter VR"
        ↓
navigator.xr.requestSession('immersive-vr')
        ↓
Browser prompts user to confirm headset
        ↓
XRSession created
        ↓
Renderer enters stereoscopic rendering mode
        ↓
Animation loop runs per-frame with XRFrame
        ↓
User clicks "Exit VR"
        ↓
session.end()
        ↓
Back to normal 2D rendering
```

---

## Implementation Architecture

### Three.js + WebXR Structure in Panoramate

```
Component: WebXRViewer.tsx
    ├── Initialize Scene (Three.js)
    │   ├── Scene, Camera, Renderer
    │   ├── Hotspot Group (for interactive elements)
    │   └── Reticle (visual feedback)
    │
    ├── Load Panorama
    │   └── Create inverted sphere with equirectangular texture
    │
    ├── Update Hotspots
    │   ├── Convert spherical coords → 3D positions
    │   ├── Create canvas textures for icons
    │   └── Add to scene
    │
    ├── VR Input Handler (handleVRInput)
    │   ├── Every frame: Cast ray from controller
    │   ├── Check hotspot intersections
    │   ├── Apply visual feedback (scale)
    │   ├── Detect trigger press transitions
    │   ├── Trigger haptic feedback
    │   └── Call onHotspotClick callback
    │
    └── Animation Loop
        ├── handleVRInput()
        └── renderer.render()
```

### Key Files

| File | Purpose | Key Functions |
|------|---------|---|
| `src/components/viewer/WebXRViewer.tsx` | Main VR viewer component | `startVRSession()`, `handleVRInput()`, `setHotspotHovered()` |
| `src/lib/webxr-hotspot-texture.ts` | Icon texture generation | `createHotspotGeometry()`, `createHotspotIconTexture()` |
| `src/lib/hotspotIconsSvg.ts` | SVG icon definitions | `getHotspotIconSvg()` |
| `src/hooks/useWebXRSupport.ts` | Detect VR headset capability | `isSupported`, `isReady` |

---

## Key Technologies

### Three.js

Three.js is a JavaScript 3D library that provides:

**Core Concepts:**
- **Scene** - Container for all 3D objects
- **Camera** - The viewpoint (PerspectiveCamera for VR)
- **Renderer** - Draws the scene to canvas (WebGLRenderer)
- **Geometry** - Shape definition (vertices, faces)
- **Material** - How geometry looks (colors, textures)
- **Mesh** - Geometry + Material combined
- **Texture** - Image mapped onto geometry

**Example:**
```typescript
const geometry = new THREE.PlaneGeometry(40, 40);
const material = new THREE.MeshBasicMaterial({ map: texture });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);
```

### Raycaster (Key for Interactions)

A raycaster shoots an invisible ray from a point in a direction and detects what it hits.

```typescript
const raycaster = new THREE.Raycaster();

// Set ray origin and direction (from controller pose)
raycaster.ray.origin = controllerPosition;
raycaster.ray.direction = controllerDirection;

// Find all objects the ray intersects
const intersects = raycaster.intersectObjects(objectsArray);

if (intersects.length > 0) {
  console.log("Hit:", intersects[0].object); // First hit
  console.log("Distance:", intersects[0].distance);
}
```

### WebXR Input

Controllers expose input via the **Gamepad API**:

```typescript
const inputSource = session.inputSources[0]; // First controller
const gamepad = inputSource.gamepad;

// Check button states
if (gamepad.buttons[0].pressed) {
  console.log("Primary trigger held down");
}

// Haptic feedback
if (gamepad.hapticActuators && gamepad.hapticActuators.length > 0) {
  gamepad.hapticActuators[0].pulse(intensity, durationMs);
}
```

**Button Mapping (Meta Quest):**
- Index 0: Primary Trigger (main button)
- Index 1: Grip / Squeeze
- Index 2: Thumbstick / Touchpad
- Index 3: Menu button

---

## How Hotspot Interactions Work

### Step-by-Step: User Points at Hotspot

1. **Continuous Raycasting** (every frame)
   ```
   Controller pose determined from headset tracking
           ↓
   Extract position + orientation from XRFrame
           ↓
   Create ray from controller direction
           ↓
   Test ray against all hotspot meshes
   ```

2. **Hotspot Detected** (ray hits)
   ```
   Raycaster.intersectObjects() returns matches
           ↓
   Extract first (closest) hit
           ↓
   Check if it has hotspotData attached
           ↓
   Call setHotspotHovered()
   ```

3. **Visual Feedback Applied**
   ```
   Save original hotspot scale
           ↓
   Scale it up by 1.15×
           ↓
   Hotspot appears larger to user
   ```

4. **User Presses Trigger**
   ```
   Detect transition: was unpressed → now pressed
           ↓
   Trigger haptic feedback
           ↓
   Call onHotspotClick() callback
           ↓
   Parent component handles (navigate, show info, etc)
   ```

5. **User Moves Away**
   ```
   Ray no longer intersects hotspot
           ↓
   setHotspotHovered() not called
           ↓
   anyHotspotHovered stays false
           ↓
   clearHotspotHovered() restores scale
   ```

### Code Example from WebXRViewer.tsx

```typescript
// Continuous raycasting (called every frame in handleVRInput)
const pose = frame.getPose(inputSource.targetRaySpace, space);
tempMatrixRef.current.fromArray(pose.transform.matrix);
raycasterRef.current.ray.origin.setFromMatrixPosition(tempMatrixRef.current);
raycasterRef.current.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrixRef.current);

// Check intersections
const intersects = raycasterRef.current.intersectObjects(hotspotsRef.current);

if (intersects.length > 0) {
  const hitObject = intersects[0].object as HotspotMesh;

  // Visual feedback
  setHotspotHovered(hitObject);

  // Detect button press (not just held)
  const triggerPressed = inputSource.gamepad?.buttons[0]?.pressed || false;
  const wasPreviouslyPressed = lastButtonStateRef.current.get(sourceIndex) || false;
  const justPressed = triggerPressed && !wasPreviouslyPressed;

  if (justPressed) {
    // Haptic + callback
    hapticActuators[0].pulse(0.8, 100);
    onHotspotClick(hitObject.hotspotData);
  }
}
```

---

## Raycasting Deep Dive

### What is a Ray?

A ray has two components:
- **Origin** (Vector3) - Where the ray starts
- **Direction** (Vector3) - Normalized direction vector

```
     Controller Direction
              ↓
     ╔════════↓════════╗
     ║        ⬤        ║  <- Controller Position (origin)
     ║       ╱│╲       ║
     ║      ╱ │ ╲      ║
     ║     ╱  │  ╲     ║
     ║    ╱   │   ╲    ║
     ║   ╱    │    ╲   ║
     ║  ╱     │     ╲  ║
     ║ ╱      │      ╲ ║
     ╚════════════════╝

     Ray travels along this direction
```

### Matrix Transformation

Controllers give pose as a **4x4 transformation matrix** that includes both position and rotation:

```
Matrix = [
  Right vector   | 0
  Up vector      | 0
  Forward vector | 0
  Position       | 1
]
```

We extract:
- **Position** → Ray origin: `setFromMatrixPosition(matrix)`
- **Forward** → Ray direction: `set(0, 0, -1).applyMatrix4(matrix)`

### Intersection Testing

Three.js Raycaster checks distance from ray to each geometry:

```typescript
const intersects = raycaster.intersectObjects(objects);

// Returns array sorted by distance (closest first)
// [{
//   object: Mesh,          // What was hit
//   point: Vector3,        // World position of hit
//   distance: Number,      // Distance from ray origin to hit
//   face: Face3 | null,    // Which face was hit
//   uv: Vector2 | null,    // Texture coordinate of hit point
// }, ...]
```

### Performance Considerations

- **Only check interactive objects** - Don't raycaster against the panorama sphere
- **Use early exit** - Check intersections once per frame
- **Reuse raycaster** - Create once, reuse (see `raycasterRef`)
- **Reuse matrix** - Don't allocate new Matrix4 each frame (see `tempMatrixRef`)

---

## Visual Feedback System

### Types of Feedback

#### 1. **Reticle** (Always Visible)

Shows where you're aiming, centered on screen:

```typescript
// Created in createReticle()
const geometry = new THREE.PlaneGeometry(0.1, 0.1);
const material = new THREE.MeshBasicMaterial({
  map: reticleTexture,
  depthTest: false,  // Always on top
  depthWrite: false, // Doesn't affect depth
});
reticle.position.z = -3; // In front of camera
```

**Canvas Drawing:**
- Center white dot
- Ring around center
- Crosshair lines

#### 2. **Hotspot Scale Highlight**

When ray hovers over hotspot:

```typescript
// Save original
originalScalesRef.current.set(hotspot, hotspot.scale.clone());

// Scale up
hotspot.scale.multiplyScalar(1.15); // 15% larger

// Later, restore
hotspot.scale.copy(originalScale);
```

**Why scale instead of emissive?**
- `MeshBasicMaterial` doesn't support emissive (requires `MeshPhongMaterial`)
- Scale is simpler and more performant
- Visually clear without changing appearance

#### 3. **Alternative Feedback Ideas**

```typescript
// Color tint
const originalColor = hotspot.material.color.getHex();
hotspot.material.color.setHex(0x4489ff); // Blue tint

// Opacity
hotspot.material.opacity = 0.8;

// Add outline (advanced)
const outlineGeometry = new THREE.EdgesGeometry(hotspot.geometry);
const outline = new THREE.LineSegments(outlineGeometry, lineMaterial);
hotspot.add(outline);
```

---

## Haptic Feedback

### Why Haptic Feedback?

- **Confirmation** - User knows click registered
- **Immersion** - Physical sensation enhances VR
- **Accessibility** - Non-visual feedback
- **Usability** - Less likely to click multiple times

### Gamepad Haptic API

```typescript
const gamepad = inputSource.gamepad;

if (gamepad.hapticActuators && gamepad.hapticActuators.length > 0) {
  gamepad.hapticActuators[0].pulse(intensity, durationMs);
  // intensity: 0.0 - 1.0
  // durationMs: milliseconds
}

// Common patterns:
gamepad.hapticActuators[0].pulse(0.8, 100);  // Strong short buzz
gamepad.hapticActuators[0].pulse(0.3, 50);   // Gentle tap
gamepad.hapticActuators[0].pulse(1.0, 200);  // Full strength longer
```

### Dual Haptic (Both Controllers)

```typescript
inputSources.forEach((source) => {
  if (source.gamepad?.hapticActuators?.[0]) {
    source.gamepad.hapticActuators[0].pulse(0.8, 100);
  }
});
```

### Best Practices

1. **Always use try-catch** - Haptic might fail silently
2. **Combine with visual + audio** - Multimodal feedback is strongest
3. **Don't overuse** - Reserve for important actions
4. **Vary intensity** - Different patterns for different actions

```typescript
// Good pattern
try {
  gamepad.hapticActuators[0].pulse(0.6, 80);
} catch (err) {
  logger.warn('Haptic feedback failed', err);
}

// Play sound effect + haptic together
playSound('click.mp3');
hapticActuators[0].pulse(0.8, 100);
```

---

## Common Patterns & Best Practices

### Pattern 1: Button Press Detection

Detect **transition** (not just state):

```typescript
// WRONG - This detects held, fires every frame
if (gamepad.buttons[0].pressed) {
  onHotspotClick(); // Fires 90 times per second!
}

// RIGHT - Detect transition
const isPressed = gamepad.buttons[0].pressed;
const wasPreviouslyPressed = lastState.get(controllerId);
const justPressed = isPressed && !wasPreviouslyPressed;

lastState.set(controllerId, isPressed);

if (justPressed) {
  onHotspotClick(); // Fires once
}
```

### Pattern 2: Multi-Controller Support

Handle multiple input sources:

```typescript
inputSources.forEach((source, index) => {
  // Process each controller separately
  const pose = frame.getPose(source.targetRaySpace, space);

  // Track button state per controller
  lastButtonState.set(index, source.gamepad.buttons[0].pressed);
});
```

### Pattern 3: Hover State Management

Track which object is currently hovered:

```typescript
const hoveredRef = useRef<Mesh | null>(null);

const setHovered = (mesh) => {
  // Clear previous
  if (hoveredRef.current) {
    clearHovered(hoveredRef.current);
  }

  // Set new
  hoveredRef.current = mesh;
  applyHoverStyle(mesh);
};

const clearHovered = (mesh) => {
  restoreStyle(mesh);
  hoveredRef.current = null;
};
```

### Pattern 4: Resource Cleanup

Prevent memory leaks:

```typescript
// On component unmount or scene change
clearHovered();
originalScalesMap.clear();
lastButtonStateMap.clear();

// Dispose Three.js resources
geometry.dispose();
material.dispose();
texture.dispose();
```

### Pattern 5: Error Handling

```typescript
try {
  const pose = frame.getPose(source.targetRaySpace, space);
  if (!pose) {
    // Pose data unavailable (can happen mid-session)
    logger.warn('No pose data');
    return;
  }
  // Use pose...
} catch (err) {
  logger.error('Pose error', err);
}
```

---

## Learning Resources

### 📖 Official Documentation

**W3C WebXR:**
- [WebXR Device API Spec](https://www.w3.org/TR/webxr/) - Official spec (technical)
- [Mozilla WebXR Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API) - Beginner friendly

**Three.js:**
- [Three.js Documentation](https://threejs.org/docs/) - Official docs
- [Three.js Raycaster](https://threejs.org/docs/index.html#api/en/core/Raycaster) - Intersection details
- [Three.js Material Types](https://threejs.org/docs/index.html#api/en/materials/Material) - Material comparison

**Gamepad API:**
- [MDN Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API) - Controller input

### 🎬 Video Tutorials

**Three.js:**
- [Three.js Course - Threejs.r3f.dev](https://threejs.r3f.dev/) - Interactive tutorials
- "Three.js Journey" by Bruno Simon - Comprehensive paid course
- "Three.js Raycaster" - Search for tutorials on YouTube

**WebXR:**
- "WebXR Essentials" - Google Codelabs
- "VR Web Development" - Various YouTube channels
- "Meta Quest Developer Docs" - Device-specific tutorials

### 💻 Example Code

**Google WebXR Samples:**
```bash
git clone https://github.com/immersive-web/webxr-samples.git
# Browse examples/hit-test, examples/input, examples/rooms
```

**Three.js Examples:**
- https://threejs.org/examples/ - Interactive examples with source code
- Search for "raycaster", "webxr", "controller"

**Babylon.js** (Alternative framework):
- Better WebXR support out-of-box
- More polished examples

### 🧠 Concepts to Master (In Order)

1. **3D Math Fundamentals** (1-2 weeks)
   - Vectors (direction, position)
   - Matrices (transformation, rotation)
   - Quaternions (smooth rotation)

2. **Three.js Basics** (2-3 weeks)
   - Scene, camera, renderer
   - Geometries and materials
   - Lighting and shadows
   - Raycasting

3. **WebXR Fundamentals** (1-2 weeks)
   - Session lifecycle
   - Input sources (controllers)
   - Reference spaces
   - Frame loop

4. **Advanced Interactions** (Ongoing)
   - Hand tracking
   - Gaze-based selection
   - Physics simulation
   - Spatial audio

---

## Troubleshooting

### "Hotspots not clickable in VR"

**Symptoms:** Hotspots visible but raycasting doesn't detect them

**Causes:**
1. Hotspots not in `hotspotsRef.current` array
2. Raycaster pointing in wrong direction
3. Hotspot scale/position changed after raycasting setup

**Fix:**
```typescript
// Debug: Log what's being raycasted
console.log('Hotspots to raycast:', hotspotsRef.current.length);
console.log('Ray origin:', raycasterRef.current.ray.origin);
console.log('Ray direction:', raycasterRef.current.ray.direction);

// Verify hotspots are in scene
hotspotGroupRef.current.children.forEach(child => {
  console.log('Hotspot in scene:', child);
});
```

### "Haptic feedback not working"

**Symptoms:** Controller doesn't vibrate on click

**Causes:**
1. Device doesn't support haptic (older controllers)
2. `hapticActuators` not initialized
3. Promise rejected silently

**Fix:**
```typescript
// Check support
if (!gamepad.hapticActuators || gamepad.hapticActuators.length === 0) {
  console.log('No haptic support on this device');
}

// Add error handling
gamepad.hapticActuators[0]
  .pulse(0.8, 100)
  .catch(err => console.error('Haptic failed:', err));
```

### "Reticle not visible"

**Symptoms:** Crosshair not showing in VR

**Causes:**
1. Canvas texture not rendering
2. `depthTest: false` not set
3. Position too far back

**Fix:**
```typescript
// Verify reticle properties
if (reticleRef.current) {
  console.log('Reticle position:', reticleRef.current.position);
  console.log('Reticle material:', reticleRef.current.material);

  // Make sure it's visible
  reticleRef.current.visible = true;

  // Ensure far in front
  reticleRef.current.position.z = -3;
}
```

### "Hotspot highlight not resetting"

**Symptoms:** Hotspot stays scaled after moving away

**Causes:**
1. `clearHotspotHovered()` not being called
2. `hoveredHotspotRef.current` not null
3. Original scale not saved

**Fix:**
```typescript
// Verify hover state is tracked
console.log('Hovered hotspot:', hoveredHotspotRef.current);
console.log('Scales saved:', originalScalesRef.current.size);

// Make sure clearHotspotHovered is called
// in handleVRInput when no intersections found
```

### "Performance drops in VR"

**Symptoms:** Framerate drops, judder in headset

**Causes:**
1. Raycasting too many objects
2. Creating new objects/materials every frame
3. Texture too large
4. Too many hotspots

**Fix:**
```typescript
// Reduce hotspots in scene
const visibleHotspots = hotspots.filter(
  h => h.imageId === currentSceneId && isInFOV(h)
);

// Reuse raycaster and matrices (already done in WebXRViewer)
const raycasterRef = useRef(new THREE.Raycaster());

// Use simpler materials for non-interactive objects
// Batch objects with same material
```

---

## Summary

The WebXR interaction system in Panoramate combines:

1. **Continuous raycasting** - Every frame check what controller points at
2. **Visual feedback** - Scale hotspots up when hovered
3. **Haptic feedback** - Vibrate on click
4. **Reticle** - Show aiming direction
5. **Proper state management** - Track hover/click states correctly

This creates an intuitive, responsive VR experience where users can easily interact with hotspots.

---

**Last Updated:** 2025-05-07
**Author:** Claude Code Team
**Status:** Active - Used in production Panoramate VR viewer
