import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../pages/authContext/AuthContext';
import useNoCache from '../../hooks/useNoCache';

/**
 * Component that protects routes from unauthorized access
 * Prevents access via back button after logout
 * Now also checks for email verification for family and donor users
 */
const ProtectedRoute = ({ children, requiredUserType = null, requireEmailVerification = false }) => {
  const { isAuthenticated, user, userType, loading } = useAuth();
  const navigate = useNavigate();
  
  // Apply cache prevention and back button protection
  useNoCache();

  useEffect(() => {
    // Don't check auth while loading
    if (loading) return;

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      console.log('🔒 ProtectedRoute: User not authenticated, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }

    // Check user type if specified
    if (requiredUserType && userType !== requiredUserType) {
      console.log(`🔒 ProtectedRoute: User type mismatch. Required: ${requiredUserType}, Actual: ${userType}`);
      
      // Redirect to appropriate dashboard based on user type
      switch (userType) {
        case 'donor':
          navigate('/donor-dashboard', { replace: true });
          break;
        case 'family':
          navigate('/family-dashboard', { replace: true });
          break;
        default:
          navigate('/login', { replace: true });
      }
      return;
    }

    // Check email verification if required
    if (requireEmailVerification && user && !user.emailVerified) {
      console.log('🔒 ProtectedRoute: Email verification required, redirecting to verification page');
      navigate('/verify-email', { replace: true });
      return;
    }
  }, [isAuthenticated, user, userType, loading, navigate, requiredUserType, requireEmailVerification]);

  // Don't render anything while loading
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  // Don't render if user type doesn't match
  if (requiredUserType && userType !== requiredUserType) {
    return null;
  }

  // Don't render if email verification is required but not completed
  if (requireEmailVerification && !user.emailVerified) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
