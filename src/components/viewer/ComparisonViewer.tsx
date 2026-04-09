'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { ZoomIn, ZoomOut, RotateCcw, GripVertical } from 'lucide-react';

declare global {
  interface Window {
    Marzipano: any;
  }
}

interface ComparisonImage {
  id: string;
  filename: string;
  originalName: string;
  captureDate: string;
  width: number;
  height: number;
}

interface ComparisonViewerProps {
  image1: ComparisonImage;
  image2: ComparisonImage;
}

export default function ComparisonViewer({ image1, image2 }: ComparisonViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  
  const leftLayerRef = useRef<any>(null);
  const rightLayerRef = useRef<any>(null);
  const viewLeftRef = useRef<any>(null);
  const viewRightRef = useRef<any>(null);
  const isSyncingRef = useRef(false);
  const isDraggingDividerRef = useRef(false);

  const [dividerPct, setDividerPct] = useState(50);
  const dividerPctRef = useRef(50);

  const [syncViews, setSyncViews] = useState(true);
  const syncViewsRef = useRef(true);

  const [isReady, setIsReady] = useState(false);

  // Keep refs in sync with state
  useEffect(() => { syncViewsRef.current = syncViews; }, [syncViews]);
  useEffect(() => { dividerPctRef.current = dividerPct; }, [dividerPct]);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const updateLayerRects = useCallback((pct: number) => {
    const ratio = pct / 100;
    leftLayerRef.current?.setEffects({
      rect: { relativeX: 0, relativeY: 0, relativeWidth: ratio, relativeHeight: 1 },
    });
    rightLayerRef.current?.setEffects({
      rect: { relativeX: ratio, relativeY: 0, relativeWidth: 1 - ratio, relativeHeight: 1 },
    });
  }, []);

  // ─── Viewer init ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current) return;

    let retryInterval: NodeJS.Timeout;

    const initViewer = (): boolean => {
      const Marzipano = window.Marzipano;
      console.log('Initializing Marzipano viewer with images:', image1, image2);
      if (!Marzipano) {
        console.warn('Marzipano library not found, retrying...');
        return false;

      }


      try {
        if (viewerRef.current) {
          viewerRef.current.destroy();
          viewerRef.current = null;
        }

        const viewer = new Marzipano.Viewer(containerRef.current, {
          controls: { mouseViewMode: 'drag' },
        });
        viewerRef.current = viewer;

        console.log('--- DEBUG: Initializing Marzipano viewer v3 ---');
        console.log('Source URL 1:', `/api/uploads/${image1.filename}`);
        console.log('Source URL 2:', `/api/uploads/${image2.filename}`);

        // Use fromString as it's more robust and matches MarzipanoViewer
        const srcLeft = Marzipano.ImageUrlSource.fromString(`/api/uploads/${image1.filename}`);
        const srcRight = Marzipano.ImageUrlSource.fromString(`/api/uploads/${image2.filename}`);

        // Geometry and limiter
        const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);
        const limiter = Marzipano.RectilinearView.limit.traditional(
          1024,
          (120 * Math.PI) / 180,
          (120 * Math.PI) / 180
        );
        const defaultParams = { yaw: 0, pitch: 0, fov: (90 * Math.PI) / 180 };

        const viewLeft = new Marzipano.RectilinearView({ ...defaultParams }, limiter);
        const viewRight = new Marzipano.RectilinearView({ ...defaultParams }, limiter);
        viewLeftRef.current = viewLeft;
        viewRightRef.current = viewRight;

        // Create both scenes using the high-level API
        const sceneLeft = viewer.createScene({
          source: srcLeft,
          geometry: geometry,
          view: viewLeft,
          pinFirstLevel: true
        });

        const sceneRight = viewer.createScene({
          source: srcRight,
          geometry: geometry,
          view: viewRight,
          pinFirstLevel: true
        });

        // Switch to left scene - this clears the stage and adds sceneLeft.layer()
        sceneLeft.switchTo();

        // Add back the right scene's layer to the stage for the comparison
        const stage = viewer.stage();
        stage.addLayer(sceneRight.layer());

        const leftLayer = sceneLeft.layer();
        const rightLayer = sceneRight.layer();
        leftLayerRef.current = leftLayer;
        rightLayerRef.current = rightLayer;

        console.log('--- DEBUG: Layers added to stage ---');

        // Apply initial clipping effects
        const ratio = dividerPctRef.current / 100;
        leftLayer.setEffects({
          rect: { relativeX: 0, relativeY: 0, relativeWidth: ratio, relativeHeight: 1 },
        });
        rightLayer.setEffects({
          rect: { relativeX: ratio, relativeY: 0, relativeWidth: 1 - ratio, relativeHeight: 1 },
        });

        // ── View synchronisation (same pattern as the official demo) ───────────
        viewLeft.addEventListener('change', () => {
          if (isSyncingRef.current || !syncViewsRef.current) return;
          isSyncingRef.current = true;
          viewRight.setParameters(viewLeft.parameters());
          isSyncingRef.current = false;
        });

        viewRight.addEventListener('change', () => {
          if (isSyncingRef.current || !syncViewsRef.current) return;
          isSyncingRef.current = true;
          viewLeft.setParameters(viewRight.parameters());
          isSyncingRef.current = false;
        });

        setIsReady(true);
        return true;
      } catch (err) {
        console.error('[ComparisonViewer] init error:', err);
        return false;
      }
    };

    if (!initViewer()) {
      retryInterval = setInterval(() => {
        if (initViewer()) clearInterval(retryInterval);
      }, 500);
    }

    return () => {
      if (retryInterval) clearInterval(retryInterval);
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
      leftLayerRef.current = null;
      rightLayerRef.current = null;
      viewLeftRef.current = null;
      viewRightRef.current = null;
      setIsReady(false);
    };
  }, [image1.id, image2.id]); // Re-init only if images change

  // ─── Divider drag ────────────────────────────────────────────────────────────

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingDividerRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const pct = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
      dividerPctRef.current = pct;
      setDividerPct(pct);
      updateLayerRects(pct);
    };

    const onUp = () => { isDraggingDividerRef.current = false; };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [updateLayerRects]);

  // ─── Controls ────────────────────────────────────────────────────────────────

  const handleZoom = (dir: 'in' | 'out') => {
    const view = viewLeftRef.current;
    if (!view) return;
    const { yaw, pitch, fov } = view.parameters();
    const newFov = dir === 'in'
      ? Math.max(0.3, fov - 0.15)
      : Math.min(2.2, fov + 0.15);
    [viewLeftRef.current, viewRightRef.current].forEach(v => {
      v?.setParameters({ yaw, pitch, fov: newFov });
    });
  };

  const handleReset = () => {
    const defaultParams = { yaw: 0, pitch: 0, fov: (90 * Math.PI) / 180 };
    [viewLeftRef.current, viewRightRef.current].forEach(v => v?.setParameters(defaultParams));
    setDividerPct(50);
    dividerPctRef.current = 50;
    updateLayerRects(50);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col w-full h-full gap-3">

      {/* ── Viewer ── */}
      <div className="relative flex-1 min-h-0 overflow-hidden bg-black border rounded-2xl border-dark-700">

        {/* Marzipano mount — same pattern as MarzipanoViewer */}
        <div ref={containerRef} className="w-full h-full" />

        {/* Loading overlay */}
        {!isReady && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-dark-950">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 rounded-full border-primary-500 border-t-transparent animate-spin" />
              <p className="text-sm text-dark-400">Loading viewer…</p>
            </div>
          </div>
        )}

        {/* ── Divider ── */}
        <div
          className="absolute inset-y-0 z-20 flex items-center"
          style={{ left: `${dividerPct}%`, transform: 'translateX(-50%)' }}
        >
          {/* Line */}
          <div className="w-px h-full bg-white/60 shadow-[0_0_6px_rgba(255,255,255,0.5)]" />

          {/* Drag handle */}
          <button
            className="absolute flex items-center justify-center w-8 h-8 transition-transform -translate-y-1/2 bg-white border-2 rounded-full shadow-lg select-none top-1/2 cursor-col-resize border-dark-800 hover:scale-110"
            onMouseDown={(e) => { e.preventDefault(); isDraggingDividerRef.current = true; }}
            onTouchStart={(e) => { e.preventDefault(); isDraggingDividerRef.current = true; }}
          >
            <GripVertical size={14} className="text-dark-800" />
          </button>
        </div>

        {/* ── Labels ── */}
        <div className="absolute z-10 pointer-events-none top-3 left-3">
          <div className="px-2.5 py-1.5 rounded-lg bg-dark-900/80 backdrop-blur-sm border border-dark-700">
            <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">Before</p>
            <p className="text-xs text-white font-medium truncate max-w-[140px]">{image1.originalName}</p>
            <p className="text-[10px] text-dark-400">{format(new Date(image1.captureDate), 'MMM d, yyyy')}</p>
          </div>
        </div>

        <div className="absolute z-10 text-right pointer-events-none top-3 right-3">
          <div className="px-2.5 py-1.5 rounded-lg bg-dark-900/80 backdrop-blur-sm border border-dark-700">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">After</p>
            <p className="text-xs text-white font-medium truncate max-w-[140px]">{image2.originalName}</p>
            <p className="text-[10px] text-dark-400">{format(new Date(image2.captureDate), 'MMM d, yyyy')}</p>
          </div>
        </div>
      </div>

      {/* ── Controls bar ── */}
      <div className="flex items-center justify-between px-1 shrink-0">
        <div className="flex items-center gap-2">
          {[
            { icon: <ZoomIn size={15} />, action: () => handleZoom('in'), title: 'Zoom in' },
            { icon: <ZoomOut size={15} />, action: () => handleZoom('out'), title: 'Zoom out' },
            { icon: <RotateCcw size={15} />, action: handleReset, title: 'Reset view' },
          ].map(({ icon, action, title }) => (
            <button
              key={title}
              onClick={action}
              title={title}
              className="p-2 transition-colors border rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white border-dark-600"
            >
              {icon}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs cursor-pointer select-none text-dark-400">
            <button
              role="switch"
              aria-checked={syncViews}
              onClick={() => setSyncViews(v => !v)}
              className={`relative w-9 h-5 rounded-full transition-colors border border-dark-600 ${syncViews ? 'bg-primary-600' : 'bg-dark-700'
                }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${syncViews ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
              />
            </button>
            Sync views
          </label>

          <span className="text-[11px] text-dark-500 hidden sm:block">
            Drag divider · pan to explore
          </span>
        </div>
      </div>
    </div>
  );
}