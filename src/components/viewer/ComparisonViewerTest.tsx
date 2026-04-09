'use client';

import { useState, useRef, useEffect } from "react";


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

export default function ComparisonViewerTest({ image1, image2 }: ComparisonViewerProps) {


  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);


  useEffect(() => {
    if (!containerRef.current) return;

    let viewer: any = null;
    let retryInterval: NodeJS.Timeout;

  const initViewer = () => {
  const Marzipano = window.Marzipano;
  if (!Marzipano) return false;

  try {
    if (viewerRef.current) {
      viewerRef.current.destroy();
    }

    const viewer = new Marzipano.Viewer(containerRef.current!, {
      controls: { mouseViewMode: "drag" }
    });

    const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);

    const limiter = Marzipano.RectilinearView.limit.traditional(
      3100,
      (100 * Math.PI) / 180
    );

    const view = new Marzipano.RectilinearView(null, limiter);

    // LEFT IMAGE
    const sourceLeft = Marzipano.ImageUrlSource.fromString(
      `/api/uploads/${image1.filename}`
    );

    const sceneLeft = viewer.createScene({
      source: sourceLeft,
      geometry,
      view,
      pinFirstLevel: true
    });

    sceneLeft.switchTo();

    viewerRef.current = viewer;

    return true;
  } catch (err) {
    console.error("Marzipano init error:", err);
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
    };
  }, []);

  const [count, setCount] = useState(0);   // UI-driven
  const refCount = useRef(0);              // internal

  function handleClick() {
    setCount(count + 1);        // triggers re-render
    refCount.current += 1;      // persists but no re-render
    console.log("Ref count:", refCount.current);
  }

  return (
    <div className={`w-full h-full min-h-[400px] bg-black relative`}>
      <div
        ref={containerRef}
        className="w-full h-full"
      >

      </div>
      <p>State count: {count}</p>
      <p>Ref count (only in console): {refCount.current}</p>
      <button onClick={handleClick}>Click</button>
    </div>
  );
}