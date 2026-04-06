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
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-4 animate-fade-in">
      <div className="relative group/grid bg-dark-900/50 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-2xl">
        {scenes.length > 4 && (
          <button
            onClick={() => scrollThumbnails('left')}
            className="absolute -left-4 z-40 p-2 text-white transition-all -translate-y-1/2 border rounded-full shadow-xl opacity-0 top-1/2 bg-dark-900/80 hover:bg-primary-600 border-dark-700/50 active:scale-90 group-hover/grid:opacity-100"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide snap-x"
        >
          {scenes.map((scene) => (
            <button
              key={scene.id}
              onClick={() => onSceneSelect(scene.id)}
              className={`relative flex-shrink-0 w-28 h-20 rounded-xl overflow-hidden border-2 transition-all group snap-start ${
                currentSceneId === scene.id
                  ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <img
                src={`/api/uploads/${scene.filename}`}
                alt={scene.title || scene.originalName}
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-2 text-[10px] font-medium text-white truncate text-center leading-tight">
                {scene.title || scene.originalName}
              </div>
              {currentSceneId === scene.id && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              )}
            </button>
          ))}
        </div>

        {scenes.length > 4 && (
          <button
            onClick={() => scrollThumbnails('right')}
            className="absolute -right-4 z-40 p-2 text-white transition-all -translate-y-1/2 border rounded-full shadow-xl opacity-0 top-1/2 bg-dark-900/80 hover:bg-primary-600 border-dark-700/50 active:scale-90 group-hover/grid:opacity-100"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
};
