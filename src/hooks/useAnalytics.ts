import { useEffect } from 'react';

export const useAnalytics = () => {
  useEffect(() => {
    const trackPageView = async () => {
      try {
        // Check if we've already tracked this session
        const hasTracked = sessionStorage.getItem('visit_tracked');
        if (hasTracked) return;

        // Track the visit
        await fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Mark this session as tracked
        sessionStorage.setItem('visit_tracked', 'true');
      } catch (error) {
        console.error('Failed to track visit:', error);
      }
    };

    trackPageView();
  }, []);
}; 