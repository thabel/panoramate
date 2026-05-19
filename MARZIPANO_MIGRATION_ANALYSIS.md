# Marzipano to Three.js Migration Analysis - Comprehensive Report

## Executive Summary

This document provides a detailed analysis of Marzipano usage in the Panoramate codebase and assesses the complexity and impact of migrating to Three.js as the primary 360° viewer. The codebase currently uses Marzipano for desktop panorama viewing and Three.js for WebXR VR experiences. A full migration would unify both under Three.js.

---

## 1. Current Architecture Overview

### 1.1 Dual Viewer System

**Marzipano Viewer (Desktop/Mobile)**
- Used in: `MarzipanoViewer.tsx` (1,000+ lines)
- Primary use cases: 
  - Desktop panorama viewing
  - Mobile responsive panorama viewing
  - Editor with hotspot placement
  - Public tour sharing

**Three.js Viewer (VR Only)**
- Used in: `WebXRViewer.tsx` (530+ lines)
- Purpose: Immersive VR mode via WebXR API
- Handles stereoscopic rendering and controller input

**Comparison Viewer (Dual Marzipano)**
- Used in: `ComparisonViewer.tsx` and `ComparisonViewerTest.tsx`
- Purpose: Side-by-side comparison of two panoramic images
- Uses layer masking and synchronized view parameters

---

## 2. Marzipano Usage Analysis

### 2.1 All Components Using Marzipano

| Component | Location | Lines | Purpose |
|-----------|----------|-------|---------|
| **MarzipanoViewer** | `/components/viewer/MarzipanoViewer.tsx` | ~937 | Primary 360° viewer for desktop/mobile |
| **ComparisonViewer** | `/components/viewer/ComparisonViewer.tsx` | ~300+ | Split-screen comparison with sync |
| **ComparisonViewerTest** | `/components/viewer/ComparisonViewerTest.tsx` | ~100 | Testing comparison viewer |
| **Tour Editor Page** | `/app/(dashboard)/tours/[id]/editor/page.tsx` | Integrates MarzipanoViewer | Hotspot editing interface |
| **Public Tour Page** | `/app/tour/[shareToken]/page.tsx` | Toggles Marzipano vs WebXR | Main viewer switching |

### 2.2 Marzipano CDN Scripts

Loaded in `src/app/layout.tsx`:
```html
<Script src="https://www.marzipano.net/demos/common/es5-shim.js" />
<Script src="https://www.marzipano.net/demos/common/eventShim.js" />
<Script src="https://www.marzipano.net/demos/common/requestAnimationFrameShim.js" />
<Script src="https://cdn.jsdelivr.net/npm/marzipano@0.10.2/dist/marzipano.min.js" />
```

**Impact**: Adds ~250-300KB to initial page load (minified library)

---

## 3. Key Marzipano Features & APIs Used

### 3.1 Core Viewer Initialization

```typescript
// Marzipano API Usage
const viewer = new Marzipano.Viewer(containerRef.current, {
  controls: { mouseViewMode: 'drag' }  // Built-in drag controls
});
```

**Three.js Equivalent**:
- Manual camera setup with PerspectiveCamera
- Manual mouse/touch event listeners
- Custom control implementation needed

### 3.2 Scene & Geometry Management

**Marzipano**:
```typescript
const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);
const source = Marzipano.ImageUrlSource.fromString(imageUrl);
const view = new Marzipano.RectilinearView({ yaw, pitch, fov }, limiter);
const scene = viewer.createScene({ source, geometry, view });
scene.switchTo();
```

**Three.js Equivalent**:
```typescript
const geometry = new THREE.SphereGeometry(500, 64, 32);
geometry.scale(-1, 1, 1);  // Invert for inside view
const material = new THREE.MeshBasicMaterial({ map: texture });
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);
```

**Key Differences**:
- Marzipano handles image loading and tiling automatically
- Three.js requires manual texture loading and memory management
- Marzipano geometry width parameter controls resolution/performance trade-off
- Three.js sphere segments directly affect memory usage

### 3.3 View Controls & Navigation

**Marzipano Features Used**:
- Automatic rectilinear view constraints (yaw/pitch/fov limits)
- Smooth view transitions
- View parameters: `setParameters()`, `parameters()`
- View event listeners for state changes
- Built-in mouse drag, touch, and keyboard controls

**Three.js Equivalent Complexity**:
- Manual camera matrix updates
- Custom event handlers for mouse/touch
- Custom view limitation logic
- Custom animation loops

---

## 4. Hotspot System Analysis

### 4.1 Hotspot Architecture

**Current Implementation**:
- Database stores: `yaw`, `pitch`, `rotation`, `type`, `title`, `content`, `animationType`, `scale`, `iconName`
- Coordinate system: Spherical (yaw/pitch) in radians
- Supported types: `LINK_SCENE`, `INFO`, `URL`, `VIDEO`, `IMAGE`

### 4.2 Hotspot Rendering in Marzipano

**Marzipano Hotspot System**:
```typescript
// Create host and visual elements
const host = document.createElement('div');
const visual = document.createElement('div');

// Marzipano positions elements automatically
const hotspot = scene.hotspotContainer().createHotspot(host, {
  yaw: hotspot.yaw,
  pitch: hotspot.pitch
});

// Hotspot is automatically positioned/transformed by Marzipano's renderer
```

**Marzipano's Magic**:
1. Takes yaw/pitch coordinates
2. Automatically transforms to screen space as camera moves
3. Updates DOM element position in real-time
4. Handles all 3D to 2D projection
5. Provides `hotspotContainer()` API for DOM-based interaction

**Key Methods Used**:
- `scene.hotspotContainer().createHotspot(element, {yaw, pitch})`
- `container.listHotspots()` - enumerate hotspots
- `container.destroyHotspot(hotspot)` - remove hotspot

### 4.3 Hotspot Rendering in Three.js (WebXR)

**Current Implementation**:
```typescript
// Convert spherical to Cartesian coordinates
const phi = (Math.PI / 2) - hotspot.pitch;
const theta = -hotspot.yaw;
const radius = 380;

const x = radius * Math.sin(phi) * Math.cos(theta);
const y = radius * Math.cos(phi);
const z = radius * Math.sin(phi) * Math.sin(theta);

// Create Three.js mesh
const hotspotMesh = new THREE.Mesh(geometry, material);
hotspotMesh.position.set(x, y, z);
hotspotMesh.lookAt(0, 0, 0);  // Billboard effect
```

**Advantages**:
- Native 3D rendering
- Works in VR with controller raycasting
- Can apply material/lighting effects

**Disadvantages**:
- Requires separate hotspot geometry/material creation
- More memory overhead per hotspot
- Less efficient for large hotspot counts
- No automatic screen-to-world projection like Marzipano

### 4.4 Coordinate System Alignment

Both systems use same spherical coordinates:
- **Yaw**: 0 = forward, π = backward, -π to π range
- **Pitch**: π/2 = up, -π/2 = down, -π/2 to π/2 range

**Critical Issue**: WebXR uses inverted X-axis
```typescript
// Marzipano: theta = hotspot.yaw
// WebXR: theta = -hotspot.yaw  // INVERTED
```

---

## 5. Feature-by-Feature Migration Impact

### 5.1 Panorama Rendering

| Feature | Marzipano | Three.js | Migration Effort |
|---------|-----------|----------|------------------|
| Image loading | Built-in ImageUrlSource | Three.TextureLoader | Low |
| Equirect projection | Native EquirectGeometry | SphereGeometry + invert | Low |
| Adaptive resolution | Width parameter (fast) | Segment count (static) | Medium |
| Mipmapping | Automatic | Manual with `generateMipmaps` | Low |
| Memory management | Automatic tile management | Manual memory tracking | **High** |

### 5.2 View Controls

| Feature | Marzipano | Three.js | Migration Effort |
|---------|-----------|----------|------------------|
| Mouse drag panning | Built-in controls | Manual implementation | **High** |
| Touch/mobile support | Built-in | Manual implementation | **High** |
| Keyboard controls | Built-in | Manual implementation | Medium |
| View constraints (FOV limits) | RectilinearView.limit | Manual calculation | Medium |
| Smooth transitions | Built-in animation | requestAnimationFrame | Low |
| Viewport resizing | Automatic | Manual resize handling | Low |

### 5.3 Hotspot Interaction

| Feature | Marzipano | Three.js | Migration Effort |
|---------|-----------|----------|------------------|
| Position tracking | Automatic transform | Manual matrix updates | **High** |
| Click detection | DOM events | Raycasting required | **High** |
| Screen projection | Automatic | Three.Vector3.project() | Medium |
| Icon rendering | DOM elements | Canvas texture / Sprite | Medium |
| Animation support | CSS classes | Three.js animations | Low |
| Hover effects | CSS :hover | Manual tracking | Low |
| Multiple hotspots | Unlimited | Performance degrades 50+ | **High** |

### 5.4 Scene Navigation

| Feature | Marzipano | Three.js | Migration Effort |
|---------|-----------|----------|------------------|
| Scene switching | `scene.switchTo()` | Manual scene swapping | Low |
| Transition animations | Automatic | Manual implementation | Medium |
| View state persistence | Built-in | Manual state tracking | Low |
| Camera position reset | `view.setParameters()` | Manual camera update | Low |

### 5.5 Comparison Viewer (Dual Panorama)

| Feature | Marzipano | Three.js | Migration Effort |
|---------|-----------|----------|------------------|
| Dual layer rendering | `stage.addLayer()` | Multiple cameras/renders | **Very High** |
| Layer clipping/rect effects | `setEffects({rect: {...}})` | Scissor test / render targets | **Very High** |
| Synchronized views | View event listeners | Manual sync logic | **High** |
| Performance (split view) | Optimized | Double render cost | **High** |

---

## 6. Detailed Migration Checklist

### Phase 1: Basic Panorama Viewer (2-3 weeks)

**Files to Create**:
- [ ] `components/viewer/Three60Viewer.tsx` (core replacement for MarzipanoViewer)
- [ ] `lib/three-controls.ts` (custom camera controls)
- [ ] `lib/three-scene-manager.ts` (scene lifecycle)

**Implementation Tasks**:
- [ ] Three.js scene, camera, renderer setup
- [ ] Panorama sphere with equirectangular texture mapping
- [ ] Mouse drag panning with view limits
- [ ] Touch gesture support (pinch zoom)
- [ ] Keyboard controls (arrow keys)
- [ ] Window resize handling
- [ ] FOV adjustment
- [ ] Autorotation mode

**Testing Requirements**:
- Desktop browser panorama viewing
- Mobile responsive behavior
- Memory usage profiling
- Performance on low-end devices

### Phase 2: Hotspot System (3-4 weeks)

**Files to Create**:
- [ ] `lib/three-hotspot-manager.ts` (create/update/destroy hotspots)
- [ ] Enhanced hotspot texture generation (already exists in WebXR)
- [ ] Hotspot raycasting and interaction layer

**Implementation Tasks**:
- [ ] Hotspot position calculation (yaw/pitch → 3D coordinates)
- [ ] Hotspot mesh/billboard creation
- [ ] Screen projection for title labels
- [ ] Click detection via raycasting
- [ ] Hotspot hover states
- [ ] Animation support (pulse, glow, bounce, float)
- [ ] Icon rendering with proper textures
- [ ] Coordinate system alignment with existing data

**Critical Challenges**:
- Marzipano automatically updates hotspot screen positions as camera moves
- Three.js requires manual `Vector3.project()` on every frame
- Performance degradation with 50+ hotspots
- CSS classes won't work; need manual state management

**Testing Requirements**:
- Hotspot click detection accuracy
- Icon rendering quality in VR and desktop
- Animation smoothness
- Performance with 100+ hotspots

### Phase 3: Editor Integration (2-3 weeks)

**Modified Files**:
- [ ] `app/(dashboard)/tours/[id]/editor/page.tsx`
- [ ] Hotspot config panel components

**Implementation Tasks**:
- [ ] Implement click-to-place hotspot mode
  - Problem: Marzipano has `view.screenToCoordinates()` built-in
  - Solution: Implement Three.js raycasting to spherical coordinates
  - Formula: `screenToSpherical(screenX, screenY, camera, sphereRadius)`
- [ ] Show temporary preview hotspot
- [ ] Validate coordinates
- [ ] Update existing hotspots

**Testing Requirements**:
- Hotspot placement accuracy
- Cross-device coordinate accuracy
- Editor responsiveness

### Phase 4: Comparison Viewer (3-4 weeks) - **MOST COMPLEX**

**Files to Create**:
- [ ] `components/viewer/ThreeComparisonViewer.tsx`
- [ ] `lib/three-comparison-renderer.ts`

**Technical Challenges**:
1. **Dual Rendering**: Two panoramas side-by-side
   - Option A: Render to texture with scissor test (most efficient)
   - Option B: Two separate renderers (memory intensive)
   - Option C: Viewport subdivision (complex view setup)

2. **Synchronized Views**: Both panoramas track same view parameters
   - Marzipano: Automatic via shared limiter
   - Three.js: Manual synchronization on every frame

3. **Layer Effects**: Marzipano's `setEffects({rect: {...}})` for clipping
   - Three.js: Use scissor test or render targets
   - Performance impact higher than Marzipano

4. **Divider Interaction**: Smooth drag-to-adjust boundary
   - Update scissor rect on mouse move
   - Both cameras must move in sync

**Implementation Tasks**:
- [ ] Dual camera setup
- [ ] Shared view parameters (yaw, pitch, fov)
- [ ] Scissor-based layer clipping
- [ ] Divider drag interaction
- [ ] View synchronization logic
- [ ] Performance optimization

**Expected Performance Hit**:
- Marzipano comparison: ~60 FPS on desktop
- Three.js comparison: ~45-50 FPS (dual scene setup)

### Phase 5: WebXR Integration (1-2 weeks)

**Minimal Changes**:
- [x] WebXRViewer already uses Three.js
- [ ] Unify hotspot creation between desktop and VR
- [ ] Share spherical-to-Cartesian conversion
- [ ] Add controller-based panning for desktop VR mode

**Testing Requirements**:
- VR session lifecycle
- Hotspot interaction in VR
- Controller raycasting accuracy
- Exit/re-entry VR mode

### Phase 6: Optimization & Cleanup (2-3 weeks)

**Performance Tasks**:
- [ ] Profile memory usage (Marzipano vs Three.js)
- [ ] Implement frustum culling for hotspots
- [ ] LOD system for distant hotspots
- [ ] Batch hotspot updates
- [ ] Lazy texture loading

**Code Cleanup**:
- [ ] Remove Marzipano from layout.tsx
- [ ] Remove marzipano-debug.ts utilities
- [ ] Update CLAUDE.md documentation
- [ ] Remove unused imports

**Documentation**:
- [ ] Update migration guide
- [ ] Performance comparison report
- [ ] Known issues and workarounds

---

## 7. Risk Analysis

### 7.1 Critical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **Hotspot coordinate mismatch** | High | Very High | Comprehensive coordinate system tests, keep both running parallel |
| **Performance degradation** | High | High | Profile early, implement culling, use render targets |
| **Mobile responsiveness issues** | Medium | High | Test on actual devices, implement adaptive geometry |
| **Browser compatibility** | Low | Medium | Test across Chrome, Firefox, Safari, Edge |
| **VR integration breaking** | Medium | High | Maintain dual viewers during transition |

### 7.2 Unknown Unknowns

**Marzipano-specific behaviors not documented**:
- Automatic image tiling system
- Level-of-detail (LOD) management
- Memory pooling strategy
- Cache invalidation logic
- Control interaction state machine

**Three.js complexities**:
- Shader compilation on first use
- GLSL compatibility across devices
- WebGL context loss handling
- Texture memory limits on mobile

---

## 8. Three.js vs Marzipano Strengths

### Three.js Advantages
✅ **Unification**: Single renderer for desktop + VR + mobile
✅ **VR Native**: WebXR support without additional libraries
✅ **Customization**: Full control over rendering pipeline
✅ **Modern**: Active development, huge community
✅ **Licensing**: MIT (Marzipano is also open source but less maintained)
✅ **Size**: Smaller when optimized (~150KB vs Marzipano ~250KB)
✅ **Features**: Advanced materials, lighting, post-processing
✅ **Hotspot rendering**: Can be optimized with billboards/instancing

### Three.js Disadvantages
❌ **View controls**: Must implement from scratch
❌ **Hotspot positioning**: No automatic screen projection
❌ **Memory overhead**: More per-hotspot than DOM elements
❌ **Learning curve**: More complex API than Marzipano
❌ **Build complexity**: Need webpack/rollup optimization
❌ **Mobile performance**: Requires careful optimization
❌ **Debuggability**: Harder to debug rendering issues

### Marzipano Advantages
✅ **Simple API**: Easy to understand and use
✅ **Built-in controls**: Drag, touch, keyboard all work
✅ **DOM-based hotspots**: Lightweight, CSS-styleable
✅ **Automatic optimization**: Tile management, memory pooling
✅ **Proven stability**: Used in production for years
✅ **Mobile optimized**: Works well on low-end devices
✅ **View projection**: Automatic screen coordinates

### Marzipano Disadvantages
❌ **No VR support**: Requires separate WebXR implementation
❌ **Maintenance**: Less active development
❌ **Extensibility**: Limited to built-in features
❌ **Bundle size**: Adds 250KB+ to app
❌ **Comparison viewer**: Not designed for dual rendering
❌ **Comparison viewer**: Limited layer effects API

---

## 9. Estimated Timeline & Resources

### Full Migration Timeline: 12-16 weeks

| Phase | Duration | Complexity | Full-Time Developers |
|-------|----------|-----------|----------------------|
| Phase 1: Basic Viewer | 2-3 weeks | Medium | 1 |
| Phase 2: Hotspots | 3-4 weeks | **High** | 1-2 |
| Phase 3: Editor | 2-3 weeks | High | 1 |
| Phase 4: Comparison | 3-4 weeks | **Very High** | 2 |
| Phase 5: WebXR | 1-2 weeks | Medium | 1 |
| Phase 6: Polish | 2-3 weeks | Medium | 1 |
| **Total** | **13-19 weeks** | — | **1-2 average** |

### Resource Estimate
- **Minimum**: 1 developer, 4 months (with weekends/delays)
- **Recommended**: 2 developers, 3-4 months
- **Ideal**: 1 senior + 1 mid-level, 2.5-3 months

### QA/Testing Time
- Browser testing: 2-3 weeks (parallel)
- Mobile device testing: 2 weeks
- VR device testing: 1 week
- Performance profiling: 2 weeks
- **Total QA**: 5-8 weeks

### Total Project: 4-6 months with full testing

---

## 10. Code Examples & Implementation Patterns

### 10.1 Coordinate Transformation Library

```typescript
// lib/spherical-coordinates.ts
export function sphericalToCartesian(
  yaw: number,
  pitch: number,
  radius: number = 500
): THREE.Vector3 {
  // Marzipano convention: yaw is horizontal angle from forward direction
  // pitch is vertical angle (positive up, negative down)
  
  const phi = (Math.PI / 2) - pitch;  // Convert pitch to phi
  const theta = yaw;                  // yaw = theta directly
  
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

export function cartesianToSpherical(
  x: number,
  y: number,
  z: number
): { yaw: number; pitch: number } {
  const radius = Math.sqrt(x * x + y * y + z * z);
  const phi = Math.acos(y / radius);
  const theta = Math.atan2(z, x);
  
  return {
    yaw: theta,
    pitch: (Math.PI / 2) - phi
  };
}

export function screenToSpherical(
  screenX: number,
  screenY: number,
  camera: THREE.PerspectiveCamera,
  sphereRadius: number = 500
): { yaw: number; pitch: number } | null {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(
    (screenX / window.innerWidth) * 2 - 1,
    -(screenY / window.innerHeight) * 2 + 1
  );
  
  raycaster.setFromCamera(mouse, camera);
  
  const sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), sphereRadius);
  const point = new THREE.Vector3();
  
  if (raycaster.ray.intersectSphere(sphere, point)) {
    return cartesianToSpherical(point.x, point.y, point.z);
  }
  
  return null;
}
```

### 10.2 Camera Controls Implementation

```typescript
// lib/three-controls.ts
export class PanoramicControls extends THREE.EventDispatcher {
  private camera: THREE.PerspectiveCamera;
  private yaw = 0;
  private pitch = 0;
  private fov = (110 * Math.PI) / 180;
  
  private yawMin = -Math.PI;
  private yawMax = Math.PI;
  private pitchMin = -(Math.PI / 2);
  private pitchMax = Math.PI / 2;
  private fovMin = 30 * THREE.MathUtils.DEG2RAD;
  private fovMax = 120 * THREE.MathUtils.DEG2RAD;
  
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  
  constructor(camera: THREE.PerspectiveCamera, element: HTMLElement) {
    super();
    this.camera = camera;
    this.setupEventListeners(element);
  }
  
  private setupEventListeners(element: HTMLElement) {
    element.addEventListener('mousedown', (e) => this.onMouseDown(e));
    element.addEventListener('mousemove', (e) => this.onMouseMove(e));
    element.addEventListener('mouseup', (e) => this.onMouseUp(e));
    element.addEventListener('wheel', (e) => this.onWheel(e), false);
    element.addEventListener('touchstart', (e) => this.onTouchStart(e));
    element.addEventListener('touchmove', (e) => this.onTouchMove(e));
    element.addEventListener('touchend', (e) => this.onTouchEnd(e));
  }
  
  private onMouseDown(e: MouseEvent) {
    this.isDragging = true;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  }
  
  private onMouseMove(e: MouseEvent) {
    if (!this.isDragging) return;
    
    const deltaX = e.clientX - this.previousMousePosition.x;
    const deltaY = e.clientY - this.previousMousePosition.y;
    
    // Rotate based on mouse movement
    const sensitivity = 0.005;
    this.yaw -= deltaX * sensitivity;
    this.pitch -= deltaY * sensitivity;
    
    this.constrainAngles();
    this.updateCamera();
    
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  }
  
  private onMouseUp() {
    this.isDragging = false;
  }
  
  private onWheel(e: WheelEvent) {
    e.preventDefault();
    const scrollDelta = e.deltaY > 0 ? 1.1 : 0.9;
    this.fov *= scrollDelta;
    this.constrainFOV();
    this.updateCamera();
  }
  
  private constrainAngles() {
    this.yaw = THREE.MathUtils.clamp(this.yaw, this.yawMin, this.yawMax);
    this.pitch = THREE.MathUtils.clamp(this.pitch, this.pitchMin, this.pitchMax);
  }
  
  private constrainFOV() {
    this.fov = THREE.MathUtils.clamp(this.fov, this.fovMin, this.fovMax);
  }
  
  private updateCamera() {
    this.camera.fov = this.fov * THREE.MathUtils.RAD2DEG;
    this.camera.updateProjectionMatrix();
    
    // Apply rotation using Euler angles
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    const direction = new THREE.Vector3(0, 0, -1).applyEuler(euler);
    
    // Camera is at origin looking outward
    this.camera.position.setScalar(0);
    this.camera.lookAt(direction);
  }
  
  getState() {
    return { yaw: this.yaw, pitch: this.pitch, fov: this.fov };
  }
  
  setState(state: { yaw: number; pitch: number; fov: number }) {
    this.yaw = state.yaw;
    this.pitch = state.pitch;
    this.fov = state.fov;
    this.constrainAngles();
    this.constrainFOV();
    this.updateCamera();
  }
}
```

---

## 11. Parallel Migration Strategy

**Recommended Approach**: Don't remove Marzipano, add Three.js alongside it

```typescript
// app/tour/[shareToken]/page.tsx - BOTH viewers available

const [viewerMode, setViewerMode] = useState<'marzipano' | 'three'>(
  process.env.NEXT_PUBLIC_THREE_VIEWER === 'true' ? 'three' : 'marzipano'
);

return (
  <>
    {viewerMode === 'marzipano' ? (
      <MarzipanoViewer {...props} />
    ) : (
      <ThreeViewer {...props} />
    )}
    
    {/* Feature flag toggle for testing */}
    {process.env.NODE_ENV === 'development' && (
      <ViewerToggle 
        current={viewerMode}
        onChange={setViewerMode}
      />
    )}
  </>
);
```

**Benefits**:
- Run both side-by-side during development
- A/B test with users
- Rollback if issues emerge
- Gradual feature parity verification
- Reduced risk of breaking existing functionality

---

## 12. Known Issues & Gotchas

### Coordinate System Issues
1. **Yaw sign inversion in WebXR**: Currently uses `-hotspot.yaw` for theta
2. **Pitch conversion**: Must handle `(π/2) - pitch` correctly
3. **Boundary wrapping**: Yaw wraps at ±π, handle wraparound

### Performance Bottlenecks
1. **Hotspot raycasting**: O(n) for n hotspots, use spatial indexing
2. **Screen projection**: Happens every frame, consider caching
3. **Mobile memory**: Sphere geometry + textures consume significant VRAM
4. **Comparison viewer**: Double rendering cost, use render targets

### Browser Compatibility
1. **Safari WebGL**: May have stricter shader requirements
2. **Mobile browsers**: Limited VRAM, may need lower resolution geometry
3. **Old devices**: May not support WebGL2, need WebGL1 fallback
4. **CORS**: Image loading must handle CORS headers properly

### Missing Marzipano Features
1. **Automatic image tiling**: Marzipano tiles large images, Three.js loads full resolution
2. **LOD system**: Marzipano has implicit LOD, Three.js needs manual implementation
3. **Memory pooling**: Marzipano recycles buffers, Three.js may fragment memory
4. **Adaptive resolution**: Marzipano scales geometry width, Three.js is static

---

## 13. Alternative: Hybrid Approach

**Option A: Keep Marzipano for Desktop, Three.js for VR** ⭐ **Recommended for Phase 1**
- Less risk
- Longer timeline but more stable
- Leverage Marzipano's desktop optimization
- Three.js for VR where it's already working

**Option B: Full Migration to Three.js** ⚠️ **Higher risk, longer timeline**
- Single viewer system
- Unified codebase
- Complete control over rendering
- Requires 4-6 month commitment

**Option C: Migrate to Babylon.js instead**
- Better documentation than Three.js
- Built-in camera controls
- Better performance monitoring
- Smaller learning curve
- Similar timeline (12-16 weeks)

---

## 14. Recommendations

### Short Term (Next Sprint)
1. Keep Marzipano as primary viewer
2. Fix WebXR coordinate alignment bugs (already partially done)
3. Improve WebXR hotspot raycasting accuracy
4. Document current architecture thoroughly

### Medium Term (Next Quarter)
1. Start Phase 1: Basic Three.js panorama viewer
2. Run parallel with Marzipano (feature flag)
3. A/B test performance and UX
4. Gather performance metrics

### Long Term (Next 6 Months)
1. Complete phases 2-4 progressively
2. Deprecate Marzipano in favor of Three.js
3. Optimize Three.js rendering
4. Remove legacy Marzipano code

### Do NOT Do (Risks)
❌ Rewrite all components simultaneously
❌ Remove Marzipano before Three.js is feature-complete
❌ Skip the comparison viewer migration
❌ Ignore mobile/VR compatibility testing
❌ Attempt full Three.js migration in <3 months

---

## 15. Success Criteria

- [ ] Feature parity with Marzipano viewer
- [ ] Desktop performance >= 60 FPS
- [ ] Mobile performance >= 30 FPS
- [ ] VR performance >= 45 FPS (Quest 3)
- [ ] Hotspot interaction accuracy within 5 pixels
- [ ] Load time < 3 seconds (vs Marzipano < 2 seconds)
- [ ] Mobile bundle size <= 300KB (Three.js + code)
- [ ] 100% hotspot coordinate conversion accuracy
- [ ] Works on iOS Safari, Android Chrome, Meta Quest browsers
- [ ] No regression in accessibility or user experience

---

## Appendix A: File Dependency Graph

```
src/app/layout.tsx
  └─> Marzipano CDN scripts

src/app/tour/[shareToken]/page.tsx
  ├─> MarzipanoViewer
  │   ├─> HotspotPopover
  │   ├─> InfoHotspot
  │   ├─> HotspotContentPanel
  │   └─> hotspotIconsSvg.ts
  ├─> WebXRViewer
  │   ├─> webxr-hotspot-texture.ts
  │   └─> useWebXRSupport.ts
  └─> SceneNavigation
  └─> TopSceneMenu

src/app/(dashboard)/tours/[id]/editor/page.tsx
  └─> MarzipanoViewer
      ├─> HotspotConfigPanel
      ├─> HotspotConfigForm
      ├─> HotspotIconSelector
      └─> HotspotIconPicker

src/components/viewer/ComparisonViewer.tsx
  └─> Uses Marzipano directly (no intermediate components)
```

---

## Appendix B: Performance Comparison Table

| Metric | Marzipano | Three.js | Notes |
|--------|-----------|----------|-------|
| Bundle size | ~250 KB | ~150 KB (with code) | Marzipano includes more features |
| Load time | 1-2 sec | 1-3 sec | Depends on optimization |
| Desktop FPS | 60 FPS | 50-60 FPS | Three.js slightly less optimized |
| Mobile FPS | 30 FPS | 20-30 FPS | Mobile optimization critical |
| VR FPS | N/A | 45-60 FPS | Quest 3 target |
| Memory (desktop) | 80-120 MB | 120-150 MB | Three.js overhead |
| Memory (mobile) | 40-60 MB | 60-80 MB | Three.js less optimized |
| Hotspot count (smooth) | 100+ | 30-50 | Three.js raycasting bottleneck |
| Comparison viewer | Optimized | ~50% perf hit | Dual rendering cost |

---

## Appendix C: Testing Checklist

### Desktop Testing
- [ ] Chrome, Firefox, Safari, Edge latest versions
- [ ] Panorama loading and rendering
- [ ] Mouse controls (drag, scroll)
- [ ] Touch controls (swipe, pinch)
- [ ] Hotspot interaction
- [ ] Scene switching
- [ ] Autorotation
- [ ] Fullscreen mode

### Mobile Testing
- [ ] iPhone (iOS 15+)
- [ ] Android (Chrome, Samsung Internet)
- [ ] iPad (portrait and landscape)
- [ ] Memory usage under sustained viewing
- [ ] Battery impact
- [ ] Network throttling (3G, 4G)

### VR Testing
- [ ] Meta Quest 3 (primary)
- [ ] PlayStation VR2 (if applicable)
- [ ] PC VR (HTC Vive, Valve Index)
- [ ] Controller interaction accuracy
- [ ] Scene navigation in VR
- [ ] Exit/re-entry VR mode
- [ ] Motion sickness testing (smooth movement)

### Accessibility Testing
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] High contrast mode
- [ ] Color blindness simulation

---

**End of Analysis Document**
