/**
 * Initialize Vercel Speed Insights
 * This script must run on the client side only
 * It loads the Speed Insights tracking script for performance monitoring
 */

(function() {
  // Only run in the browser environment
  if (typeof window === 'undefined') {
    return;
  }

  // Initialize Speed Insights queue if not already done
  if (!window.si) {
    window.si = function(...args) {
      (window.siq = window.siq || []).push(args);
    };
  }

  // Dynamically load the Speed Insights script
  // This approach works for static HTML sites
  const script = document.createElement('script');
  script.src = '/_vercel/speed-insights/script.js';
  script.defer = true;
  script.dataset.sdkn = '@vercel/speed-insights';
  document.head.appendChild(script);
})();
