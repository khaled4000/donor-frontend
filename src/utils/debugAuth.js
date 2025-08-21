// Debug utility for authentication issues
import config from '../config/environment';

export const debugAuth = () => {
  console.log('🔍 AUTH DEBUG - Current authentication state:');
  
  // Check localStorage
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  const userType = localStorage.getItem('userType');
  
  console.log('🔍 Token exists:', !!token);
  if (token) {
    console.log('🔍 Token length:', token.length);
    console.log('🔍 Token preview:', token.substring(0, 50) + '...');
    
    // Try to decode JWT payload (without verification)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('🔍 Token payload:', payload);
      console.log('🔍 Token expires at:', new Date(payload.exp * 1000));
      console.log('🔍 Token is expired:', Date.now() > payload.exp * 1000);
    } catch (error) {
      console.log('🔍 Could not decode token payload:', error.message);
    }
  }
  
  console.log('🔍 User data exists:', !!user);
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log('🔍 User data:', userData);
      console.log('🔍 Email verified:', userData.emailVerified);
      console.log('🔍 Role:', userData.role);
      console.log('🔍 User type:', userData.userType);
    } catch (error) {
      console.log('🔍 Could not parse user data:', error.message);
    }
  }
  
  console.log('🔍 User type:', userType);
  
  // Check if token is expired
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = Date.now() > payload.exp * 1000;
      if (isExpired) {
        console.log('❌ TOKEN EXPIRED - Token has expired and needs to be refreshed');
      } else {
        console.log('✅ TOKEN VALID - Token is still valid');
      }
    } catch (error) {
      console.log('❌ TOKEN INVALID - Could not decode token');
    }
  }
  
  return {
    hasToken: !!token,
    hasUser: !!user,
    hasUserType: !!userType,
    tokenExpired: token ? (() => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return Date.now() > payload.exp * 1000;
      } catch {
        return true;
      }
    })() : false
  };
};

// Test API call with current token
export const testApiCall = async () => {
  console.log('🧪 Testing API call with current token...');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('❌ No token found in localStorage');
    return false;
  }
  
  try {
    const response = await fetch(`${config.API_BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful:', data);
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ API call failed:', response.status, errorData);
      return false;
    }
  } catch (error) {
    console.log('❌ API call error:', error.message);
    return false;
  }
};

// Clear all authentication data
export const clearAuth = () => {
  console.log('🧹 Clearing all authentication data...');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userType');
  localStorage.removeItem('isAuthenticated');
  console.log('✅ Authentication data cleared');
};
