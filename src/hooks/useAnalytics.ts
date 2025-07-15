import { useEffect } from 'react';

export const useAnalytics = () => {
  useEffect(() => {
    const trackPageView = async () => {
      try {
        // Check if we've already tracked this session
        const hasTracked = sessionStorage.getItem('visit_tracked');
        if (hasTracked) return;

        // Collect network information
        const connection = (navigator as any).connection || 
                         (navigator as any).mozConnection || 
                         (navigator as any).webkitConnection;
        
        const networkType = connection ? 
          (connection.type === 'cellular' ? 
            `${connection.effectiveType} (${connection.type})` : 
            connection.type) : 
          'Unknown';

        // Enhanced network info
        const networkInfo = connection ? {
          downlink: `${connection.downlink} Mbps`,
          rtt: `${connection.rtt} ms`,
          saveData: connection.saveData ? 'On' : 'Off'
        } : null;

        // Collect browser information
        const browserInfo = getBrowserInfo();

        // Collect screen information
        const screenInfo = {
          resolution: `${window.screen.width}x${window.screen.height}`,
          colorDepth: `${window.screen.colorDepth}-bit`,
          orientation: window.screen.orientation.type,
          pixelRatio: window.devicePixelRatio
        };

        // System information
        const platform = navigator.platform;
        const language = navigator.language;
        const languages = navigator.languages;
        const memory = (navigator as any).deviceMemory;
        const cores = navigator.hardwareConcurrency;
        const maxTouchPoints = navigator.maxTouchPoints;

        // Time zone information
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const timeZoneOffset = new Date().getTimezoneOffset();

        // Feature detection
        const features = {
          cookies: navigator.cookieEnabled,
          localStorage: !!window.localStorage,
          serviceWorker: 'serviceWorker' in navigator,
          webGL: hasWebGL(),
          webP: await supportsWebP(),
          bluetooth: 'bluetooth' in navigator,
          battery: 'getBattery' in navigator,
          touch: 'ontouchstart' in window,
          pdf: hasAcrobatReader()
        };

        // Performance metrics
        const performance = getPerformanceMetrics();

        // Session information
        const session = {
          newVisit: !localStorage.getItem('returning_visitor'),
          visitCount: Number(localStorage.getItem('visit_count') || 0) + 1,
          lastVisit: localStorage.getItem('last_visit') || 'First Visit'
        };

        const analyticsData = {
          networkType,
          networkInfo,
          screenInfo,
          browserInfo,
          language,
          languages,
          platform,
          memory,
          cores,
          maxTouchPoints,
          timeZone,
          timeZoneOffset,
          features,
          performance,
          session
        };

        console.log('Sending analytics data:', analyticsData);

        // Try to send analytics with retries
        let retries = 3;
        let error;

        while (retries > 0) {
          try {
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

            // Success - update session data
            localStorage.setItem('returning_visitor', 'true');
            localStorage.setItem('visit_count', session.visitCount.toString());
            localStorage.setItem('last_visit', new Date().toISOString());
            sessionStorage.setItem('visit_tracked', 'true');
            
            console.log('Analytics sent successfully');
            return;
          } catch (e) {
            error = e;
            retries--;
            if (retries > 0) {
              console.log(`Analytics send failed, retrying... (${retries} attempts left)`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
            }
          }
        }

        // If we get here, all retries failed
        console.error('Failed to send analytics after all retries:', error);
      } catch (error) {
        console.error('Failed to collect or send analytics:', error);
      }
    };

    trackPageView();
  }, []);
};

function getBrowserInfo() {
  const ua = navigator.userAgent;
  let browserName = "Unknown";
  let browserVersion = "";
  let engine = "Unknown";

  // Detect browser engine
  if (ua.includes("Gecko/")) {
    engine = "Gecko";
  } else if (ua.includes("AppleWebKit/")) {
    engine = "WebKit";
  } else if (ua.includes("Trident/")) {
    engine = "Trident";
  }

  // Detect Chrome
  if (ua.includes("Chrome")) {
    browserName = "Chrome";
    browserVersion = ua.split("Chrome/")[1]?.split(" ")[0];
  }
  // Detect Firefox
  else if (ua.includes("Firefox")) {
    browserName = "Firefox";
    browserVersion = ua.split("Firefox/")[1];
  }
  // Detect Safari
  else if (ua.includes("Safari") && !ua.includes("Chrome")) {
    browserName = "Safari";
    browserVersion = ua.split("Version/")[1]?.split(" ")[0];
  }
  // Detect Edge
  else if (ua.includes("Edg")) {
    browserName = "Edge";
    browserVersion = ua.split("Edg/")[1];
  }
  // Detect Opera
  else if (ua.includes("OPR")) {
    browserName = "Opera";
    browserVersion = ua.split("OPR/")[1];
  }

  return {
    name: browserName,
    version: browserVersion,
    engine,
    userAgent: ua,
    vendor: navigator.vendor,
    appName: navigator.appName,
    appVersion: navigator.appVersion,
    platform: navigator.platform,
    product: navigator.product
  };
}

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && 
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

async function supportsWebP() {
  const webP = new Image();
  return new Promise((resolve) => {
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

function hasAcrobatReader() {
  try {
    const acrobat = navigator.plugins.namedItem('Chrome PDF Viewer') || 
                    navigator.plugins.namedItem('Adobe Acrobat');
    return !!acrobat;
  } catch {
    return false;
  }
}

function getPerformanceMetrics() {
  if (!window.performance) return null;

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (!navigation) return null;

  return {
    dnsLookup: Math.round(navigation.domainLookupEnd - navigation.domainLookupStart),
    tcpConnection: Math.round(navigation.connectEnd - navigation.connectStart),
    serverResponse: Math.round(navigation.responseStart - navigation.requestStart),
    pageLoad: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
    domInteractive: Math.round(navigation.domInteractive - navigation.fetchStart),
    domComplete: Math.round(navigation.domComplete - navigation.fetchStart),
    firstPaint: Math.round(performance.getEntriesByName('first-paint')[0]?.startTime || 0),
    firstContentfulPaint: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0)
  };
} 