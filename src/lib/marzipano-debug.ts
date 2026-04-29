/**
 * Marzipano Mobile Debug Utils
 * Helps diagnose black container and loading issues on mobile
 */

import { logger } from './logger';

export const marzipanoDebug = {
  /**
   * Test if an image can be loaded (CORS, HTTP/HTTPS, etc)
   */
  async testImageLoad(url: string): Promise<{
    success: boolean;
    width?: number;
    height?: number;
    url: string;
    error?: string;
    corsIssue?: boolean;
    timing?: number;
  }> {
    const startTime = performance.now();
    const img = new Image();

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        img.src = '';
        logger.error({ url }, '[Marzipano] Image load timeout (>10s)');
        resolve({
          success: false,
          url,
          error: 'Timeout after 10 seconds',
          timing: performance.now() - startTime,
        });
      }, 10000);

      img.onload = () => {
        clearTimeout(timeout);
        const timing = performance.now() - startTime;
        logger.info(
          {
            url,
            width: img.naturalWidth,
            height: img.naturalHeight,
            timing: `${timing.toFixed(0)}ms`,
          },
          '[Marzipano] ✅ Image loaded'
        );
        resolve({
          success: true,
          width: img.naturalWidth,
          height: img.naturalHeight,
          url,
          timing,
        });
      };

      img.onerror = (err) => {
        clearTimeout(timeout);
        const isCors = (err as any).type === 'error' || url.includes('http');
        logger.error(
          {
            url,
            corsIssue: isCors,
            timing: performance.now() - startTime,
            currentProtocol: window.location.protocol,
          },
          '[Marzipano] ❌ Image load failed (possible CORS or mixed content)'
        );
        resolve({
          success: false,
          url,
          error: 'Image load failed',
          corsIssue: isCors,
          timing: performance.now() - startTime,
        });
      };

      // Add crossOrigin to test CORS
      img.crossOrigin = 'anonymous';
      img.src = url;
    });
  },

  /**
   * Check if HTTPS/HTTP is causing issues
   */
  checkProtocol(): {
    currentProtocol: string;
    isHttps: boolean;
    isMixedContent: boolean;
    warning?: string;
  } {
    const protocol = window.location.protocol;
    const isHttps = protocol === 'https:';

    return {
      currentProtocol: protocol,
      isHttps,
      isMixedContent: false,
      warning: isHttps
        ? '⚠️ HTTPS active - ensure all images/resources are also HTTPS'
        : '📌 HTTP mode - check console for mixed content warnings',
    };
  },

  /**
   * Check WebGL support
   */
  checkWebGL(): {
    webgl1: boolean;
    webgl2: boolean;
    powerPreference?: string;
    message: string;
  } {
    const canvas = document.createElement('canvas');

    const webgl1 = !!canvas.getContext('webgl');
    const webgl2 = !!canvas.getContext('webgl2');

    let message = '';
    if (!webgl1 && !webgl2) {
      message =
        '❌ WebGL not supported - Marzipano requires WebGL to render panoramas';
    } else if (webgl2) {
      message = '✅ WebGL2 available';
    } else {
      message = '✅ WebGL1 available (fallback mode)';
    }

    logger.info({ webgl1, webgl2 }, `[Marzipano] ${message}`);

    return { webgl1, webgl2, message };
  },

  /**
   * Check Mobile-specific issues
   */
  checkMobileIssues(): {
    isMobile: boolean;
    screenSize: string;
    memory?: number;
    connection: string;
    issues: string[];
  } {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    const screenSize = `${window.innerWidth}x${window.innerHeight}`;
    const memory = (navigator as any).deviceMemory;
    const connection = (navigator as any).connection?.effectiveType || 'unknown';

    const issues: string[] = [];

    if (isMobile) {
      if (memory && memory < 4) {
        issues.push('⚠️ Low device memory - may cause rendering issues');
      }
      if (connection === '4g' || connection === '3g') {
        issues.push('⚠️ Slow connection detected - images may load slowly');
      }
    }

    logger.info(
      { isMobile, screenSize, memory, connection, issues },
      '[Marzipano] Mobile check'
    );

    return { isMobile, screenSize, memory, connection, issues };
  },

  /**
   * Comprehensive health check
   */
  async runHealthCheck(imageUrl: string): Promise<{
    protocol: any;
    webgl: any;
    mobile: any;
    imageLoad: Awaited<ReturnType<typeof marzipanoDebug.testImageLoad>>;
    summary: string;
  }> {
    logger.info({}, '[Marzipano] Running comprehensive health check...');

    const protocol = this.checkProtocol();
    const webgl = this.checkWebGL();
    const mobile = this.checkMobileIssues();
    const imageLoad = await this.testImageLoad(imageUrl);

    const allGood = imageLoad.success && (webgl.webgl1 || webgl.webgl2);
    const summary = allGood
      ? '✅ All checks passed'
      : '❌ Some issues detected - see details above';

    logger.info(
      {
        protocol,
        webgl,
        mobile,
        imageLoad,
        summary,
      },
      '[Marzipano] Health check complete'
    );

    return { protocol, webgl, mobile, imageLoad, summary };
  },
};
