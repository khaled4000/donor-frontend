import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAuthStorage } from '../../utils/authStorage';

/**
 * Component that redirects authenticated admin users to the appropriate dashboard
 * Prevents admins from accessing regular user pages
 * Redirects based on user role (admin vs checker)
 */
const AdminRedirect = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAuth = async () => {
      const authData = adminAuthStorage.getAuth();
      
      if (authData.isAuthenticated && authData.token) {
        try {
          // Verify token and get user role
          const response = await fetch('http://localhost:5000/api/admin/auth/verify', {
            headers: {
              'Authorization': `Bearer ${authData.token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            const userRole = data.admin.role;
            
            console.log('🔒 AdminRedirect: Admin user detected, role:', userRole);
            
            // Redirect based on role
            if (userRole === 'admin') {
              navigate('/admin/dashboard', { replace: true });
            } else if (userRole === 'checker') {
              navigate('/checker-dashboard', { replace: true });
            } else {
              // Fallback to admin dashboard
              navigate('/admin/dashboard', { replace: true });
            }
            return;
          } else {
            // Token invalid, clear auth
            adminAuthStorage.clearAuth();
          }
        } catch (error) {
          console.error('AdminRedirect: Error verifying token:', error);
          // Clear invalid auth on error
          adminAuthStorage.clearAuth();
        }
      }
    };

    checkAdminAuth();
  }, [navigate]);

  return children;
};

export default AdminRedirect;
