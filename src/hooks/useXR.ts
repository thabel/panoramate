import { useState, useEffect, useCallback } from 'react';
import { detectXRCapabilities, requestXRSession, endXRSession, type XRCapabilities } from '@/lib/webxr-support';

interface UseXRReturn {
  capabilities: XRCapabilities | null;
  isLoading: boolean;
  error: string | null;
  isXRSupported: boolean;
  isVRSupported: boolean;
  startVRSession: () => Promise<void>;
  endVRSession: () => Promise<void>;
  isVRActive: boolean;
}

export function useXR(): UseXRReturn {
  const [capabilities, setCapabilities] = useState<XRCapabilities | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [xrSession, setXrSession] = useState<any>(null);
  const [isVRActive, setIsVRActive] = useState(false);

  // Detect XR capabilities on mount
  useEffect(() => {
    const detectCapabilities = async () => {
      try {
        setIsLoading(true);
        const caps = await detectXRCapabilities();
        setCapabilities(caps);
        console.log('🎮 XR Capabilities:', caps);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error detecting XR:', err);
      } finally {
        setIsLoading(false);
      }
    };

    detectCapabilities();
  }, []);

  // Start VR session
  const startVRSession = useCallback(async () => {
    if (!capabilities?.isSupported) {
      setError('WebXR is not supported on this device');
      return;
    }

    if (!capabilities.supportsVR) {
      setError('VR is not supported on this device');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const session = await requestXRSession('immersive-vr');

      if (session) {
        setXrSession(session);
        setIsVRActive(true);
        console.log('🥽 VR Session started');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start VR session';
      setError(errorMsg);
      console.error('Error starting VR:', err);
    } finally {
      setIsLoading(false);
    }
  }, [capabilities]);

  // End VR session
  const endVRSessionFn = useCallback(async () => {
    if (!xrSession) return;

    try {
      setIsLoading(true);
      await endXRSession(xrSession);
      setXrSession(null);
      setIsVRActive(false);
      console.log('🥽 VR Session ended');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to end VR session';
      setError(errorMsg);
      console.error('Error ending VR:', err);
    } finally {
      setIsLoading(false);
    }
  }, [xrSession]);

  return {
    capabilities,
    isLoading,
    error,
    isXRSupported: capabilities?.isSupported ?? false,
    isVRSupported: capabilities?.supportsVR ?? false,
    startVRSession,
    endVRSession: endVRSessionFn,
    isVRActive,
  };
}
