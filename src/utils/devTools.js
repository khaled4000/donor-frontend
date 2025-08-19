// Developer Tools Utility
// Use these functions in browser console for debugging

import { runApiTest } from './apiTest';

// Make debugging functions available globally in development
if (import.meta.env.DEV) {
  window.devTools = {
    // Enable API debug logging
    enableApiDebug: () => {
      localStorage.setItem('apiDebug', 'true');
      console.log('✅ API debug logging enabled. Refresh the page to see debug logs.');
    },

    // Disable API debug logging
    disableApiDebug: () => {
      localStorage.removeItem('apiDebug');
      console.log('✅ API debug logging disabled.');
    },

    // Run API integration test
    testApi: () => {
      console.log('🧪 Running API integration test...');
      runApiTest();
    },

    // Enable API test on next page load
    enableApiTestOnLoad: () => {
      localStorage.setItem('runApiTest', 'true');
      console.log('✅ API test will run on next page load. Refresh the page.');
    },

    // Clear all localStorage data
    clearStorage: () => {
      localStorage.clear();
      sessionStorage.clear();
      console.log('✅ All localStorage and sessionStorage cleared.');
    },

    // Show current storage data
    showStorage: () => {
      console.log('📦 LocalStorage:', { ...localStorage });
      console.log('📦 SessionStorage:', { ...sessionStorage });
    },

    // Help message
    help: () => {
      console.log(`
🔧 Developer Tools Available:
- devTools.enableApiDebug()     - Enable API request/response logging
- devTools.disableApiDebug()    - Disable API debug logging  
- devTools.testApi()            - Run API integration test
- devTools.enableApiTestOnLoad() - Enable API test on page refresh
- devTools.clearStorage()       - Clear all storage data
- devTools.showStorage()        - Show current storage contents
- devTools.help()               - Show this help message

Example usage:
> devTools.enableApiDebug()
> devTools.testApi()
      `);
    }
  };

  // Show help message on load
  console.log('🔧 Developer tools loaded! Type devTools.help() for available commands.');
}

export default window.devTools;
