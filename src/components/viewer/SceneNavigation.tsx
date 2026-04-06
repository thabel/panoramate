'use client';

import { useRef } from 'react';
import { TourImage } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SceneNavigationProps {
  scenes: TourImage[];
  currentSceneId: string | null;
  onSceneSelect: (sceneId: string) => void;
  showMenu?: boolean;
}

export const SceneNavigation: React.FC<SceneNavigationProps> = ({
  scenes,
  currentSceneId,
  onSceneSelect,
  showMenu = true,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!showMenu || scenes.length <= 1) return null;

  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 w-full max-w-6xl px-4 animate-fade-in">
      <div className="relative bg-dark-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl group/grid">
        {/* Navigation Buttons */}
        {scenes.length > 4 && (
          <>
            <button
              onClick={() => scrollThumbnails('left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-50 p-2.5 text-white transition-all border rounded-full shadow-xl opacity-0 bg-primary-600 hover:bg-primary-700 border-primary-500 active:scale-90 group-hover/grid:opacity-100"
              title="Scroll left"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => scrollThumbnails('right')}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-50 p-2.5 text-white transition-all border rounded-full shadow-xl opacity-0 bg-primary-600 hover:bg-primary-700 border-primary-500 active:scale-90 group-hover/grid:opacity-100"
              title="Scroll right"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x px-12"
        >
          {scenes.map((scene) => (
            <button
              key={scene.id}
              onClick={() => onSceneSelect(scene.id)}
              className={`relative flex-shrink-0 w-40 h-28 rounded-xl overflow-hidden border-2 transition-all group snap-start cursor-pointer ${
                currentSceneId === scene.id
                  ? 'border-primary-500 ring-2 ring-primary-500/30 shadow-[0_0_20px_rgba(99,102,241,0.6)]'
                  : 'border-dark-600 hover:border-primary-400'
              }`}
            >
              <img
                src={`/api/uploads/${scene.filename}`}
                alt={scene.title || scene.originalName}
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-70 group-hover:opacity-80 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-2.5 text-xs font-semibold text-white truncate text-center leading-tight">
                {scene.title || scene.originalName}
              </div>
              {currentSceneId === scene.id && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-primary-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,1)]" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
