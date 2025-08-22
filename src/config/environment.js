// Environment Configuration
// This file manages environment-specific settings for the frontend

const ENV = import.meta.env.MODE || 'development';

// Environment-specific configurations
const configs = {
  development: {
    API_BASE_URL: 'https://donor-backend-dxxd.onrender.com/api', // Temporarily use deployed backend
    FRONTEND_URL: 'http://localhost:5173',
    DEBUG_MODE: true,
  },
  production: {
    API_BASE_URL: 'https://donor-backend-dxxd.onrender.com/api',
    FRONTEND_URL: process.env.VITE_FRONTEND_URL || 'https://donor-frontend1.onrender.com',
    DEBUG_MODE: false,
  },
  staging: {
    API_BASE_URL: 'https://donor-backend-dxxd.onrender.com/api',
    FRONTEND_URL: 'https://donor-frontend1.onrender.com',
    DEBUG_MODE: true,
  }
};

// Get current environment config
const currentConfig = configs[ENV] || configs.development;

// Environment variables that can be overridden
const envOverrides = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || currentConfig.API_BASE_URL,
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || currentConfig.FRONTEND_URL,
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true' || currentConfig.DEBUG_MODE,
};

// Export the final configuration
export const config = {
  ...currentConfig,
  ...envOverrides,
  ENV,
  isDevelopment: ENV === 'development',
  isProduction: ENV === 'production',
  isStaging: ENV === 'staging',
};

// Log configuration in development
if (config.isDevelopment) {
  console.log('🔧 Frontend Environment Configuration:', {
    ENV: config.ENV,
    API_BASE_URL: config.API_BASE_URL,
    FRONTEND_URL: config.FRONTEND_URL,
    DEBUG_MODE: config.DEBUG_MODE,
  });
}

export default config;
