import { useEffect, useState } from 'react';

export const useWebXRSupport = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if WebXR API exists
    if (navigator.xr) {
      // Check if immersive VR is supported
      navigator.xr
        .isSessionSupported('immersive-vr')
        .then((supported) => {
          setIsSupported(supported);
          setIsReady(true);
        })
        .catch(() => {
          setIsSupported(false);
          setIsReady(true);
        });
    } else {
      setIsSupported(false);
      setIsReady(true);
    }
  }, []);

  return { isSupported, isReady };
};
