'use client';

import { useState } from 'react';
import { TourImage } from '@/types';
import { Layers, ChevronDown } from 'lucide-react';

interface TopSceneMenuProps {
  scenes: TourImage[];
  currentSceneId: string | null;
  onSceneSelect: (sceneId: string) => void;
}

export const TopSceneMenu: React.FC<TopSceneMenuProps> = ({
  scenes,
  currentSceneId,
  onSceneSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentScene = scenes.find(s => s.id === currentSceneId);

  return (
    <div className="relative">
      {/* Menu Button - Compact */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center p-2 text-white transition-all border rounded-lg bg-dark-900/60 hover:bg-dark-800 backdrop-blur-sm border-dark-700/50"
        title={`Scenes: ${currentScene?.title || currentScene?.originalName || 'Scenes'}`}
      >
        <Layers size={18} />
        <ChevronDown size={14} className={`ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 max-h-96 overflow-y-auto bg-dark-900/95 backdrop-blur-md border border-dark-700/50 rounded-xl shadow-2xl z-40 animate-fade-in scrollbar-thin scrollbar-thumb-dark-700">
          <div className="p-2 space-y-1">
            {scenes.map((scene, index) => (
              <button
                key={scene.id}
                onClick={() => {
                  onSceneSelect(scene.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all border-2 flex items-center gap-3 ${
                  currentSceneId === scene.id
                    ? 'bg-primary-600/20 border-primary-500 text-white'
                    : 'bg-dark-800 border-transparent text-dark-300 hover:bg-dark-700 hover:text-white'
                }`}
              >
                <span className="flex-shrink-0 w-6 h-6 rounded bg-dark-900/50 flex items-center justify-center text-xs font-semibold text-primary-400">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {scene.title || scene.originalName}
                  </div>
                </div>
                {currentSceneId === scene.id && (
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-500" />
                )}
              </button>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-dark-700/50 text-center text-xs text-dark-400">
            {scenes.length} scenes
          </div>
        </div>
      )}
    </div>
  );
};
