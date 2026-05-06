'use client';

import { Headphones, X, AlertCircle, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function VRButton() {
  const [isMounted, setIsMounted] = useState(false);
  const [hasWebXR, setHasWebXR] = useState(false);
  const [isVRActive, setIsVRActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only run on client
  useEffect(() => {
    setIsMounted(true);

    // Check WebXR support
    if (typeof window !== 'undefined' && (navigator as any).xr) {
      setHasWebXR(true);
      console.log('✅ WebXR is supported on this device');
    } else {
      setHasWebXR(false);
      console.log('❌ WebXR is NOT supported on this device');
    }
  }, []);

  if (!isMounted || !hasWebXR) {
    return null;
  }

  const handleStartVR = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!(navigator as any).xr) {
        throw new Error('WebXR not supported');
      }

      const session = await (navigator as any).xr.requestSession('immersive-vr');
      setIsVRActive(true);
      console.log('✅ VR Session started');

      // Handle session end
      session.addEventListener('end', () => {
        setIsVRActive(false);
        console.log('✅ VR Session ended');
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start VR';
      setError(errorMsg);
      console.error('❌ VR Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndVR = async () => {
    setIsLoading(true);
    try {
      setIsVRActive(false);
      console.log('✅ VR Session ended');
    } catch (err) {
      console.error('❌ Error ending VR:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* VR Button */}
      <button
        onClick={isVRActive ? handleEndVR : handleStartVR}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          isVRActive
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title="Enter VR mode"
      >
        {isLoading ? (
          <>
            <Loader size={18} className="animate-spin" />
            <span>{isVRActive ? 'Exiting...' : 'Loading...'}</span>
          </>
        ) : isVRActive ? (
          <>
            <X size={18} />
            <span>Exit VR</span>
          </>
        ) : (
          <>
            <Headphones size={18} />
            <span>Enter VR</span>
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-600/50 rounded-lg">
          <AlertCircle size={18} className="flex-shrink-0 text-red-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-300 font-medium">VR Error</p>
            <p className="text-xs text-red-200 mt-1">{error}</p>
            <p className="text-xs text-red-300 mt-2">
              💡 Note: VR requires a compatible headset (Meta Quest, HTC Vive, etc.)
            </p>
          </div>
        </div>
      )}

      {/* Info Message */}
      {!isVRActive && !error && hasWebXR && (
        <div className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded text-center">
          🥽 VR mode available - connect your headset
        </div>
      )}
    </div>
  );
}
