import { useEffect } from 'react';

/**
 * Hook to prevent browser caching and back button access after logout
 * Use this in protected pages/components
 */
const useNoCache = () => {
  useEffect(() => {
    // Prevent browser caching for security
    if (typeof window !== 'undefined') {
      // Set cache control headers via meta tags
      const metaCacheControl = document.createElement('meta');
      metaCacheControl.setAttribute('http-equiv', 'Cache-Control');
      metaCacheControl.setAttribute('content', 'no-cache, no-store, must-revalidate');
      document.head.appendChild(metaCacheControl);

      const metaPragma = document.createElement('meta');
      metaPragma.setAttribute('http-equiv', 'Pragma');
      metaPragma.setAttribute('content', 'no-cache');
      document.head.appendChild(metaPragma);

      const metaExpires = document.createElement('meta');
      metaExpires.setAttribute('http-equiv', 'Expires');
      metaExpires.setAttribute('content', '0');
      document.head.appendChild(metaExpires);

      // Prevent back button navigation
      window.history.pushState(null, '', window.location.href);
      
      const handlePopState = (event) => {
        window.history.pushState(null, '', window.location.href);
      };

      window.addEventListener('popstate', handlePopState);
      
      // Cleanup
      return () => {
        window.removeEventListener('popstate', handlePopState);
        document.head.removeChild(metaCacheControl);
        document.head.removeChild(metaPragma);
        document.head.removeChild(metaExpires);
      };
    }
  }, []);
};

export default useNoCache;
