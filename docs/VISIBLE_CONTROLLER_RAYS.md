# Visible Controller Rays & Hotspot Selection in WebXR

## Overview

This document describes the new visible controller ray feature and hotspot selection tracking added to Panoramate's WebXR VR viewer.

## Changes Made

### 1. **WebXRViewer.tsx** - New Props

Added two new props to customize VR interaction feedback:

```typescript
interface WebXRViewerProps {
  // ... existing props ...
  onHotspotSelected?: (hotspot: HotspotType | null) => void;
  showControllerRays?: boolean;
}
```

#### Props Details:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onHotspotSelected` | `(hotspot \| null) => void` | `undefined` | Callback fired when user points at a hotspot or moves away |
| `showControllerRays` | `boolean` | `true` | Show/hide visible laser rays from controllers |

### 2. **Controller Rays** - Visible Feedback

#### What Changed:
- ❌ **Before:** Only a center reticle was visible (invisible raycasting in background)
- ✅ **After:** Visible laser rays from each controller showing where they point

#### Visual Behavior:

```
Controller Ray Colors:
┌─────────────────────────────────────┐
│ 🔵 BLUE (#0066FF)                  │
│ Default ray color when not hitting  │
│ any hotspot                         │
│                                     │
│ 🟢 GREEN (#00FF00)                 │
│ Ray color when pointing at a hotspot│
│ Shows immediate visual feedback     │
└─────────────────────────────────────┘
```

#### Implementation Details:

**New Function: `createOrUpdateControllerRay()`**

Located in `WebXRViewer.tsx:102-147`, this function:

```typescript
const createOrUpdateControllerRay = (
  sourceIndex: number,        // Which controller (0 or 1)
  origin: THREE.Vector3,      // Controller position
  direction: THREE.Vector3,   // Controller pointing direction
  hitDistance: number | null  // Distance to hotspot if hit
) => {
  // Creates/updates a Three.js Line object for visual representation
  // Changes color based on whether it hits a hotspot
  // Updates every frame to follow controller movement
}
```

### 3. **Hotspot Selection Tracking** - `onHotspotSelected`

#### What Changed:
- ❌ **Before:** No way to track when user points at hotspot (only when clicked)
- ✅ **After:** Callback fires when hotspot is selected (pointed at) or deselected (moved away)

#### Selection vs. Click:

| Event | When | Callback | Use Case |
|-------|------|----------|----------|
| **Selected** | User points ray at hotspot | `onHotspotSelected()` | Show hotspot title/preview |
| **Clicked** | User presses trigger on hotspot | `onHotspotClick()` | Navigate or open panel |

#### Example Usage:

```typescript
// In page component
const [selectedHotspot, setSelectedHotspot] = useState(null);

const handleHotspotSelected = (hotspot) => {
  setSelectedHotspot(hotspot);

  // Show hotspot preview while user is pointing at it
  if (hotspot) {
    console.log('👁️ User is looking at:', hotspot.title);
    // Could animate a tooltip or change UI
  } else {
    console.log('👀 User moved away');
  }
};

<WebXRViewer
  onHotspotSelected={handleHotspotSelected}
  onHotspotClick={handleHotspotClick}
  // ...
/>
```

### 4. **Implementation in page.tsx**

**State:**
```typescript
const [selectedHotspotVR, setSelectedHotspotVR] = useState(null);
```

**Handler:**
```typescript
const handleHotspotSelected = (hotspot) => {
  setSelectedHotspotVR(hotspot);
  if (hotspot) {
    console.log('[VR] Hotspot selected:', {
      id: hotspot.id,
      title: hotspot.title,
      type: hotspot.type,
    });
  } else {
    console.log('[VR] Hotspot deselected');
  }
};
```

**Passing to WebXRViewer:**
```jsx
<WebXRViewer
  scenes={tour.images}
  hotspots={tour.images.flatMap((img) => img.hotspots || [])}
  currentSceneId={currentSceneId}
  onExitVR={() => setIsVRMode(false)}
  onHotspotClick={handleHotspotClick}
  onHotspotSelected={handleHotspotSelected}  // ← New
  showControllerRays={true}                   // ← New
/>
```

## Technical Details

### Controller Ray References

New refs added to WebXRViewer:

```typescript
// Store rays for each controller (0 = left, 1 = right)
const controllerRaysRef = useRef<Map<number, THREE.Line>>(new Map());

// Materials for different states
const rayMaterialHitRef = new THREE.LineBasicMaterial({
  color: 0x00ff00,  // Green for hit
  linewidth: 3
});

const rayMaterialDefaultRef = new THREE.LineBasicMaterial({
  color: 0x0066ff,  // Blue for default
  linewidth: 2
});
```

### handleVRInput() Changes

In `WebXRViewer.tsx:464-544`:

1. **Calculate hit distance:**
```typescript
const intersects = raycasterRef.current.intersectObjects(hotspotsRef.current);
const hitDistance = intersects.length > 0 ? intersects[0].distance : null;
```

2. **Update visible ray every frame:**
```typescript
createOrUpdateControllerRay(
  sourceIndex,
  raycasterRef.current.ray.origin,
  raycasterRef.current.ray.direction,
  hitDistance  // null if no hit
);
```

3. **Track selected hotspot:**
```typescript
if (intersects.length > 0) {
  const hitObject = intersects[0].object;

  // Fire selection callback (different from click)
  if (selectedHotspotRef.current !== hitObject) {
    selectedHotspotRef.current = hitObject;
    onHotspotSelected?.(hitObject.hotspotData);  // ← New
  }
}
```

### Cleanup

When component unmounts, rays are cleaned up:

```typescript
const cleanupControllerRays = () => {
  controllerRaysRef.current.forEach((ray) => {
    scene.remove(ray);
    ray.geometry.dispose();
  });
  controllerRaysRef.current.clear();
};
```

## Console Logging

When in development mode, watch the browser console for detailed feedback:

```
[WebXR] Hotspot selected (raycasting)
  hotspotId: "hotspot-123"
  title: "Museum Info"

[WebXR] Hotspot deselected

[VR] Hotspot selected:
  {
    id: "hotspot-123",
    title: "Museum Info",
    type: "INFO"
  }
```

## User Experience Flow (VR)

```
User puts on headset
    ↓
Enters VR mode
    ↓
Points controller at panorama
    ├─ 🔵 Blue ray appears
    └─ onHotspotSelected(null)
    ↓
Points at hotspot
    ├─ 🟢 Ray turns green
    ├─ Hotspot scales up (+15%)
    ├─ Ray length shortens to hit point
    └─ onHotspotSelected(hotspot)
       ├─ Page could show preview
       └─ Console logs selection
    ↓
Presses trigger
    ├─ onHotspotClick(hotspot)
    ├─ Scene changes OR panel opens
    └─ Haptic vibration feedback
    ↓
Moves away from hotspot
    ├─ Ray turns back to blue
    ├─ Hotspot scales down
    └─ onHotspotSelected(null)
       └─ Page hides preview
```

## Performance Considerations

- **Ray geometry updated every frame** (~90 FPS in VR)
- **Material references reused** (not created per frame)
- **Raycasting only on hotspots** (not scene geometry)
- **Lines are lightweight** (just two points per controller)

Memory usage: **< 1MB** for rays (minimal overhead)

## Future Enhancements

Potential improvements:

1. **Ray customization:**
   - Configurable colors
   - Thickness/width settings
   - Animated gradient along ray
   - Ray hit point indicator

2. **Advanced selection:**
   - Dwell time detection (select after 1 second)
   - Multi-selection with both controllers
   - Haptic feedback on selection (not just click)

3. **UI Integration:**
   - Show hotspot title while pointing
   - Haptic pulse intensity based on distance to hotspot
   - Ray-based gesture recognition

## Troubleshooting

### Rays not showing:
- Check `showControllerRays={true}` is passed to WebXRViewer
- Verify `renderer.xr.enabled = true` in scene init
- Check browser console for errors

### onHotspotSelected not firing:
- Ensure callback is connected: `onHotspotSelected={handleHotspotSelected}`
- Check that hotspots exist in current scene
- Verify raycasting is working (look for console logs)

### Ray color not changing:
- Check material colors are correct
- Verify `hitDistance` is being calculated properly
- Check material assignment in `createOrUpdateControllerRay()`

## Files Modified

- ✅ `src/components/viewer/WebXRViewer.tsx` - Main implementation
- ✅ `src/app/tour/[shareToken]/page.tsx` - Integration and state management

## Testing Checklist

- [ ] Build passes TypeScript checks: `npx tsc --noEmit`
- [ ] VR viewer loads without errors
- [ ] Start VR session with headset
- [ ] See blue rays from both controllers
- [ ] Rays turn green when pointing at hotspots
- [ ] Console shows selection logs
- [ ] Clicking hotspot still works (haptic + panel/navigation)
- [ ] Exiting VR cleans up rays properly
- [ ] No memory leaks on cleanup

---

**Last Updated:** 2026-05-08
**Author:** Claude Code
