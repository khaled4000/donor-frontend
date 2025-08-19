// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import ApiService from '../../services/api';
import { regularAuthStorage } from '../../utils/authStorage';
import './authContext.css';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      const authData = regularAuthStorage.getAuth();
      
      if (authData.isAuthenticated) {
        try {
          // Verify token is still valid by fetching user profile
          const response = await ApiService.getProfile();
          const userData = response.user;
          
          setIsAuthenticated(true);
          setUser(userData);
          setUserType(userData.userType || userData.role);
          
          // Update storage with fresh user data
          regularAuthStorage.setUser(userData);
        } catch (error) {
          console.error('Token validation failed:', error);
          
          // Only clear auth if it's actually a token/auth issue
          if (error.message && (
            error.message.includes('token') || 
            error.message.includes('authorization denied') ||
            error.message.includes('401') ||
            error.message.includes('Authentication failed')
          )) {
            // Clear invalid session
            setIsAuthenticated(false);
            setUser(null);
            setUserType(null);
            regularAuthStorage.clearAuth();
          } else {
            // For other errors (network, server), keep the session but mark as not authenticated
            setIsAuthenticated(false);
            setUser(null);
            setUserType(null);
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await ApiService.login({ email, password });
      
      const userData = response.user;
      const token = response.token;
      
      setIsAuthenticated(true);
      setUser(userData);
      setUserType(userData.userType || userData.role);
      
      // Persist authentication state using namespaced storage
      regularAuthStorage.setAuth(token, userData, userData.userType || userData.role);
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      
      // Handle specific error cases
      if (error.message && error.message.includes('verify your email')) {
        // Clear any existing invalid tokens
        regularAuthStorage.clearAuth();
        
        // Show helpful error message
        const enhancedError = new Error('Email verification required. Please check your inbox and verify your email before logging in.');
        enhancedError.requiresVerification = true;
        enhancedError.email = email;
        throw enhancedError;
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await ApiService.register(userData);
      
      const newUser = response.user;
      const token = response.token;
      
      setIsAuthenticated(true);
      setUser(newUser);
      setUserType(newUser.userType || newUser.role);
      
      // Persist authentication state using namespaced storage
      regularAuthStorage.setAuth(token, newUser, newUser.userType || newUser.role);
      
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updateData) => {
    try {
      const response = await ApiService.updateProfile(updateData);
      const updatedUser = response.user;
      
      setUser(updatedUser);
      regularAuthStorage.setUser(updatedUser);
      
      return response;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('🔓 AuthContext: Logging out user');
    
    setIsAuthenticated(false);
    setUser(null);
    setUserType(null);
    
    // Clear authentication state using namespaced storage
    regularAuthStorage.clearAuth();
    
    // Clear browser cache and session storage for security
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      
      // Prevent back button navigation to cached pages
      window.history.pushState(null, '', window.location.href);
      
      // Add event listener to prevent back navigation
      const handlePopState = () => {
        window.history.pushState(null, '', window.location.href);
      };
      
      window.addEventListener('popstate', handlePopState);
      
      // Remove listener after a short delay
      setTimeout(() => {
        window.removeEventListener('popstate', handlePopState);
      }, 1000);
    }
  };

  const value = {
    isAuthenticated,
    user,
    userType,
    loading,
    login,
    register,
    updateProfile,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
