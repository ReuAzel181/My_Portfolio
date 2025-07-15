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

        // Get system information
        const systemInfo = {
          platform: navigator.platform,
          userAgent: navigator.userAgent,
          language: navigator.language,
          screen: {
            width: window.screen.width,
            height: window.screen.height,
            resolution: `${window.screen.width}x${window.screen.height}`,
            colorDepth: window.screen.colorDepth,
            orientation: window.screen.orientation?.type || 'unknown'
          },
          browser: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            online: navigator.onLine,
            cookies: navigator.cookieEnabled
          }
        };

        console.log('System info collected:', systemInfo);

        // Get session information
        const sessionInfo = {
          startTime: Date.now(),
          newVisit: !localStorage.getItem('last_visit'),
          lastVisit: localStorage.getItem('last_visit'),
          visitCount: parseInt(localStorage.getItem('visit_count') || '0') + 1,
          entryPage: window.location.pathname,
          referrer: document.referrer
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