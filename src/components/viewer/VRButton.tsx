'use client';

import { useXR } from '@/hooks/useXR';
import { Headphones, X, AlertCircle, Loader } from 'lucide-react';
import { useState } from 'react';

export default function VRButton() {
  const { isVRSupported, startVRSession, endVRSession, isVRActive, isLoading, error, capabilities } = useXR();
  const [showError, setShowError] = useState(false);

  // Don't show button if VR not supported
  if (!isVRSupported) {
    return null;
  }

  const handleStartVR = async () => {
    setShowError(false);
    try {
      await startVRSession();
    } catch (err) {
      setShowError(true);
      console.error('VR Error:', err);
    }
  };

  const handleEndVR = async () => {
    try {
      await endVRSession();
    } catch (err) {
      console.error('Error ending VR:', err);
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
        title={isVRSupported ? 'Enter VR mode' : 'VR not supported on this device'}
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
      {error && showError && (
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

      {/* Info Message - No Headset */}
      {!isVRActive && !error && isVRSupported && capabilities?.isSupported && (
        <div className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded text-center">
          🥽 VR mode available - connect your headset
        </div>
      )}
    </div>
  );
}
