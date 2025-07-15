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
              // Get more detailed WebGL capabilities
              maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
              maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
              maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
              antialias: gl.getContextAttributes()?.antialias || false,
              extensions: gl.getSupportedExtensions()
            } : null;

            // Get detailed hardware info
            const hardwareInfo = {
              // CPU & Memory
              cores: navigator.hardwareConcurrency,
              memory: (navigator as any).deviceMemory,
              platform: navigator.platform,
              // Detailed device capabilities
              maxTouchPoints: navigator.maxTouchPoints,
              hasMouse: matchMedia('(pointer:fine)').matches,
              hasTouch: matchMedia('(pointer:coarse)').matches,
              hasHover: matchMedia('(hover:hover)').matches,
              primaryInput: matchMedia('(pointer:fine)').matches ? 'mouse' : 
                          matchMedia('(pointer:coarse)').matches ? 'touch' : 'none',
              // Audio capabilities
              audioCodecs: {
                mp3: testAudioFormat('audio/mpeg'),
                ogg: testAudioFormat('audio/ogg'),
                wav: testAudioFormat('audio/wav'),
                aac: testAudioFormat('audio/aac')
              },
              // Video capabilities
              videoCodecs: {
                h264: testVideoFormat('video/mp4; codecs="avc1.42E01E"'),
                hevc: testVideoFormat('video/mp4; codecs="hevc,mp4a.40.2"'),
                vp8: testVideoFormat('video/webm; codecs="vp8,vorbis"'),
                vp9: testVideoFormat('video/webm; codecs="vp9"')
              }
            };

            // Get installed fonts (using font fingerprinting technique)
            const installedFonts = await detectInstalledFonts();

            // Get detailed screen information
            const screenInfo = {
              // Basic screen info
              resolution: `${window.screen.width}x${window.screen.height}`,
              colorDepth: `${window.screen.colorDepth}-bit`,
              orientation: window.screen.orientation.type,
              pixelRatio: window.devicePixelRatio,
              // Additional screen details
              availWidth: window.screen.availWidth,
              availHeight: window.screen.availHeight,
              // Color gamut support
              colorGamut: window.matchMedia('(color-gamut: p3)').matches ? 'p3' : 
                          window.matchMedia('(color-gamut: srgb)').matches ? 'srgb' : 'default',
              // Display properties
              refreshRate: 'requestVideoFrameCallback' in HTMLVideoElement.prototype ? 60 : undefined,
              // System preferences
              prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
              prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
              prefersContrast: window.matchMedia('(prefers-contrast: more)').matches,
            };

            // Get detailed browser capabilities
            const browserCapabilities = {
              // Basic info
              userAgent: navigator.userAgent,
              appName: navigator.appName,
              appCodeName: navigator.appCodeName,
              appVersion: navigator.appVersion,
              // Browser features
              cookiesEnabled: navigator.cookieEnabled,
              doNotTrack: navigator.doNotTrack,
              languages: navigator.languages,
              onLine: navigator.onLine,
              pdfViewerEnabled: (navigator as any).pdfViewerEnabled,
              // Storage quotas
              storageQuota: await getStorageQuota(),
              // Connection capabilities
              connectionType: (navigator as any).connection?.type || 'unknown',
              connectionSpeed: (navigator as any).connection?.downlink || 'unknown',
              saveData: (navigator as any).connection?.saveData || false,
              // Security
              hasSecureContext: window.isSecureContext,
              hasTrustTokens: 'trustTokens' in navigator,
              // Advanced features
              serviceWorker: 'serviceWorker' in navigator,
              permissions: await getAvailablePermissions(),
              // Installed browser plugins
              plugins: Array.from(navigator.plugins).map(p => ({
                name: p.name,
                description: p.description,
                filename: p.filename
              })),
              // Browser storage
              localStorage: !!window.localStorage,
              sessionStorage: !!window.sessionStorage,
              indexedDB: !!window.indexedDB,
              // Advanced APIs
              bluetooth: 'bluetooth' in navigator,
              usb: 'usb' in navigator,
              serial: 'serial' in navigator,
              nfc: 'nfc' in navigator,
              // Media capabilities
              mediaDevices: await getMediaDevices(),
              // System badges
              badges: 'badges' in navigator,
              // Clipboard capabilities
              clipboard: 'clipboard' in navigator,
              // Payment capabilities
              payment: 'payment' in navigator,
              // VR/AR support
              xr: 'xr' in navigator
            };

            // Get system performance metrics
            const performance = {
              memory: (window.performance as any).memory ? {
                jsHeapSizeLimit: (window.performance as any).memory.jsHeapSizeLimit,
                totalJSHeapSize: (window.performance as any).memory.totalJSHeapSize,
                usedJSHeapSize: (window.performance as any).memory.usedJSHeapSize
              } : null,
              timing: window.performance.timing,
              navigation: window.performance.navigation,
              // Detailed metrics
              metrics: getDetailedPerformanceMetrics()
            };

            return {
              gpu: gpuInfo,
              hardware: hardwareInfo,
              screen: screenInfo,
              browser: browserCapabilities,
              fonts: installedFonts,
              performance,
              // System environment
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              locale: Intl.DateTimeFormat().resolvedOptions().locale,
              dateTimeFormat: Intl.DateTimeFormat().resolvedOptions(),
              numberFormat: Intl.NumberFormat().resolvedOptions(),
              // OS-specific info
              platform: navigator.platform,
              oscpu: (navigator as any).oscpu,
              // Hardware concurrency
              logicalProcessors: navigator.hardwareConcurrency,
              // Device memory
              deviceMemory: (navigator as any).deviceMemory,
              // Network characteristics
              networkInfo: (navigator as any).connection,
              // Battery status
              batteryInfo: await getBatteryInfo(),
              // System theme
              systemTheme: detectSystemTheme()
            };
          } catch (error) {
            console.error('Error getting system info:', error);
            return null;
          }
        };

        // Helper function to test audio format support
        const testAudioFormat = (format: string) => {
          const audio = document.createElement('audio');
          return audio.canPlayType(format) !== '';
        };

        // Helper function to test video format support
        const testVideoFormat = (format: string) => {
          const video = document.createElement('video');
          return video.canPlayType(format) !== '';
        };

        // Helper function to detect installed fonts
        const detectInstalledFonts = async () => {
          const fontList = [
            'Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia',
            'Helvetica', 'Comic Sans MS', 'Impact', 'Tahoma', 'Trebuchet MS',
            'Webdings', 'Wingdings', 'MS Sans Serif', 'MS Serif', 'Palatino',
            'Garamond', 'Bookman', 'Avant Garde', 'Century Gothic', 'Calibri',
            'Cambria', 'Consolas', 'Corbel', 'Franklin Gothic', 'Segoe UI',
            'Ubuntu', 'Roboto', 'Open Sans', 'Droid Sans', 'Lato', 'Montserrat'
          ];

          const installedFonts: string[] = [];
          const testString = 'mmmmmmmmmmlli';
          const testSize = '72px';
          const baseFont = 'monospace';

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) return [];

          context.font = `${testSize} ${baseFont}`;
          const baseWidth = context.measureText(testString).width;

          for (const font of fontList) {
            try {
              context.font = `${testSize} ${font}, ${baseFont}`;
              const width = context.measureText(testString).width;
              if (width !== baseWidth) {
                installedFonts.push(font);
              }
            } catch (e) {
              console.error(`Error testing font ${font}:`, e);
            }
          }

          return installedFonts;
        };

        // Helper function to detect color gamut support
        const detectColorGamut = () => {
          if (window.matchMedia('(color-gamut: rec2020)').matches) return 'rec2020';
          if (window.matchMedia('(color-gamut: p3)').matches) return 'p3';
          if (window.matchMedia('(color-gamut: srgb)').matches) return 'srgb';
          return 'default';
        };

        // Helper function to get screen refresh rate
        const getScreenRefreshRate = () => {
          if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
            return 60; // Default to 60 as we can't reliably detect actual refresh rate
          }
          return undefined;
        };

        // Helper function to detect virtual display
        const detectVirtualDisplay = () => {
          // This is a best-effort detection, not 100% reliable
          const { hardwareConcurrency, deviceMemory } = navigator as any;
          const lowResources = hardwareConcurrency <= 2 || deviceMemory <= 2;
          const hasTouch = 'ontouchstart' in window;
          const isVirtualized = lowResources && !hasTouch;
          return isVirtualized;
        };

        // Helper function to get storage quota
        const getStorageQuota = async () => {
          if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
              const storage = await navigator.storage.estimate();
              return {
                quota: storage.quota,
                usage: storage.usage,
                // Remove usageDetails as it's not a standard property
              };
            } catch (e) {
              console.error('Error getting storage quota:', e);
            }
          }
          return null;
        };

        // Helper function to get available permissions
        const getAvailablePermissions = async () => {
          if ('permissions' in navigator) {
            const permissions = [
              'geolocation',
              'notifications',
              'push',
              'midi',
              'camera',
              'microphone',
              'background-fetch',
              'background-sync',
              'clipboard-read',
              'clipboard-write',
              'payment-handler',
              'persistent-storage',
              'ambient-light-sensor',
              'accelerometer',
              'gyroscope',
              'magnetometer',
              'screen-wake-lock',
              'nfc'
            ];

            const results: Record<string, string> = {};
            for (const permission of permissions) {
              try {
                const status = await navigator.permissions.query({ name: permission as PermissionName });
                results[permission] = status.state;
              } catch (e) {
                results[permission] = 'unsupported';
              }
            }
            return results;
          }
          return null;
        };

        // Helper function to get media devices
        const getMediaDevices = async () => {
          if ('mediaDevices' in navigator) {
            try {
              const devices = await navigator.mediaDevices.enumerateDevices();
              return {
                audioInputs: devices.filter(d => d.kind === 'audioinput').length,
                audioOutputs: devices.filter(d => d.kind === 'audiooutput').length,
                videoInputs: devices.filter(d => d.kind === 'videoinput').length
              };
            } catch (e) {
              console.error('Error getting media devices:', e);
            }
          }
          return null;
        };

        // Helper function to get battery info
        const getBatteryInfo = async () => {
          if ('getBattery' in navigator) {
            try {
              const battery: any = await (navigator as any).getBattery();
              return {
                charging: battery.charging,
                level: battery.level,
                chargingTime: battery.chargingTime,
                dischargingTime: battery.dischargingTime
              };
            } catch (e) {
              console.error('Error getting battery info:', e);
            }
          }
          return null;
        };

        // Helper function to get detailed performance metrics
        const getDetailedPerformanceMetrics = () => {
          const metrics: Record<string, number> = {};
          if ('performance' in window) {
            try {
              const perfEntries = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
              if (perfEntries) {
                metrics.dnsLookup = perfEntries.domainLookupEnd - perfEntries.domainLookupStart;
                metrics.tcpConnection = perfEntries.connectEnd - perfEntries.connectStart;
                metrics.tlsNegotiation = perfEntries.requestStart - perfEntries.secureConnectionStart;
                metrics.serverResponse = perfEntries.responseStart - perfEntries.requestStart;
                metrics.contentDownload = perfEntries.responseEnd - perfEntries.responseStart;
                metrics.domInteractive = perfEntries.domInteractive - perfEntries.fetchStart;
                metrics.domComplete = perfEntries.domComplete - perfEntries.fetchStart;
                metrics.loadEvent = perfEntries.loadEventEnd - perfEntries.loadEventStart;
                metrics.totalPageLoad = perfEntries.loadEventEnd - perfEntries.fetchStart;
              }

              // Get paint timing metrics
              const paintMetrics = performance.getEntriesByType('paint');
              paintMetrics.forEach(paint => {
                metrics[paint.name] = paint.startTime;
              });

              // Get memory info if available
              if ((performance as any).memory) {
                metrics.jsHeapSizeLimit = (performance as any).memory.jsHeapSizeLimit;
                metrics.totalJSHeapSize = (performance as any).memory.totalJSHeapSize;
                metrics.usedJSHeapSize = (performance as any).memory.usedJSHeapSize;
              }
            } catch (e) {
              console.error('Error getting performance metrics:', e);
            }
          }
          return metrics;
        };

        // Function to detect system theme
        const detectSystemTheme = () => {
          if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
          }
          return 'light';
        };

        // Get system information
        const systemInfo = await getSystemInfo();
        console.log('System info collected:', systemInfo);

        // Get session information
        const sessionInfo = {
          startTime: Date.now(),
          newVisit: !localStorage.getItem('last_visit'),
          lastVisit: localStorage.getItem('last_visit'),
          visitCount: parseInt(localStorage.getItem('visit_count') || '0') + 1,
          entryPage: window.location.pathname,
          referrer: document.referrer,
          previousVisits: JSON.parse(localStorage.getItem('previous_visits') || '[]'),
          interactions: {}
        };

        console.log('Session info prepared:', sessionInfo);

        // Update local storage
        localStorage.setItem('last_visit', new Date().toISOString());
        localStorage.setItem('visit_count', sessionInfo.visitCount.toString());
        
        // Add current visit to previous visits
        const previousVisits = sessionInfo.previousVisits;
        previousVisits.push({
          timestamp: Date.now(),
          page: window.location.pathname
        });
        localStorage.setItem('previous_visits', JSON.stringify(previousVisits.slice(-10)));

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
          const errorData = await response.json();
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