// Simple API test utility to verify integration
import ApiService from '../services/api';
import config from '../config/environment';

export const testApiIntegration = async () => {
  try {
    console.log('🧪 Testing API Integration...');
    
    // Test 1: Check if backend is running
    try {
      const response = await fetch(`${config.API_BASE_URL}/health`);
      if (response.ok) {
        console.log('✅ Backend server is running');
      } else {
        console.log('❌ Backend server responded with error');
      }
    } catch (error) {
      console.log('❌ Backend server is not running:', error.message);
      return false;
    }
    
    // Test 2: Check if we can make API calls
    try {
      // This should fail with 401 if not authenticated, which is expected
      await ApiService.getProfile();
      console.log('✅ API service is working (authenticated)');
    } catch (error) {
      if (error.message.includes('No token') || error.message.includes('Unauthorized')) {
        console.log('✅ API service is working (401 Unauthorized - expected for unauthenticated requests)');
      } else {
        console.log('❌ Unexpected API service error:', error.message);
      }
    }
    
    console.log('🎉 API Integration test completed');
    return true;
  } catch (error) {
    console.error('❌ API Integration test failed:', error);
    return false;
  }
};

// Auto-run test in development (only if not in production)
if (import.meta.env.DEV && !import.meta.env.PROD) {
  // Run test after a short delay to allow app to initialize
  // Only run if localStorage flag is set (to avoid spam in console)
  const shouldRunApiTest = localStorage.getItem('runApiTest') === 'true';
  if (shouldRunApiTest) {
    setTimeout(testApiIntegration, 2000);
    // Remove flag after running once
    localStorage.removeItem('runApiTest');
  }
}

// Export a manual trigger function for debugging
export const runApiTest = () => {
  console.log('🔧 Manually triggering API test...');
  testApiIntegration();
};