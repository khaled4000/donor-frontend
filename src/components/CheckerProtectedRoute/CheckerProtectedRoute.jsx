import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAuthStorage } from '../../utils/authStorage';
import useNoCache from '../../hooks/useNoCache';
import config from '../../config/environment';

/**
 * Component that protects checker routes from unauthorized access
 * Only allows users with 'checker' role to access
 * Redirects admin users to admin dashboard and other users to appropriate routes
 */
const CheckerProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Apply cache prevention and back button protection
  useNoCache();

  useEffect(() => {
    let isMounted = true;
    
    const checkCheckerAuth = async () => {
      try {
        const authData = adminAuthStorage.getAuth();
        
        if (!authData.isAuthenticated || !authData.token) {
          if (isMounted) {
            console.log('🔒 CheckerProtectedRoute: Not authenticated, redirecting to login');
            setIsAuthenticated(false);
            setIsVerifying(false);
            navigate('/login', { replace: true });
          }
          return;
        }

        // Verify token is still valid with backend
        try {
          const response = await fetch(`${config.API_BASE_URL}/admin/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${authData.token}`
            }
          });

          if (!response.ok) {
            if (isMounted) {
              console.log('🔒 CheckerProtectedRoute: Token invalid, clearing auth and redirecting');
              adminAuthStorage.clearAuth();
              setIsAuthenticated(false);
              setIsVerifying(false);
              navigate('/login', { replace: true });
            }
            return;
          }

          const data = await response.json();
          
          // Check if user has checker role
          if (data.admin.role !== 'checker') {
            if (isMounted) {
              console.log('🔒 CheckerProtectedRoute: User is not a checker, redirecting based on role');
              if (data.admin.role === 'admin') {
                navigate('/admin/dashboard', { replace: true });
              } else {
                navigate('/login', { replace: true });
              }
              setIsAuthenticated(false);
              setIsVerifying(false);
            }
            return;
          }

          if (isMounted) {
            setIsAuthenticated(true);
            setIsVerifying(false);
          }
        } catch (error) {
          if (isMounted) {
            console.log('🔒 CheckerProtectedRoute: Token verification failed, redirecting');
            adminAuthStorage.clearAuth();
            setIsAuthenticated(false);
            setIsVerifying(false);
            navigate('/login', { replace: true });
          }
          return;
        }
      } catch (error) {
        if (isMounted) {
          console.error('🔒 CheckerProtectedRoute: Error in auth check:', error);
          setIsAuthenticated(false);
          setIsVerifying(false);
          navigate('/login', { replace: true });
        }
      }
    };

    checkCheckerAuth();

    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Show loading state while verifying
  if (isVerifying) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '16px',
        color: '#666'
      }}>
        Verifying checker authentication...
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return children;
};

export default CheckerProtectedRoute;
