import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAuthStorage } from '../../utils/authStorage';
import useNoCache from '../../hooks/useNoCache';

/**
 * Component that protects admin routes from unauthorized access
 * Prevents access via back button after logout
 * Only allows users with the specified requiredRole to access
 */
const AdminProtectedRoute = ({ children, requiredRole = 'admin' }) => {
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Apply cache prevention and back button protection
  useNoCache();

  useEffect(() => {
    let isMounted = true;
    
    const checkAdminAuth = async () => {
      try {
        const authData = adminAuthStorage.getAuth();
        
        if (!authData.isAuthenticated || !authData.token) {
          if (isMounted) {
            console.log('🔒 AdminProtectedRoute: Admin not authenticated, redirecting to login');
            setIsAuthenticated(false);
            setIsVerifying(false);
            navigate('/login', { replace: true });
          }
          return;
        }

        // Verify token is still valid with backend
        try {
          const response = await fetch('http://localhost:5000/api/admin/auth/verify', {
            headers: {
              'Authorization': `Bearer ${authData.token}`
            }
          });

          if (!response.ok) {
            if (isMounted) {
              console.log('🔒 AdminProtectedRoute: Token invalid, clearing auth and redirecting');
              adminAuthStorage.clearAuth();
              setIsAuthenticated(false);
              setIsVerifying(false);
              navigate('/login', { replace: true });
            }
            return;
          }

          const data = await response.json();
          
          // Check if user has the required role
          if (data.admin.role !== requiredRole) {
            if (isMounted) {
              console.log(`🔒 AdminProtectedRoute: User role ${data.admin.role} does not match required role ${requiredRole}, redirecting`);
              if (data.admin.role === 'checker') {
                navigate('/checker-dashboard', { replace: true });
              } else if (data.admin.role === 'admin') {
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
            console.log('🔒 AdminProtectedRoute: Token verification failed, redirecting');
            adminAuthStorage.clearAuth();
            setIsAuthenticated(false);
            setIsVerifying(false);
            navigate('/login', { replace: true });
          }
          return;
        }
      } catch (error) {
        if (isMounted) {
          console.error('🔒 AdminProtectedRoute: Error in auth check:', error);
          setIsAuthenticated(false);
          setIsVerifying(false);
          navigate('/login', { replace: true });
        }
      }
    };

    checkAdminAuth();

    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
  }, [navigate, requiredRole]);

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
        Verifying {requiredRole} authentication...
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return children;
};

export default AdminProtectedRoute;
