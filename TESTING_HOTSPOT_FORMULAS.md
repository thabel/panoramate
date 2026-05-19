# 🧪 Testing Hotspot Coordinate Formulas

## Branch
`feat/test-hotspot-coordinates`

## What's Changed

### 1. ✅ SVG Canvas Size Increased
- **File:** `src/lib/webxr-hotspot-texture.ts`
- **Change:** Canvas size increased from 256×256 to 512×512
- **Result:** Hotspot icons are now clearer and more visible in VR

### 2. ✅ 4 Testable Coordinate Formulas
- **File:** `src/components/viewer/WebXRViewer.tsx`
- **Configuration:** Line 21
- **Variable:** `FORMULA_TEST`

**Available formulas:**
```typescript
const FORMULA_TEST = 'ORIGINAL' as const;
//    ↓ Change to one of:
// 'ORIGINAL'  - Current implementation (theta = -yaw)
// 'FORMULA_A' - theta = yaw + π
// 'FORMULA_B' - theta = yaw
// 'FORMULA_C' - phi = (π/2) + pitch
```

### 3. ✅ Color Coding
Each formula displays hotspots with a distinct color for easy identification:

| Formula | Color | Hex | Visual |
|---------|-------|-----|--------|
| ORIGINAL | Yellow | #FFFF00 | 🟡 |
| FORMULA_A | Red | #FF0000 | 🔴 |
| FORMULA_B | Green | #00FF00 | 🟢 |
| FORMULA_C | Blue | #0000FF | 🔵 |

### 4. ✅ Detailed Logging
Browser console shows detailed coordinates:
```
[WebXR] Hotspot position - TEST MODE:
{
  hotspotId: "abc123",
  formula: "ORIGINAL",
  input: { yaw: "0.5235", pitch: "0.0000" },
  output: { x: "190.23", y: "380.00", z: "-9.34" },
  angles: { phi: "1.5708", theta: "-0.5235" },
  color: "#FFFF00"
}
```

---

## 🧪 How to Test

### Step 1: Test Each Formula

Open `src/components/viewer/WebXRViewer.tsx` line 21:

```typescript
const FORMULA_TEST = 'ORIGINAL' as const;
```

For each test:
1. Change to new formula (e.g., 'FORMULA_A')
2. Save file (dev server will hot-reload)
3. Enter VR mode
4. Observe hotspot positions and colors

### Step 2: Visual Inspection

For each formula, check:
- ✅ Do hotspots appear in the right location?
- ✅ Are they in front (not to the side or behind)?
- ✅ Are they at the right height (up/down)?
- ✅ Does the color match the formula?

### Step 3: Compare with Marzipano

**Critical test:**
1. Place a hotspot in **Marzipano viewer** (desktop)
2. Switch to **WebXR viewer** (VR mode)
3. See if it appears in the **same location** with current formula
4. If not, try different formulas

### Step 4: Console Logging

Open browser DevTools (F12):

```
Console → Filter: "[WebXR] Hotspot position"
```

Compare logged coordinates between formulas:
```
ORIGINAL:  yaw=0.5, pitch=0 → x=190, y=380, z=-9
FORMULA_A: yaw=0.5, pitch=0 → x=????, y=????, z=????
FORMULA_B: yaw=0.5, pitch=0 → x=????, y=????, z=????
FORMULA_C: yaw=0.5, pitch=0 → x=????, y=????, z=????
```

One should match the Marzipano position exactly!

---

## 📊 Testing Checklist

```
[ ] ORIGINAL (Yellow #FFFF00)
    [ ] Visual check - hotspot position
    [ ] Console logging visible

[ ] FORMULA_A (Red #FF0000)
    [ ] Visual check - hotspot position
    [ ] Console logging visible

[ ] FORMULA_B (Green #00FF00)
    [ ] Visual check - hotspot position
    [ ] Console logging visible

[ ] FORMULA_C (Blue #0000FF)
    [ ] Visual check - hotspot position
    [ ] Console logging visible

[ ] Comparison with Marzipano
    [ ] Found the formula that matches
    [ ] Documented which one works
```

---

## 🎯 Expected Results

One of these formulas **MUST** place hotspots in the same location as Marzipano:

### If FORMULA_A Works:
- Hotspots now appear in correct Marzipano positions
- Solution: Change line 359 in WebXRViewer.tsx to `theta = hotspot.yaw + Math.PI`
- **Fix cost:** 5 minutes

### If FORMULA_B Works:
- Hotspots appear mirrored but at correct height
- Solution: Remove the negation from yaw
- **Fix cost:** 5 minutes

### If FORMULA_C Works:
- Hotspots appear at different heights
- Solution: Change phi calculation
- **Fix cost:** 5 minutes

### If None Work:
- Need deeper investigation of Marzipano's actual math
- Could be a different convention entirely
- **Next step:** Debug Marzipano's `screenToCoordinates()` output

---

## 🔧 Reverting to Normal

When done testing, revert to main branch:

```bash
git checkout feat/improve_addhotspot
```

Or simply change back to ORIGINAL:
```typescript
const FORMULA_TEST = 'ORIGINAL' as const;
```

---

## 📝 Notes

- **Code is fully reversible** - no permanent changes to production code
- **No data is modified** - purely visual testing
- **No performance impact** - just position calculations
- **Easy to switch** - change one line and reload

---

## 🚀 What Happens After Testing

### If One Formula Works:
1. Confirm it's consistently correct
2. Merge that formula into main branch
3. Update `feat/fix-webxr-hotspot-interaction` with fix
4. Delete test branch

### If None Work:
1. Document findings
2. Investigate Marzipano's actual coordinate system
3. Possibly need to log Marzipano's internal values
4. Iterate with new hypotheses

---

## 💡 Pro Tips

### Tip 1: Test with Multiple Hotspots
Create hotspots at:
- Center (yaw=0, pitch=0)
- Right (yaw=π/2, pitch=0)
- Left (yaw=-π/2, pitch=0)
- Top (yaw=0, pitch=-π/4)
- Bottom (yaw=0, pitch=π/4)

### Tip 2: Use Browser DevTools
```javascript
// In console, run:
console.log('Testing formula positioning');
```

Filter logs to see only relevant ones.

### Tip 3: Take Screenshots
- For each formula, take a VR screenshot
- Compare side-by-side
- Document which one looks correct

---

## ❓ Questions During Testing?

Check:
- `MARZIPANO_GEOMETRY_DEEP_DIVE.md` - Technical explanation
- `COORDINATE_SYSTEM_ANALYSIS.md` - How coordinates work
- `MARZIPANO_MIGRATION_ANALYSIS.md` - Full migration context

---

## Summary

**Goal:** Find which formula makes WebXR hotspots appear at the **exact same location** as Marzipano.

**Method:** Switch between 4 formulas using color coding.

**Time:** ~30 minutes for all tests.

**Payoff:** Solves the coordinate alignment issue forever.

Good luck! 🚀
