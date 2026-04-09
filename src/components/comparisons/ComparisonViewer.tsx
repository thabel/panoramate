'use client';

import { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize, RotateCcw, AlertTriangle } from 'lucide-react';

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
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
    const [error1, setError1] = useState(false);
    const [error2, setError2] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    const getImageUrl = (filename: string) => `/api/uploads/${filename}`;

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setLastPos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;

        const dx = e.clientX - lastPos.x;
        const dy = e.clientY - lastPos.y;

        setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        setLastPos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setZoom(prev => Math.min(Math.max(prev * delta, 0.5), 5));
        }
    };

    const reset = () => {
        setZoom(1);
        setOffset({ x: 0, y: 0 });
    };

    return (
        <div className="flex flex-col h-full bg-dark-950 rounded-xl overflow-hidden border border-dark-700 shadow-2xl">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 bg-dark-800 border-b border-dark-700">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 bg-dark-700 rounded-lg p-0.5">
                        <button
                            onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))}
                            className="p-1.5 rounded-md hover:bg-dark-600 text-dark-300 hover:text-white transition-colors"
                            title="Zoom Out"
                        >
                            <ZoomOut size={16} />
                        </button>
                        <span className="px-2 text-xs font-mono text-dark-300 min-w-[45px] text-center">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            onClick={() => setZoom(prev => Math.min(prev + 0.2, 5))}
                            className="p-1.5 rounded-md hover:bg-dark-600 text-dark-300 hover:text-white transition-colors"
                            title="Zoom In"
                        >
                            <ZoomIn size={16} />
                        </button>
                    </div>
                    <button
                        onClick={reset}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition-colors border border-dark-600"
                    >
                        <RotateCcw size={14} />
                        Reset View
                    </button>
                </div>
                <div className="text-[10px] font-bold text-dark-500 uppercase tracking-widest hidden md:block">
                    Synchronized Comparison Mode
                </div>
            </div>

            {/* Side-by-Side View */}
            <div
                ref={containerRef}
                className="flex flex-1 overflow-hidden cursor-move select-none divide-x divide-dark-700 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            >
                {/* Left Image */}
                <div className="relative flex-1 bg-dark-900/40 overflow-hidden">
                    <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                        }}
                    >
                        {!error1 ? (
                            <img
                                src={getImageUrl(image1.filename)}
                                alt={image1.originalName}
                                className="max-w-full max-h-full object-contain shadow-2xl"
                                onError={() => setError1(true)}
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-red-400">
                                <AlertTriangle size={32} />
                                <span className="text-xs">Image 1 Load Error</span>
                            </div>
                        )}
                    </div>
                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 z-10">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Before: {new Date(image1.captureDate).toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Right Image */}
                <div className="relative flex-1 bg-dark-900/40 overflow-hidden">
                    <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                        }}
                    >
                        {!error2 ? (
                            <img
                                src={getImageUrl(image2.filename)}
                                alt={image2.originalName}
                                className="max-w-full max-h-full object-contain shadow-2xl"
                                onError={() => setError2(true)}
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-red-500">
                                <AlertTriangle size={32} />
                                <span className="text-xs">Image 2 Load Error</span>
                            </div>
                        )}
                    </div>
                    <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 z-10">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">After: {new Date(image2.captureDate).toLocaleDateString()}</span>
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    </div>
                </div>
            </div>

            {/* Footer / Instructions */}
            <div className="p-2 bg-dark-800 border-t border-dark-700 flex items-center justify-center gap-6 text-[10px] text-dark-500 font-medium">
                <div className="flex items-center gap-1.5">
                    <Maximize size={12} className="text-primary-500" />
                    Drag to pan
                </div>
                <div className="flex items-center gap-1.5">
                    <RotateCcw size={12} className="text-primary-500" />
                    Ctrl + Wheel to zoom
                </div>
            </div>
        </div>
    );
}
