/**
 * WebXR Support Detection and Utilities
 * Detect if browser supports VR/AR capabilities
 */

export interface XRCapabilities {
  isSupported: boolean;
  supportsVR: boolean;
  supportsAR: boolean;
  deviceName: string;
}

/**
 * Detect WebXR capabilities of the current device
 */
export async function detectXRCapabilities(): Promise<XRCapabilities> {
  const capabilities: XRCapabilities = {
    isSupported: false,
    supportsVR: false,
    supportsAR: false,
    deviceName: 'Unknown',
  };

  // Check if navigator.xr exists
  if (!navigator.xr) {
    console.log('❌ WebXR not supported on this device');
    return capabilities;
  }

  capabilities.isSupported = true;
  console.log('✅ WebXR is supported!');

  // Detect VR support
  try {
    const vrSupported = await navigator.xr.isSessionSupported('immersive-vr');
    capabilities.supportsVR = vrSupported;
    console.log(`✅ VR Support: ${vrSupported}`);
  } catch (err) {
    console.error('❌ Error checking VR support:', err);
  }

  // Detect AR support
  try {
    const arSupported = await navigator.xr.isSessionSupported('immersive-ar');
    capabilities.supportsAR = arSupported;
    console.log(`✅ AR Support: ${arSupported}`);
  } catch (err) {
    console.error('❌ Error checking AR support:', err);
  }

  return capabilities;
}

/**
 * Request WebXR immersive VR session
 */
export async function requestXRSession(
  mode: 'immersive-vr' | 'immersive-ar' = 'immersive-vr'
): Promise<XRSession | null> {
  if (!navigator.xr) {
    console.error('❌ WebXR not supported');
    throw new Error('WebXR is not supported on this device');
  }

  try {
    const session = await navigator.xr.requestSession(mode);
    console.log(`✅ XR Session started: ${mode}`);
    return session;
  } catch (err) {
    console.error(`❌ Failed to start ${mode} session:`, err);
    throw err;
  }
}

/**
 * End XR session
 */
export async function endXRSession(session: XRSession): Promise<void> {
  try {
    await session.end();
    console.log('✅ XR Session ended');
  } catch (err) {
    console.error('❌ Error ending XR session:', err);
  }
}

export {};
