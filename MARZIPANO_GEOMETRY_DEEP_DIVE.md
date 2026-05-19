# Deep Dive: Marzipano Geometry vs Three.js WebXR

## ⚠️ Le Vrai Problème: C'est Pas Juste la Formule

### Observation Clé de l'Utilisateur:
- **Direction (Yaw) = OK** ✓ (angles corrects)
- **Hauteur (Y) = MAUVAISE** ✗ (positions incorrectes)
- **Axe X (Abscisse) = MAUVAISE** ✗
- **Rotation = OK** ✓

**Cela signifie:** Ce n'est PAS un problème de formule sphérique générale. C'est un problème spécifique dans la conversion des axes.

---

## 1. Comment Marzipano Fonctionne Réellement

### Marzipano EquirectGeometry

```javascript
// Interne à Marzipano
const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);
```

**Ce que c'est:**
- Une projection **équirectangulaire** (360° photo standard)
- Pas une sphère 3D explicite
- C'est une **texture 2D** qui représente une sphère

**Comment Marzipano l'utilise:**

```
1. Ton image panoramique 360° (plate, équirectangulaire)
   ↓
2. Marzipano la "enveloppe" sur une sphère imaginaire (interne)
   ↓
3. La caméra regarde DEPUIS le centre de cette sphère
   ↓
4. Quand tu cliques → pixel 2D est projeté en yaw/pitch
   ↓
5. Yaw/Pitch sont les coordonnées ABSOLUES de cette sphère
```

### La Sphère Implicite de Marzipano

Marzipano utilise une sphère **unitaire implicite** (rayon = 1, mathématiquement).

**Convention de Marzipano:**
```
Rayon: 1.0 (implicite)
Yaw: -π à +π (horizontal, angle absolu)
Pitch: -π/2 à +π/2 (vertical, angle absolu)

Projection sur sphère:
x_sph = sin(pitch) * cos(yaw)
y_sph = cos(pitch)
z_sph = sin(pitch) * sin(yaw)
```

**Attention:** C'est la projection standard pour équirectangulaire.

---

## 2. Comment Three.js WebXR Fonctionne

### Three.js SphereGeometry

```typescript
const geometry = new THREE.SphereGeometry(500, 64, 32);
geometry.scale(-1, 1, 1);  // ← INVERSION SUR X !
```

**Ce que c'est:**
- Une vraie sphère 3D
- Rayon = 500
- Inversée sur l'axe X (pour avoir la texture à l'intérieur)

**Convention de Three.js:**
```
Rayon: 500 (explicite)
Axes: X (droite), Y (haut), Z (avant) - standard 3D

Mais INVERSÉE sur X:
- Quand on ajoute scale(-1, 1, 1), l'axe X est réfléchi
- À droite physique (+X) devient -X logique
```

---

## 3. LA CONVERSION PROBLÉMATIQUE

### Ce Que Je Fais Actuellement

```typescript
const phi = (Math.PI / 2) - hotspot.pitch;
const theta = -hotspot.yaw;
const x = 500 * Math.sin(phi) * Math.cos(theta);
const y = 500 * Math.cos(phi);
const z = 500 * Math.sin(phi) * Math.sin(theta);
```

### Ce Qui Est Faux

1. **Je mélange deux conventions:**
   - Marzipano: sphère mathématique unitaire
   - Three.js: sphère 3D physique (rayon 500)

2. **Je n'applique pas l'inversion X correctement:**
   - Je fais `theta = -yaw` (inversion simple)
   - Mais la sphère est inversée avec `scale(-1, 1, 1)`, ce qui change la géométrie

3. **Les axes ne correspondent pas:**
   ```
   Marzipano:          Three.js Physique:     Three.js Logique (inversé):
   +Y = up             +Y = up                +Y = up
   +X = right          +X = right (mais inversé!) +X = left (!)
   +Z = forward        +Z = forward           +Z = forward
   ```

---

## 4. LA VRAIE CONVERSION

### Option A: Conversion Directe (Plus Simple)

**Si Marzipano utilise la sphère standard équirectangulaire:**

```typescript
// Marzipano → Sphère mathématique
// Mais sphère Three.js est INVERSÉE

// Formule correcte pour sphère inversée:
const phi = (Math.PI / 2) - hotspot.pitch;  // ← Correct
const theta = hotspot.yaw + Math.PI;        // ← AJOUTER π pour inversion X!

const radius = 500;
const x = radius * Math.sin(phi) * Math.cos(theta);
const y = radius * Math.cos(phi);
const z = radius * Math.sin(phi) * Math.sin(theta);
```

**Pourquoi `theta = yaw + π`?**
- Quand la sphère est inversée sur X (`scale(-1, 1, 1)`)
- Pour avoir le même point, il faut ajouter π à la longitude
- C'est l'équivalent mathématique de la réflexion

### Option B: Enlever l'Inversion (Plus Propre)

**Plutôt que d'ajouter une correction mathématique complexe:**

```typescript
// Dans loadPanorama():
const geometry = new THREE.SphereGeometry(500, 64, 32);
// ❌ geometry.scale(-1, 1, 1);  // NE PAS inverser

// À la place, inverser la texture UV:
const material = new THREE.MeshBasicMaterial({
  map: texture,
  side: THREE.BackSide  // ← Voir de l'intérieur SANS inverser
});

// Puis conversion simple:
const phi = (Math.PI / 2) - hotspot.pitch;
const theta = hotspot.yaw;  // ← Sans inversion
const x = radius * Math.sin(phi) * Math.cos(theta);
const y = radius * Math.cos(phi);
const z = radius * Math.sin(phi) * Math.sin(theta);
```

**Avantage:** Pas de math complexe, plus lisible.

---

## 5. Verification: Testez avec Hotspot Spécifique

### Test Concret

**Hotspot Marzipano:** `yaw=0, pitch=0` (regarder horizontal, devant)

**Où devrait-il être?**
- En face de la caméra
- Au centre devant
- Réponse: `(0, 0, 500)` ou `(0, 0, -500)` selon l'orientation

**Avec ma formule actuelle:**
```
phi = π/2 - 0 = π/2
theta = -0 = 0

x = 500 * sin(π/2) * cos(0) = 500 * 1 * 1 = 500
y = 500 * cos(π/2) = 500 * 0 = 0
z = 500 * sin(π/2) * sin(0) = 500 * 1 * 0 = 0
```

**Résultat:** `(500, 0, 0)` = À droite, pas devant!

**Avec formule Option A (`theta = yaw + π`):**
```
phi = π/2
theta = 0 + π = π

x = 500 * sin(π/2) * cos(π) = 500 * 1 * (-1) = -500
y = 0
z = 500 * sin(π/2) * sin(π) = 500 * 1 * 0 = 0
```

**Résultat:** `(-500, 0, 0)` = À gauche, toujours pas devant!

**Hmm, c'est encore faux...**

---

## 6. Le Vrai Problème: Axes Inversés

### Peut-être la Convention est Différente

**Hypothèse:** Marzipano ne suit pas la convention équirectangulaire standard.

**Ou:** Les axes Marzipano sont utilisés différemment.

**À tester:**

```typescript
// Test 1: Pas d'inversion du tout
const phi = hotspot.pitch;
const theta = hotspot.yaw;

// Test 2: Inversion seulement sur theta
const phi = hotspot.pitch;
const theta = -hotspot.yaw;

// Test 3: Phi complètement différent
const phi = (Math.PI / 2) + hotspot.pitch;  // Addition au lieu de soustraction
const theta = -hotspot.yaw;

// Test 4: Axes complètement inversés
const phi = -hotspot.pitch;
const theta = hotspot.yaw + Math.PI;
```

---

## 7. Problème de Taille/Clickability des Hotspots

### Le Vrai Issue

**Actuellement:**
```typescript
const geometry = new THREE.PlaneGeometry(20, 20);  // 20x20 units
const radius = 380;  // Distance de la caméra
```

**Problème:**
- À distance 380, un carré 20x20 est TRÈS petit (angle ~0.03 radians = 1.7°)
- Avec des contrôleurs VR, difficile à viser
- Quand on augmente la distance (radius > 380), ça devient invisible
- Quand on augmente la taille du carré, ça devient énorme et bloque la vue

### La Solution: Billboarding Dynamique

Au lieu d'une taille fixe, faire en sorte que le hotspot **change de taille** selon sa distance:

```typescript
// Faire grandir/shrink basé sur la distance
const hotspotMesh = new THREE.Mesh(geometry, material);
hotspotMesh.position.set(x, y, z);

// Billboarding dynamique
hotspotMesh.lookAt(0, 0, 0);  // ← Déjà fait

// Mais ajouter: scaling dynamique basé sur distance
const distanceFromCamera = Math.sqrt(x*x + y*y + z*z);
const scale = Math.min(1.5, Math.max(0.5, distanceFromCamera / 300));
hotspotMesh.scale.multiplyScalar(scale);
```

### Solution Alternative: Utiliser des Images SVG Plus Grandes

```typescript
// Au lieu de PlaneGeometry(20, 20), utiliser:
const geometry = new THREE.PlaneGeometry(30, 30);  // Un peu plus grand
```

Puis dans `createHotspotGeometry()`:

```typescript
// Augmenter la taille du canvas pour le SVG
const canvas = document.createElement('canvas');
canvas.width = 512;    // au lieu de 256
canvas.height = 512;   // au lieu de 256
```

Cela rend le SVG plus grand SANS changer la géométrie 3D.

---

## 8. Décision Stratégique: Three.js vs Marzipano vs Alternatives

### État Actuel
- Marzipano: Mature, stable, mais inflexible
- Three.js: Flexible, mais complexe pour panoramas
- Alternatives: ?

### Alternatives à Évaluer

| Outil | Cas d'Usage | Avantages | Inconvénients |
|-------|------------|----------|--------------|
| **Marzipano** | Desktop/Mobile panoramas | Simple, stable | Pas de VR native, inflexible |
| **Three.js** | VR + Custom | Très flexible, puissant | Courbe apprentissage, performance |
| **Babylon.js** | VR + Panoramas | Excellent pour panoramas VR | Moins connu, communauté |
| **Cesium.js** | Géospatial/360 | Puissant pour geo | Overkill pour panoramas |
| **A-Frame** | WebXR simple | Super simple | Pas de hotspots complexes |
| **PlayCanvas** | WebGL/Cloud | Engine complet | Pas local, subscription |

### Recommandation

**Approche Pragmatique:**

1. **Anciens projets (Marzipano):**
   - Garder Marzipano tel quel
   - WebXR VR utilise Three.js

2. **Nouveaux projets:**
   - **Option A:** Three.js partout (une seule source de vérité)
   - **Option B:** Babylon.js (meilleur que Three.js pour panoramas)

3. **Pourquoi pas Three.js everywhere?**
   - C'est possible mais demande:
     - Résoudre problème coordonnées (cette conversation)
     - Optimiser raycasting pour 100+ hotspots
     - Implémenter comparison viewer
     - Stabiliser mobile

**Timeline si migration complète Three.js:**
- Semaines 1-2: Résoudre coordonnées
- Semaines 3-4: Optimiser raycasting
- Semaines 5-6: Comparison viewer
- Semaines 7-8: Mobile optimization
- **Total: 8-10 semaines (2 mois)**

### Alternative: Babylon.js

```typescript
// Exemple Babylon.js - plus adapté aux panoramas
const scene = new BABYLON.Scene(engine);
const camera = new BABYLON.UniversalCamera("camera1", new BABYLON.Vector3(0, 0, 0), scene);
camera.attachControl(canvas, true);

// Panorama sphère
const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 1000}, scene);
const material = new BABYLON.StandardMaterial("mat", scene);
material.emissiveTexture = new BABYLON.Texture(textureUrl, scene);
sphere.material = material;

// VR native
const xr = await scene.createDefaultXRExperienceAsync();
```

**Avantage:** Meilleur support natif pour panoramas + VR.

---

## 9. Prochaines Étapes

### Immédiat (Aujourd'hui/Demain)
1. **Tester les 4 formules de conversion** pour trouver la bonne
2. **Logger yaw/pitch de Marzipano** pour chaque hotspot placé
3. **Vérifier la position réelle** dans WebXR et comparer

### Court Terme (Cette Semaine)
1. **Résoudre le problème de coordonnées** une fois pour toutes
2. **Implémenter billboarding dynamique** pour hotspots
3. **Augmenter la taille de l'image SVG** pour meilleure clarté

### Moyen Terme (2-4 Semaines)
1. **Décider:** Three.js everywhere vs Babylon.js
2. **Créer un prototype** avec la meilleure solution
3. **Tester avec vrais utilisateurs**

### Long Terme (Décision Stratégique)
- Garder Marzipano pour anciens projets
- Migrer progressivement vers Three.js ou Babylon.js
- Pas de rewrite complet du jour au lendemain

---

## Conclusion

**Le problème n'est PAS juste une formule** - c'est une différence fondamentale de géométrie:
- Marzipano: Sphère mathématique équirectangulaire
- Three.js: Sphère 3D inversée sur X

**Solution:** Ajouter `π` à `theta` ET tester les 4 variantes pour confirmer.

**Pour les hotspots trop gros:** Utiliser SVG plus grand ou billboarding dynamique.

**Pour la stratégie long terme:** Évaluer Babylon.js comme alternative au Three.js pur.
