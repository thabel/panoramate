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
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-5xl px-6 animate-fade-in">
      <div className="relative group/grid bg-dark-900/40 backdrop-blur-xl p-4 rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {scenes.length > 5 && (
          <button
            onClick={() => scrollThumbnails('left')}
            className="absolute -left-6 z-40 p-3 text-white transition-all -translate-y-1/2 border rounded-full shadow-2xl opacity-0 top-1/2 bg-dark-900/80 hover:bg-primary-600 border-white/10 active:scale-90 group-hover/grid:opacity-100"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x px-2"
        >
          {scenes.map((scene) => (
            <button
              key={scene.id}
              onClick={() => onSceneSelect(scene.id)}
              className={`relative flex-shrink-0 w-32 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-500 group snap-start ${
                currentSceneId === scene.id
                  ? 'border-primary-500 scale-105 shadow-[0_0_20px_rgba(99,102,241,0.4)] z-10'
                  : 'border-white/5 hover:border-white/20 opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={`/api/uploads/${scene.filename}`}
                alt={scene.title || scene.originalName}
                className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-2.5 text-[10px] font-bold text-white truncate text-center uppercase tracking-wider leading-tight">
                {scene.title || scene.originalName}
              </div>
            </button>
          ))}
        </div>

        {scenes.length > 5 && (
          <button
            onClick={() => scrollThumbnails('right')}
            className="absolute -right-6 z-40 p-3 text-white transition-all -translate-y-1/2 border rounded-full shadow-2xl opacity-0 top-1/2 bg-dark-900/80 hover:bg-primary-600 border-white/10 active:scale-90 group-hover/grid:opacity-100"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  );
};
