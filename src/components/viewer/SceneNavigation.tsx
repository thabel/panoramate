'use client';

import { useState, useRef } from 'react';
import { TourImage } from '@/types';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Search, Menu, Grid3x3, List } from 'lucide-react';

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
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!showMenu) return null;

  const filteredScenes = scenes.filter(scene =>
    (scene.title || scene.originalName)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

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
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center w-full max-w-[95vw]">
      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 bg-dark-900/80 hover:bg-dark-800 text-white px-4 py-2.5 rounded-full backdrop-blur-md border border-dark-700/50 transition-all shadow-lg mb-3 active:scale-95 ${
          isOpen ? 'ring-2 ring-primary-500/50' : ''
        }`}
      >
        <Menu size={18} className="text-primary-400" />
        <span className="text-sm font-medium">
          {scenes.length} scenes
        </span>
        {isOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
      </button>

      {/* Navigation Panel */}
      {isOpen && (
        <div className="w-full max-w-4xl px-3 py-4 space-y-3 border shadow-2xl bg-dark-900/90 backdrop-blur-md border-dark-700/50 rounded-2xl animate-fade-in">
          {/* Search Bar */}
          <div className="px-3">
            <div className="relative">
              <Search size={16} className="absolute -translate-y-1/2 left-3 top-1/2 text-dark-400" />
              <input
                type="text"
                placeholder="Search scenes by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 pr-3 text-sm text-white transition-all border rounded-lg outline-none pl-9 bg-dark-800 border-dark-600 focus:border-primary-500"
              />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 px-3">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-800 text-dark-300 hover:text-white'
              }`}
            >
              <Grid3x3 size={14} />
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-800 text-dark-300 hover:text-white'
              }`}
            >
              <List size={14} />
              List
            </button>
          </div>

          {/* Scenes Display */}
          {viewMode === 'grid' ? (
            // Grid View
            <div className="relative px-3 group/grid">
              {filteredScenes.length > 4 && (
                <button
                  onClick={() => scrollThumbnails('left')}
                  className="absolute left-0 z-40 p-2 text-white transition-all -translate-y-1/2 border rounded-full shadow-xl opacity-0 top-1/2 bg-dark-900/80 hover:bg-primary-600 border-dark-700/50 active:scale-90 group-hover/grid:opacity-100"
                >
                  <ChevronLeft size={20} />
                </button>
              )}

              <div
                ref={scrollContainerRef}
                className="flex gap-3 pb-2 overflow-x-auto scrollbar-hide"
              >
                {filteredScenes.length > 0 ? (
                  filteredScenes.map((scene) => (
                    <button
                      key={scene.id}
                      onClick={() => {
                        onSceneSelect(scene.id);
                        setIsOpen(false);
                      }}
                      className={`relative flex-shrink-0 w-28 h-20 rounded-xl overflow-hidden border-2 transition-all group ${
                        currentSceneId === scene.id
                          ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                          : 'border-dark-600 hover:border-primary-400'
                      }`}
                    >
                      <img
                        src={`/api/uploads/${scene.filename}`}
                        alt={scene.title || scene.originalName}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2 text-[10px] font-medium text-white truncate text-center">
                        {scene.title || scene.originalName}
                      </div>
                      {currentSceneId === scene.id && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="w-full py-4 text-sm text-center text-dark-400">
                    No scenes match your search
                  </div>
                )}
              </div>

              {filteredScenes.length > 4 && (
                <button
                  onClick={() => scrollThumbnails('right')}
                  className="absolute right-0 z-40 p-2 text-white transition-all -translate-y-1/2 border rounded-full shadow-xl opacity-0 top-1/2 bg-dark-900/80 hover:bg-primary-600 border-dark-700/50 active:scale-90 group-hover/grid:opacity-100"
                >
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
          ) : (
            // List View
            <div className="px-3 space-y-1 overflow-y-auto max-h-64 scrollbar-thin scrollbar-thumb-dark-700">
              {filteredScenes.length > 0 ? (
                filteredScenes.map((scene, index) => (
                  <button
                    key={scene.id}
                    onClick={() => {
                      onSceneSelect(scene.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all border flex items-center gap-3 ${
                      currentSceneId === scene.id
                        ? 'bg-primary-600/20 border-primary-500 text-white'
                        : 'bg-dark-800 border-dark-700 text-dark-300 hover:bg-dark-700 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center justify-center flex-shrink-0 w-6 h-6 text-xs font-medium rounded bg-dark-900/50">
                      {index + 1}
                    </span>
                    <span className="flex-1 truncate">
                      {scene.title || scene.originalName}
                    </span>
                    {currentSceneId === scene.id && (
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-500" />
                    )}
                  </button>
                ))
              ) : (
                <div className="w-full py-4 text-sm text-center text-dark-400">
                  No scenes match your search
                </div>
              )}
            </div>
          )}

          {/* Scene Count */}
          <div className="px-3 text-xs text-center text-dark-400">
            {filteredScenes.length} of {scenes.length} scenes
          </div>
        </div>
      )}
    </div>
  );
};
