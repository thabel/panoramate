# Analyse Détaillée: Systèmes de Coordonnées Marzipano vs Three.js

## 🎯 Question de l'Utilisateur
"Est-ce que la transformation qu'on fait prend en considération la géométrie de Marzipano?"

**Observation clé:**
- Direction (yaw) = OK ✓
- Hauteur (Y) = MAUVAISE ✗
- Axe X (abscisse) = MAUVAISE ✗
- Angle (rotation) = OK ✓

Cela suggère que c'est un problème dans la conversion Y/X spécifiquement.

---

## 1. Comment Marzipano Stocke les Hotspots

### Marzipano `screenToCoordinates()` - La Source de Vérité

```typescript
// MarzipanoViewer.tsx:454
const coords = view.screenToCoordinates({ x, y });
// Retourne: { yaw: number, pitch: number }
```

**Ce que ça fait réellement:**
```
Écran (pixels) → Géométrie Marzipano → yaw/pitch absolus
     ↓
Marzipano utilise sa géométrie EquirectGeometry interne
```

### Marzipano EquirectGeometry
```javascript
// Interne à Marzipano
const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);
```

**C'est quoi EquirectGeometry?**
- Texture équirectangulaire (360° panorama)
- Pas une sphère en 3D comme Three.js
- C'est une **projection 2D → sphérique**
- **L'axe Y dans Marzipano = vertical (pitch)**
- **L'axe X dans Marzipano = horizontal (yaw)**

---

## 2. Comment Three.js Place les Hotspots

### Conversion Sphérique (Actuelle)
```typescript
// WebXRViewer.tsx:358-366
const phi = (Math.PI / 2) - hotspot.pitch;     // Latitude
const theta = -hotspot.yaw;                     // Longitude (inversé)
const x = radius * Math.sin(phi) * Math.cos(theta);
const y = radius * Math.cos(phi);
const z = radius * Math.sin(phi) * Math.sin(theta);
```

**Ce que ça fait:**
```
yaw/pitch → Formule sphérique → Positions 3D sur sphère
```

---

## 3. LA DIFFÉRENCE CRITIQUE

### Marzipano: Coordonnées de CAMÉRA (View-Relative)

```
Quand tu places un hotspot en Marzipano:
1. Tu cliques sur l'écran (pixels)
2. Marzipano dit: "Tu regardes à yaw=45°, pitch=0°, donc ce pixel = yaw=45°, pitch=20°"
3. Les hotspots sont RELATIFS à la caméra Marzipano

Marzipano utilise:
- Yaw: -π à +π (gauche à droite)
- Pitch: -π/2 à +π/2 (haut en bas)
```

### Three.js: Coordonnées ABSOLUES (Sphère-Relative)

```
Ma conversion convertit:
1. Yaw/Pitch → X/Y/Z sur la sphère
2. Mais je fais la conversion sphérique STANDARD

La formule standard:
x = r * sin(φ) * cos(θ)
y = r * cos(φ)          ← C'EST ICI LE PROBLÈME !
z = r * sin(φ) * sin(θ)
```

---

## 4. ANALYSE: Pourquoi Y et X sont Mauvais

### Problème 1: Axe Y (Hauteur)

**Marzipano:**
- Pitch vient directement de `screenToCoordinates()`
- C'est un angle d'orientation de CAMÉRA
- Pitch=0 = regarder horizontal
- Pitch=π/2 = regarder vers le bas
- Pitch=-π/2 = regarder vers le haut

**Three.js (Actuellement):**
```typescript
const phi = (Math.PI / 2) - hotspot.pitch;  // ← Inversion !
const y = radius * Math.cos(phi);           // ← Formule sphérique
```

**Le problème:**
- Je suppose que pitch de Marzipano est une latitude sphérique
- MAIS Marzipano utilise pitch comme angle de VUE/caméra
- Ce sont presque pareils SAUF pour les valeurs extrêmes

### Problème 2: Axe X (Abscisse)

**Marzipano:**
- Yaw = angle horizontal absolu
- Yaw=0 = regarder "forward"
- Yaw=π/2 = regarder à droite
- Yaw=-π/2 = regarder à gauche

**Three.js (Actuellement):**
```typescript
const theta = -hotspot.yaw;  // ← J'ai inversé ici
const x = radius * Math.sin(phi) * Math.cos(theta);
```

**Le problème:**
- J'ai inversé le yaw MAIS peut-être pas correctement
- Car j'ai fait: `theta = -yaw`
- Mais Marzipano peut utiliser une convention différente pour l'axe X

---

## 5. La Vraie Géométrie de Marzipano

### EquirectGeometry de Marzipano vs SphereGeometry de Three.js

**Marzipano:**
```
Image équirectangulaire (2D)
         |
         ↓ (projection)
    Sphère imaginaire (pas explicitée)
         |
         ↓ (screenToCoordinates)
    Yaw/Pitch (angles absolus)
```

**Three.js:**
```
Sphère 3D explicite (radius=500, inversée sur X)
         |
         ↓ (conversion sphérique)
    X/Y/Z (positions 3D)
```

### Différence Clé: Convention des Axes

**Marzipano (standard 360° photography):**
```
+Y = UP (pitch positif = regarder vers le haut)
+X = RIGHT (yaw positif = tourner à droite)
+Z = FORWARD
```

**Three.js SphereGeometry (standard 3D):**
```
+Y = UP
+X = RIGHT
+Z = FORWARD
```

**Attendez... c'est le même !**

Sauf que:
- La sphère Three.js est INVERSÉE: `geometry.scale(-1, 1, 1)`
- Cela inverse l'axe X
- Donc: `+X physical` = `-X logique`

---

## 6. LA SOLUTION: Conversion Correcte

### Hypothèse: Marzipano utilise les mêmes angles que Three.js

```typescript
// AVANT (INCORRECTE):
const phi = (Math.PI / 2) - hotspot.pitch;
const theta = -hotspot.yaw;

// APRÈS (À TESTER):
// Option A: Pas d'inversion du tout
const phi = (Math.PI / 2) - hotspot.pitch;
const theta = hotspot.yaw;

// Option B: Inversion complète (pour sphère inversée)
const phi = (Math.PI / 2) - hotspot.pitch;
const theta = hotspot.yaw + Math.PI;

// Option C: Angles de pitch différents
const phi = hotspot.pitch;  // Pas d'inversion
const theta = -hotspot.yaw;
```

---

## 7. Pourquoi direction (yaw) fonctionne mais pas hauteur

**Si:**
- Direction fonctionne = yaw correct (en partie)
- Hauteur ne fonctionne pas = pitch incorrect
- Angle OK = rotation correcte

**Cela suggère:**
- Le problème est spécifiquement dans le calcul de `phi` (latitude)
- Peut-être: `phi = (Math.PI / 2) - pitch` n'est pas la bonne formule

**Marzipano convention:**
- pitch = 0 = horizontal
- pitch = π/2 = bas
- pitch = -π/2 = haut

**Three.js sphérique convention:**
- φ (phi) = 0 = haut (pôle nord)
- φ = π/2 = équateur
- φ = π = bas (pôle sud)

**La conversion CORRECTE devrait être:**
```typescript
const phi = (Math.PI / 2) - hotspot.pitch;  // ✓ Correct !
```

Mais attendez, c'est déjà ce qu'on fait...

---

## 8. Ce qu'il Faut Faire

### Test Concret: Prendre un Hotspot Spécifique

**Example:**
- Hotspot stocké: `yaw=0, pitch=0` (regarder horizontal devant)
- Où devrait-il être sur la sphère? **Au centre devant la caméra (Z=500)**
- Ma formule donne quoi?

```typescript
phi = (π/2) - 0 = π/2
theta = -(0) = 0

x = 380 * sin(π/2) * cos(0) = 380 * 1 * 1 = 380 ✓
y = 380 * cos(π/2) = 380 * 0 = 0 ✓
z = 380 * sin(π/2) * sin(0) = 380 * 1 * 0 = 0 ✗ (devrait être 380)
```

**TROUVÉ LE BUG !**
- Z est 0, mais il devrait être ~380
- C'est parce que je fais le calcul YAW incorrectement

---

## 9. Le Vrai Problème: Convention de Marzipano

Marzipano utilise peut-être:
```
yaw = angle horizontal (comme longitude)
pitch = angle vertical (comme latitude)
```

Mais ma formule sphérique les traite différemment.

**À vérifier: Comment place Marzipano exactement un hotspot?**

```typescript
// Dans MarzipanoViewer.tsx
const marzipanoHotspot = scene.hotspotContainer().createHotspot(element, {
  yaw: hotspot.yaw,
  pitch: hotspot.pitch,
});
```

Marzipano reçoit directement `yaw, pitch` et les applique à la vue.

---

## CONCLUSION

**La transformation actuelle:**
```typescript
const phi = (Math.PI / 2) - hotspot.pitch;
const theta = -hotspot.yaw;
const x = radius * Math.sin(phi) * Math.cos(theta);
const y = radius * Math.cos(phi);
const z = radius * Math.sin(phi) * Math.sin(theta);
```

**Peut ne pas correspondre à la géométrie réelle de Marzipano car:**

1. Marzipano utilise `EquirectGeometry` (projection équirectangulaire)
2. Je suppose une sphère 3D standard
3. L'inversion X (`geometry.scale(-1, 1, 1)`) complique les choses
4. Peut-être que `theta = -yaw` est incomplet

**À faire:**
1. Logger les valeurs yaw/pitch dans Marzipano
2. Comparer avec la position réelle du hotspot
3. Tester différentes formules (theta = yaw vs theta = -yaw vs theta = yaw + π)
4. Ou trouver comment Marzipano calcule réellement ses coordonnées
