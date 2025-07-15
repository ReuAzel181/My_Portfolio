import { useEffect } from 'react';

export const useAnalytics = () => {
  useEffect(() => {
    const trackPageView = async () => {
      try {
        // Check if we've already tracked this session
        const hasTracked = sessionStorage.getItem('visit_tracked');
        if (hasTracked) {
          console.log('Session already tracked, skipping');
          return;
        }

        console.log('Starting analytics collection...');

        // Get detailed system information
        const getSystemInfo = async () => {
          try {
            // Get GPU info
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
            const gpuInfo = gl ? {
              vendor: gl.getParameter(gl.VENDOR),
              renderer: gl.getParameter(gl.RENDERER),
              maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
              maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
              maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
              antialias: gl.getContextAttributes()?.antialias || false,
              extensions: gl.getSupportedExtensions()
            } : null;

            // Get detailed hardware info
            const hardwareInfo = {
              cores: navigator.hardwareConcurrency,
              memory: (navigator as any).deviceMemory,
              platform: navigator.platform,
              maxTouchPoints: navigator.maxTouchPoints,
              hasMouse: matchMedia('(pointer:fine)').matches,
              hasTouch: matchMedia('(pointer:coarse)').matches,
              hasHover: matchMedia('(hover:hover)').matches,
              primaryInput: matchMedia('(pointer:fine)').matches ? 'mouse' : 
                           matchMedia('(pointer:coarse)').matches ? 'touch' : 'none',
              audioCodecs: {
                mp3: testAudioFormat('audio/mpeg'),
                ogg: testAudioFormat('audio/ogg'),
                wav: testAudioFormat('audio/wav'),
                aac: testAudioFormat('audio/aac')
              },
              videoCodecs: {
                h264: testVideoFormat('video/mp4; codecs="avc1.42E01E"'),
                hevc: testVideoFormat('video/mp4; codecs="hevc,mp4a.40.2"'),
                vp8: testVideoFormat('video/webm; codecs="vp8,vorbis"'),
                vp9: testVideoFormat('video/webm; codecs="vp9"')
              }
            };

            // Get screen information
            const screenInfo = {
              resolution: `${window.screen.width}x${window.screen.height}`,
              colorDepth: `${window.screen.colorDepth}-bit`,
              orientation: window.screen.orientation?.type || 'unknown',
              pixelRatio: window.devicePixelRatio,
              availWidth: window.screen.availWidth,
              availHeight: window.screen.availHeight,
              colorGamut: window.matchMedia('(color-gamut: p3)').matches ? 'p3' : 
                          window.matchMedia('(color-gamut: srgb)').matches ? 'srgb' : 'default',
              refreshRate: 'requestVideoFrameCallback' in HTMLVideoElement.prototype ? 60 : undefined,
              prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
              prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
              prefersContrast: window.matchMedia('(prefers-contrast: more)').matches
            };

            // Get browser capabilities
            const browserCapabilities = {
              userAgent: navigator.userAgent,
              language: navigator.language,
              online: navigator.onLine,
              cookiesEnabled: navigator.cookieEnabled,
              storageQuota: await getStorageQuota(),
              hasSecureContext: window.isSecureContext,
              permissions: await getAvailablePermissions(),
              mediaDevices: await getMediaDevices()
            };

            // Get performance metrics
            const performanceMetrics = getDetailedPerformanceMetrics();

            // Get battery info
            const batteryInfo = await getBatteryInfo();

            return {
              gpu: gpuInfo,
              hardware: hardwareInfo,
              screen: screenInfo,
              browser: browserCapabilities,
              performance: performanceMetrics,
              battery: batteryInfo,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              locale: navigator.language,
              platform: navigator.platform,
              theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
            };
          } catch (error) {
            console.error('Error getting system info:', error);
            return null;
          }
        };

        // Helper functions
        const testAudioFormat = (format: string) => {
          const audio = document.createElement('audio');
          return audio.canPlayType(format) !== '';
        };

        const testVideoFormat = (format: string) => {
          const video = document.createElement('video');
          return video.canPlayType(format) !== '';
        };

        const getStorageQuota = async () => {
          try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
              const estimate = await navigator.storage.estimate();
              return {
                quota: estimate.quota,
                usage: estimate.usage
              };
            }
            return null;
          } catch (e) {
            console.error('Error getting storage quota:', e);
            return null;
          }
        };

        const getAvailablePermissions = async () => {
          const permissions = [
            'background-fetch',
            'background-sync',
            'clipboard-write',
            'payment-handler',
            'accelerometer',
            'gyroscope',
            'magnetometer',
            'screen-wake-lock'
          ];
          
          const results: Record<string, string> = {};
          
          if ('permissions' in navigator) {
            for (const permission of permissions) {
              try {
                const status = await navigator.permissions.query({ name: permission as PermissionName });
                results[permission] = status.state;
              } catch (e) {
                // Permission not supported
              }
            }
          }
          
          return results;
        };

        const getMediaDevices = async () => {
          try {
            if (!navigator.mediaDevices) return null;
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            return {
              audioInputs: devices.filter(d => d.kind === 'audioinput').length,
              audioOutputs: devices.filter(d => d.kind === 'audiooutput').length,
              videoInputs: devices.filter(d => d.kind === 'videoinput').length
            };
          } catch (e) {
            console.error('Error getting media devices:', e);
            return null;
          }
        };

        const getBatteryInfo = async () => {
          try {
            if ('getBattery' in navigator) {
              const battery: any = await (navigator as any).getBattery();
              return {
                charging: battery.charging,
                level: battery.level,
                chargingTime: battery.chargingTime,
                dischargingTime: battery.dischargingTime
              };
            }
            return null;
          } catch (e) {
            console.error('Error getting battery info:', e);
            return null;
          }
        };

        const getDetailedPerformanceMetrics = () => {
          try {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            if (!navigation) return null;

            return {
              dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
              tcpConnection: navigation.connectEnd - navigation.connectStart,
              tlsNegotiation: navigation.secureConnectionStart ? navigation.connectEnd - navigation.secureConnectionStart : 0,
              serverResponse: navigation.responseStart - navigation.requestStart,
              contentDownload: navigation.responseEnd - navigation.responseStart,
              domInteractive: navigation.domInteractive - navigation.responseEnd,
              totalPageLoad: navigation.loadEventEnd - navigation.startTime
            };
          } catch (e) {
            console.error('Error getting performance metrics:', e);
            return null;
          }
        };

        // Get session information
        const sessionInfo = {
          startTime: Date.now(),
          newVisit: !localStorage.getItem('last_visit'),
          lastVisit: localStorage.getItem('last_visit'),
          visitCount: parseInt(localStorage.getItem('visit_count') || '0') + 1,
          entryPage: window.location.pathname,
          referrer: document.referrer,
          previousVisits: JSON.parse(localStorage.getItem('previous_visits') || '[]'),
          interactions: {
            clicks: 0,
            scrolls: 0,
            keystrokes: 0,
            mouseMovements: 0
          }
        };

        // Update visit history
        const previousVisits = JSON.parse(localStorage.getItem('previous_visits') || '[]');
        previousVisits.push({
          timestamp: Date.now(),
          page: window.location.pathname
        });
        localStorage.setItem('previous_visits', JSON.stringify(previousVisits.slice(-10)));

        // Get system info and send analytics
        const systemInfo = await getSystemInfo();

        // Prepare the payload
        const analyticsData = {
          systemInfo,
          session: sessionInfo
        };

        console.log('Sending analytics data:', analyticsData);

        // Send the data
        const response = await fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(analyticsData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
          console.error('Analytics error response:', errorData);
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        console.log('Analytics sent successfully');
        sessionStorage.setItem('visit_tracked', 'true');

      } catch (error) {
        console.error('Failed to collect or send analytics:', error);
      }
    };

    // Call trackPageView immediately
    trackPageView();

    // Track user interactions
    const trackInteraction = (type: string) => {
      const interactions = JSON.parse(sessionStorage.getItem('interactions') || '{}');
      interactions[type] = (interactions[type] || 0) + 1;
      sessionStorage.setItem('interactions', JSON.stringify(interactions));
    };

    // Event listeners for interaction tracking
    window.addEventListener('click', () => trackInteraction('clicks'));
    window.addEventListener('scroll', () => trackInteraction('scrolls'));
    window.addEventListener('keypress', () => trackInteraction('keystrokes'));
    window.addEventListener('mousemove', () => trackInteraction('mouseMovements'));

    // Cleanup
    return () => {
      window.removeEventListener('click', () => trackInteraction('clicks'));
      window.removeEventListener('scroll', () => trackInteraction('scrolls'));
      window.removeEventListener('keypress', () => trackInteraction('keystrokes'));
      window.removeEventListener('mousemove', () => trackInteraction('mouseMovements'));
    };
  }, []);
}; 