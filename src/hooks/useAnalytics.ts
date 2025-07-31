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
              renderer: gl.getParameter(gl.RENDERER)
            } : null;

            // Get user agent data for enhanced system detection
            const userAgentData = (navigator as any).userAgentData;
            let systemName = 'Unknown';
            let systemManufacturer = 'Unknown';
            let userName = 'Not Available';

            // Try to get system information from various sources
            try {
              // Get OS name from user agent with better Windows 11 detection
              const ua = navigator.userAgent.toLowerCase();
              if (ua.includes('windows nt')) {
                const version = ua.match(/windows nt ([\d.]+)/);
                if (version) {
                  const winVersion = parseFloat(version[1]);
                  if (winVersion >= 10.0) {
                    // Check for Windows 11 indicators
                    if (ua.includes('edg/') || ua.includes('chrome/') && 
                        (navigator.userAgent.includes('Windows NT 10.0') && 
                         navigator.userAgent.includes('Win64; x64'))) {
                      // Additional check for Windows 11
                      systemName = navigator.userAgent.includes('Windows NT 10.0') ? 'Windows 11' : `Windows ${version[1]}`;
                    } else {
                      systemName = `Windows ${version[1]}`;
                    }
                  } else {
                    systemName = `Windows ${version[1]}`;
                  }
                } else {
                  systemName = 'Windows';
                }
              } else if (ua.includes('mac os x')) {
                const version = ua.match(/mac os x ([\d_]+)/);
                systemName = version ? `macOS ${version[1].replace(/_/g, '.')}` : 'macOS';
              } else if (ua.includes('android')) {
                const version = ua.match(/android ([\d.]+)/);
                systemName = version ? `Android ${version[1]}` : 'Android';
              } else if (ua.includes('iphone os')) {
                const version = ua.match(/iphone os ([\d_]+)/);
                systemName = version ? `iOS ${version[1].replace(/_/g, '.')}` : 'iOS';
              } else if (ua.includes('linux')) {
                systemName = 'Linux';
              }

              // Enhanced manufacturer detection from GPU renderer
              if (gpuInfo?.renderer) {
                const renderer = gpuInfo.renderer.toLowerCase();
                if (renderer.includes('machenike') || renderer.includes('mechrevo')) {
                  systemManufacturer = 'MACHENIKE';
                } else if (renderer.includes('nvidia') && renderer.includes('laptop')) {
                  // Check for gaming laptop brands in GPU info
                  if (renderer.includes('asus')) {
                    systemManufacturer = 'ASUS';
                  } else if (renderer.includes('msi')) {
                    systemManufacturer = 'MSI';
                  } else if (renderer.includes('dell')) {
                    systemManufacturer = 'Dell';
                  } else if (renderer.includes('hp')) {
                    systemManufacturer = 'HP';
                  } else if (renderer.includes('lenovo')) {
                    systemManufacturer = 'Lenovo';
                  }
                }
              }

              // Try to get user info from environment (very limited)
              try {
                const platform = userAgentData?.platform || navigator.platform;
                // Try to extract username from any available source
                // Note: This is extremely limited due to browser security
                if (platform) {
                  userName = 'Browser User'; // Fallback since we can't access Windows username
                }
              } catch (e) {
                userName = 'Privacy Protected';
              }
            } catch (e) {
              console.log('Could not get detailed system info:', e);
            }

            // Get enhanced hardware info
            const hardwareInfo = {
              cores: navigator.hardwareConcurrency,
              memory: (navigator as any).deviceMemory,
              platform: navigator.platform,
              maxTouchPoints: navigator.maxTouchPoints,
              primaryInput: matchMedia('(pointer:fine)').matches ? 'mouse' : 
                           matchMedia('(pointer:coarse)').matches ? 'touch' : 'none'
            };

            return {
              gpu: gpuInfo,
              hardware: hardwareInfo,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              locale: navigator.language,
              platform: navigator.platform,
              theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
              systemName,
              systemManufacturer,
              userName,
              userAgentData: userAgentData ? {
                brands: userAgentData.brands,
                mobile: userAgentData.mobile,
                platform: userAgentData.platform
              } : null,
              vendor: (navigator as any).vendor || 'Unknown',
              architecture: (navigator as any).cpuClass || (navigator as any).oscpu || 'Unknown'
            };
          } catch (error) {
            console.error('Error getting system info:', error);
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
          previousVisits: JSON.parse(localStorage.getItem('previous_visits') || '[]')
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
  }, []);
}; 