# WebXR Implementation Guide

## 📱 Overview

Panoramate now includes **immersive VR support** using WebXR API and Three.js. Users can experience 360° panoramic tours on VR headsets like Meta Quest 3 with interactive hotspots.

## 🎯 Features

- **Immersive VR Mode**: Full stereoscopic 3D rendering using WebXR
- **Controller Interaction**: Click hotspots with VR controllers
- **Scene Navigation**: Seamless switching between panoramic scenes
- **Hotspot Support**: All hotspot types (links, info boxes) work in VR
- **Easy Exit**: Quick button to exit VR mode back to desktop view

## 🏗️ Architecture

### New Files Created

```
src/
├── hooks/
│   └── useWebXRSupport.ts          # WebXR capability detection hook
└── components/viewer/
    └── WebXRViewer.tsx             # Three.js + WebXR viewer component
```

### Modified Files

- `src/app/tour/[shareToken]/page.tsx` - Added VR button and mode switching
- `package.json` - Added three.js dependency

## 🛠️ Technical Details

### useWebXRSupport Hook

```typescript
const { isSupported, isReady } = useWebXRSupport();
```

Detects if the browser/device supports immersive VR:
- Checks `navigator.xr` availability
- Tests `immersive-vr` session support
- Provides `isSupported` boolean flag

### WebXRViewer Component

Three.js-based viewer that:

1. **Loads Panorama**: Converts equirectangular image to inverted sphere
2. **Creates Hotspots**: Converts yaw/pitch coordinates to 3D positions
3. **Handles Input**: Raycast detection for controller trigger clicks
4. **Manages Sessions**: VR session lifecycle (enter/exit)
5. **Renders Stereo**: WebXR handles stereo rendering automatically

### Hotspot Interaction Flow

```
VR Controller Trigger Pressed
    ↓
Frame Input Handling
    ↓
Raycast from Controller Direction
    ↓
Intersection Detection with Hotspot Spheres
    ↓
Hotspot Click Callback
    ↓
Scene Navigation or Info Display
```

## 🎮 Usage

### For Users

1. **View Tour**: Open any public tour on a VR-capable browser (Quest, etc.)
2. **Click VR Button**: Look for the headset icon in top-right controls
3. **Enter VR**: Click button → accept permission → device enters VR mode
4. **Navigate**: Look around with head movement
5. **Click Hotspots**: Point controller at hotspot, pull trigger
6. **Exit VR**: Click red X button in top-right, or use Quest dashboard

### For Developers

```tsx
// In a page component:
import { WebXRViewer } from '@/components/viewer/WebXRViewer';
import { useWebXRSupport } from '@/hooks/useWebXRSupport';

export default function MyPage() {
  const { isSupported } = useWebXRSupport();
  const [isVRMode, setIsVRMode] = useState(false);

  return (
    <>
      {isVRMode ? (
        <WebXRViewer
          scenes={scenes}
          hotspots={hotspots}
          currentSceneId={currentSceneId}
          onExitVR={() => setIsVRMode(false)}
          onHotspotClick={handleHotspotClick}
        />
      ) : (
        <MarzipanoViewer {...props} />
      )}

      {isSupported && (
        <button onClick={() => setIsVRMode(true)}>
          Enter VR
        </button>
      )}
    </>
  );
}
```

## 📊 Data Flow

### Scene Loading

```
Browser (Desktop)
    ↓
Click VR Button
    ↓
navigator.xr.requestSession('immersive-vr')
    ↓
Device enters VR mode
    ↓
Three.js Renderer in XR mode
    ↓
Load Panorama Texture
    ↓
Create Hotspot Spheres
    ↓
Render Stereo View
```

### Coordinate System

- **Yaw**: Horizontal rotation (0 = forward, π = backward)
- **Pitch**: Vertical rotation (π/2 = up, -π/2 = down)

Conversion to 3D:
```
phi = (π/2) - pitch
theta = yaw

x = radius × sin(phi) × cos(theta)
y = radius × cos(phi)
z = radius × sin(phi) × sin(theta)
```

## 🔧 Browser Support

| Browser | Device | Support |
|---------|--------|---------|
| Chrome | Meta Quest 3 | ✅ Full |
| Firefox | Meta Quest | ✅ Full |
| Safari | iOS (Vision Pro) | ⚠️ Partial |
| Edge | Windows VR | ✅ Full |

## 🚀 Performance Optimization

1. **Geometry Reduction**: Hotspot spheres use 16 segments (not 64)
2. **Texture Optimization**: Uses LinearFilter for smooth panorama
3. **Raycasting**: Only checks hotspots when controller trigger pressed
4. **Reference Space**: Uses 'local-floor' for natural movement

## 🐛 Known Limitations

1. **No Multi-hand Tracking**: Single controller interaction
2. **No Gaze Interaction**: Requires trigger pull (not gaze-based)
3. **No Audio in VR**: Background audio paused during VR
4. **Fixed POV**: Camera always at origin (0,0,0)

## 🔐 Security Considerations

- WebXR requires HTTPS in production
- VR session requires user gesture (button click)
- No tracking data sent to server during VR session
- Controllers handled client-side only

## 📈 Future Enhancements

- [ ] Hand tracking (using hand presence)
- [ ] Gaze-based hotspot selection
- [ ] Scene transition animations
- [ ] Controller haptic feedback
- [ ] Audio playback in VR
- [ ] Recording VR view/interaction data
- [ ] Multi-scene teleportation with animation
- [ ] Hotspot text labels in VR

## 🧪 Testing

### Desktop Testing (Emulation)
```bash
# Chrome DevTools → More tools → WebXR API Emulation
# Allows testing without VR headset
```

### Quest Testing
```bash
# 1. Enable Developer Mode on Quest
# 2. Connect via USB
# 3. npm run dev
# 4. Visit http://<ip>:3000 on Quest browser
# 5. Click VR button to enter immersive mode
```

### Console Debugging
All WebXR events logged with prefix `[WebXR]`:
- Session start/end
- Hotspot interactions
- Input handling errors
- Scene loads

## 📚 References

- [WebXR Device API Spec](https://immersive-web.github.io/webxr/)
- [Three.js WebXR Docs](https://threejs.org/docs/index.html#manual/en/introduction/WebXR)
- [MDN WebXR Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API)

## 🤝 Contributing

To improve WebXR support:

1. Test on actual VR devices
2. Report issues with specific headsets
3. Suggest controller interaction improvements
4. Contribute hand tracking or eye tracking features
