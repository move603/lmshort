/**
 * Vercel Web Analytics Integration
 * This module initializes Vercel Web Analytics on the client side
 * 
 * Usage in HTML (inline script):
 * <script>
 *   import { initializeAnalytics } from '/lib/analytics.js';
 *   initializeAnalytics();
 * </script>
 * 
 * Or via dynamic import:
 * <script defer>
 *   (async () => {
 *     const { initializeAnalytics } = await import('/lib/analytics.js');
 *     initializeAnalytics();
 *   })();
 * </script>
 * 
 * Reference: https://vercel.com/docs/analytics
 */

/**
 * Initialize Vercel Web Analytics
 * This function should be called once when the application loads on the client side
 * 
 * Note: 
 * - This requires the @vercel/analytics package to be installed
 * - Must run on the client side only
 * - Does not include route support
 * - Fails silently if analytics fails to avoid breaking the app
 * - Can be called multiple times safely (subsequent calls are no-ops)
 * 
 * @returns {Promise<void>}
 */
async function initializeAnalytics() {
  // Skip if already initialized
  if (typeof window !== 'undefined' && window.__VERCEL_ANALYTICS_INITIALIZED__) {
    return;
  }

  try {
    // Import the analytics module from the installed package
    const { inject } = await import('@vercel/analytics');
    
    // Initialize analytics with default configuration
    inject();
    
    // Mark as initialized to avoid duplicate calls
    if (typeof window !== 'undefined') {
      window.__VERCEL_ANALYTICS_INITIALIZED__ = true;
    }
    
    console.log('✓ Vercel Web Analytics initialized successfully');
  } catch (error) {
    console.warn('⚠ Failed to initialize Vercel Web Analytics:', error.message);
    // Fail silently - don't break the app if analytics fails
  }
}

/**
 * Initialize Vercel Web Analytics synchronously for inline scripts
 * This is a wrapper that handles the async initialization
 */
function init() {
  if (typeof document !== 'undefined') {
    // Use defer to ensure DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeAnalytics);
    } else {
      initializeAnalytics();
    }
  }
}

// Export for ES modules
export { initializeAnalytics, init };

// Export for CommonJS (for Node.js if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initializeAnalytics, init };
}
