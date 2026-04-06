'use client';

import { useState } from 'react';
import { TourImage } from '@/types';
import { Layers, X, ChevronRight, Menu } from 'lucide-react';

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

  return (
    <>
      {/* Menu Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2.5 text-white transition-all border rounded-xl bg-dark-900/40 hover:bg-dark-900/60 backdrop-blur-md border-white/10 shadow-xl"
        title="Open Scene Menu"
      >
        <Menu size={18} />
        <span className="text-sm font-medium hidden sm:inline">Scenes</span>
      </button>

      {/* Right Sidebar Menu */}
      <div 
        className={`fixed inset-y-0 right-0 z-[100] w-full max-w-xs bg-dark-900/90 backdrop-blur-2xl border-l border-white/10 shadow-2xl transition-transform duration-500 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Layers className="text-primary-400" size={20} />
              <div className="text-lg font-bold text-white">Tour Scenes</div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/5 rounded-full text-dark-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Scene List */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="space-y-2">
              {scenes.map((scene, index) => (
                <button
                  key={scene.id}
                  onClick={() => {
                    onSceneSelect(scene.id);
                    // On mobile, close after selection
                    if (window.innerWidth < 768) setIsOpen(false);
                  }}
                  className={`w-full group relative rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                    currentSceneId === scene.id
                      ? 'border-primary-500 ring-4 ring-primary-500/10'
                      : 'border-transparent hover:border-white/20'
                  }`}
                >
                  <div className="aspect-[16/9] relative">
                    <img
                      src={`/api/uploads/${scene.filename}`}
                      alt={scene.title || `Scene ${index + 1}`}
                      className={`object-cover w-full h-full transition-transform duration-700 ${
                        currentSceneId === scene.id ? 'scale-110' : 'group-hover:scale-110'
                      }`}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300 ${
                      currentSceneId === scene.id ? 'opacity-90' : 'opacity-60 group-hover:opacity-80'
                    }`} />
                    
                    <div className="absolute inset-0 p-4 flex flex-col justify-end">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-1">Scene {index + 1}</p>
                          <h4 className="text-sm font-bold text-white truncate drop-shadow-md">
                            {scene.title || scene.originalName}
                          </h4>
                        </div>
                        {currentSceneId === scene.id && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/40 animate-pulse">
                            <ChevronRight size={18} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 bg-white/5">
            <div className="flex items-center justify-between text-xs text-dark-400 font-medium uppercase tracking-widest">
              <span>Total Scenes</span>
              <span className="text-white">{scenes.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for closing when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </>
  );
};
