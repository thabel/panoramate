'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { TourImage } from '@/types';
import { Layers, ChevronDown, Search, X } from 'lucide-react';

interface TopSceneMenuProps {
  scenes: TourImage[];
  currentSceneId: string | null;
  onSceneSelect: (sceneId: string) => void;
}

function highlight(text: string, query: string) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary-500/25 text-primary-300 rounded-[2px]">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export const TopSceneMenu: React.FC<TopSceneMenuProps> = ({
  scenes,
  currentSceneId,
  onSceneSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentScene = scenes.find(s => s.id === currentSceneId);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? scenes.filter(s =>
      (s.title || s.originalName || '').toLowerCase().includes(q)
    ) : scenes;
  }, [scenes, query]);

  // Fermer au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus sur la recherche à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Fermer avec Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleSelect = (sceneId: string) => {
    onSceneSelect(sceneId);
    setIsOpen(false);
  };

  const label = currentScene?.title || currentScene?.originalName || 'Scènes';

  return (
    <div ref={containerRef} className="relative">
      {/* Bouton déclencheur */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-white border rounded-xl transition-all bg-dark-900/60 hover:bg-dark-800 backdrop-blur-sm border-dark-700/50"
        title={label}
      >
        <Layers size={15} />
        <span className="max-w-[120px] truncate text-sm">{label}</span>
        <ChevronDown
          size={12}
          className={`opacity-60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 z-40 mt-2 overflow-hidden border shadow-2xl w-72 bg-dark-900/95 backdrop-blur-md border-dark-700/50 rounded-2xl animate-fade-in">

          {/* Barre de recherche */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-dark-700/50">
            <Search size={14} className="flex-shrink-0 text-dark-400" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher une scène…"
              className="flex-1 text-sm text-white bg-transparent outline-none placeholder:text-dark-500 caret-primary-400"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); searchRef.current?.focus(); }}
                className="text-dark-500 hover:text-white hover:bg-dark-700 rounded p-0.5 transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Liste */}
          <div className="max-h-80 overflow-y-auto py-1.5 px-1.5 space-y-0.5 scrollbar-thin scrollbar-thumb-dark-700">
            {filtered.length === 0 ? (
              <p className="py-6 text-sm text-center text-dark-500">
                Aucune scène trouvée
              </p>
            ) : (
              filtered.map((scene, i) => {
                const name = scene.title || scene.originalName || '';
                const isActive = scene.id === currentSceneId;
                return (
                  <button
                    key={scene.id}
                    onClick={() => handleSelect(scene.id)}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all border ${
                      isActive
                        ? 'bg-primary-600/12 border-primary-500/40 text-white'
                        : 'border-transparent text-dark-400 hover:bg-dark-800 hover:text-white'
                    }`}
                  >
                    <span className={`flex-shrink-0 w-5 h-5 rounded-md text-[11px] font-semibold flex items-center justify-center ${
                      isActive ? 'bg-primary-500/20 text-primary-400' : 'bg-dark-800 text-dark-400'
                    }`}>
                      {scenes.indexOf(scene) + 1}
                    </span>
                    <span className="flex-1 truncate">
                      {highlight(name, query)}
                    </span>
                    {isActive && (
                      <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary-500" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Pied de page */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-dark-700/50">
            <span className="text-xs text-dark-500">{scenes.length} scènes</span>
            {query.trim() && (
              <span className="text-xs text-primary-400/70">
                {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};