# Marzipano Mobile Black Container - Debug Guide

## 📱 Le Problème
- **Symptôme:** Container noir sur mobile, viewer ne fonctionne pas
- **Détail:** Image visible ailleurs, PC fonctionne bien
- **Probable:** Problème spécifique mobile (WebGL, CORS, dimensions, memory)

---

## 🔍 Pistes de Diagnostic

### 1. **HTTPS vs HTTP** ✅ **PREMIÈRE VÉRIFIER**

**HTTPS cause probable de blocage sur mobile**

```
Situation                          | Desktop | Mobile
-----------------------------------|---------|----------
Site HTTPS + Images HTTP           | ⚠️ Mixed | ❌ BLOQUÉ
Site HTTP + Images HTTP            | ✅ OK   | ✅ OK
Site HTTPS + Images HTTPS          | ✅ OK   | ✅ OK
Site HTTP + Images HTTPS (redirect)| ✅ OK   | ✅ OK
```

**Comment vérifier:**
1. Ouvrir mobile DevTools (F12 ou remote debug)
2. Network tab → filter par "uploads"
3. Chercher les erreurs **"Mixed Content" ou "CORS"**

**Fix si problème HTTPS:**
```typescript
// Dans src/components/viewer/MarzipanoViewer.tsx
const imageUrl = `/api/uploads/${sceneData.filename}`;
// Cette URL relative se construit automatiquement en HTTP/HTTPS
// ✅ Déjà correct dans le code
```

---

### 2. **WebGL Non Supporté**

Mobile certain modèles n'ont pas WebGL2, seulement WebGL1 (ou rien)

**Diagnostic dans console mobile:**
```javascript
// Copier/coller dans console
const canvas = document.createElement('canvas');
const gl1 = canvas.getContext('webgl');
const gl2 = canvas.getContext('webgl2');
console.log('WebGL1:', !!gl1 ? '✅' : '❌');
console.log('WebGL2:', !!gl2 ? '✅' : '❌');
```

**Logs visibles:**
- ✅ Si vous voyez `[Marzipano] Canvas info after creation` → WebGL OK
- ❌ Si vous voyez `❌ No WebGL` → **Problème critique**

**Fix si WebGL manquant:**
```typescript
// Marzipano supporte WebGL1 et WebGL2
// Si WebGL manquant = navigateur trop vieux
// Solution: afficher message d'erreur utilisateur
```

---

### 3. **Container Dimensions = 0**

CSS manquant ou `display: none` → canvas vide

**Diagnostic dans DevTools:**
```
Inspect la div container
Vérifier: width, height, display (should be flex, block, not none)
```

**Logs visibles:**
- `[Marzipano] Container dimensions before viewer creation` → vérifier `containerWidth` et `containerHeight`
- ❌ Si `0 x 0` ou `undefined` → **Problème CSS**

**Situation dans votre code (tour page):**
```typescript
// src/app/tour/[shareToken]/page.tsx:163
<div ref={containerRef} className="flex flex-col h-screen min-h-screen overflow-hidden bg-black"
     style={{ height: '100dvh', minHeight: '100dvh' }}>
```

✅ Container DEVRAIT avoir dimensions (fullscreen).
- Si noir quand même → voir Canvas rendering issue

---

### 4. **Image Pas Chargée** (CORS / 404)

**Diagnostic dans console:**
- Logs: `[Marzipano] ❌ Image failed to load`
- Network tab: Status 403, 404, ou "No data"

**Causes possibles:**
1. Chemin image incorrect
2. Permissions d'accès manquantes
3. CORS non configuré sur API
4. Image supprimée du serveur

**Check le fichier:**
```bash
# SSH sur serveur
ls -la uploads/[organization_id]/[tour_id]/
```

**Check API access:**
```bash
# Test depuis terminal
curl -I https://yourdomain.com/api/uploads/image.jpg
# Devrait retourner 200, pas 403/404
```

---

### 5. **Marzipano Library Pas Chargée**

Marzipano vient du CDN (global tag), peut être bloqué sur mobile

**Diagnostic:**
```javascript
// Console mobile
window.Marzipano ? console.log('✅ Chargé') : console.log('❌ Manquant')
```

**Logs visibles:**
- `[Marzipano] Marzipano library not available` → **CDN timeout ou bloqué**

**Où charger Marzipano?**
```typescript
// src/app/layout.tsx - Root layout (vérifié là?)
<script src="https://cdn.marzipano.net/releases/marzipano-0.2.7.min.js"></script>
```

**Check dans page source:**
- View source (Ctrl+U) sur mobile
- Chercher `marzipano` dans le head

---

### 6. **Image Dimensions Anormales**

Équirectangular requires aspect ratio ~2:1. Si dimensions bizarre → rotation cassée

**Logs à vérifier:**
```
[Marzipano] ✅ Image loaded successfully
  "imageWidth": 4000,
  "imageHeight": 2000,  // Devrait être ≈ 2:1
  "aspectRatio": 2      // ✅ OK
```

**Si aspect ratio bizarre (ex: 1:1):**
- Image pas vraiment équirectangular
- Marzipano peut afficher noir

---

### 7. **Memory Overflow (Devices <2GB RAM)**

Panorama 4000x2000px = ≈ 30MB texture. Mobile bas de gamme peut crash

**Logs à vérifier:**
```
[Marzipano] Mobile check
  "memory": 2,  // Faible!
  "issues": ["⚠️ Low device memory"]
```

**Fix:** Réduire la taille de l'image
```typescript
// Dans Marzipano: width: 4000 peut être réduit
geometry = new Marzipano.EquirectGeometry([{ width: 2000 }]); // Plus petit
```

---

### 8. **Slow Network / Timeout**

Connection 3G/2G → image timeout avant chargement

**Logs à vérifier:**
```
[Marzipano] ✅ Image loaded
  "timing": "15234ms"  // Si >30s = timeout risque
```

---

## 📊 Checklist d'Investigation

Quand vous testez sur mobile:

```
□ Ouvrir DevTools (F12)
□ Console tab → chercher tous les [Marzipano] logs
□ Network tab → vérifier status des images (200 OK?)
□ Chercher erreurs CORS ou "Mixed Content"
□ Vérifier WebGL support (voir code au dessus)
□ Vérifier container dimensions (inspect element)
□ Check HTTPS vs HTTP mismatch
□ Recharger page (hard refresh)
```

---

## 🛠️ Logs Disponibles (avec changes)

Les logs suivants sont ajoutés:

### MarzipanoViewer.tsx:
```
[Marzipano] Device Debug Info       → screenSize, userAgent, memory, connection
[Marzipano] Container dimensions    → width, height du container
[Marzipano] ✅ Viewer instance created
[Marzipano] ✅ Image loaded successfully / ❌ Image failed to load
[Marzipano] Canvas info after creation → dimensions, WebGL support
[Marzipano] ✅ Switching to initial scene / ❌ Scene not found
```

### Tour page:
```
[Tour] Running health check on first image
[Tour] Health check result → protocol, WebGL, mobile info, image load status
```

### Health Check Function (marzipano-debug.ts):
```javascript
// Appel manual:
import { marzipanoDebug } from '@/lib/marzipano-debug';
await marzipanoDebug.runHealthCheck('/api/uploads/image.jpg');

// Ou vérifier individuellement:
marzipanoDebug.checkProtocol();     // HTTPS/HTTP
marzipanoDebug.checkWebGL();        // WebGL support
marzipanoDebug.checkMobileIssues(); // Memory, connection
```

---

## 🚀 Solutions Rapides à Essayer

### 1. Cache Clear
```bash
# Mobile: Settings → Storage → Clear Cache
# Desktop: Ctrl+Shift+Del → Clear Everything
```

### 2. Hard Reload
```
Mobile: Reload button (long press) → Hard Refresh
Desktop: Ctrl+Shift+R
```

### 3. Disable Autorotate (test)
- Page top right → RotateCw button (toggle off)
- Si noir → problem avant autorotate start

### 4. Test Different Image
- Try uploading smaller image (2000x1000px)
- Test if problem is image-specific

### 5. Test Different Device
- Try different phone model
- Try mobile browser (Chrome vs Safari vs Firefox)

---

## 📝 Commandes Utiles

**Mobile DevTools via USB (Android):**
```bash
# Chrome remote debugging
# 1. Connect phone with USB
# 2. Enable USB debugging on phone
# 3. Open chrome://inspect in desktop Chrome
# 4. Select device → inspect
```

**Check logs via logger:**
```typescript
// src/lib/logger.ts uses Pino
// Browser logs visible in DevTools console
// Server logs visible in:
// - npm run dev output
// - Docker logs: docker logs <container_id>
```

---

## 🎯 Prochaines Étapes

1. **Test d'abord sur mobile real device** (pas juste emulator)
2. **Ouvrir console DevTools** et regarder les logs `[Marzipano]`
3. **Envoyer le output de la console** si vous besoin d'aide
4. **Essayer les solutions rapides** ci-dessus

---

## ⚠️ Questions Importantes

- **HTTPS ou HTTP?** Site + images dans le même protocole?
- **Quelle version mobile?** Android 6+? iOS 12+?
- **Connexion?** WiFi ou mobile data? 4G?
- **Autre app Marzipano?** Voir si d'autres panoramas fonctionnent?

---

## 📖 Ressources

- [Marzipano Docs](https://www.marzipano.net)
- [WebGL Support Checker](https://webglreport.com)
- [CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [DevTools Remote Debugging](https://developer.chrome.com/docs/devtools/remote-debugging/)
