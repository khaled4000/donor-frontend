import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../authContext/AuthContext';
import { adminAuthStorage } from '../../utils/authStorage';
import Navbar from '../../components/Navbar/Navbar';
import './Login.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginAttempt, setLoginAttempt] = useState('first'); // 'first', 'admin', 'failed'

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // First, try regular user login
      if (loginAttempt === 'first') {
        try {
          console.log('🔐 LOGIN - Attempting regular user login...');
          const response = await login(formData.email, formData.password);
          
          // Regular user login successful
          const userRole = response.user.role;
          console.log('🔐 LOGIN - Regular user login successful, role:', userRole);
          
          // Redirect based on role
          if (userRole === 'donor') {
            navigate('/donor-dashboard', { replace: true });
          } else if (userRole === 'family') {
            navigate('/family-dashboard', { replace: true });
          } else if (userRole === 'admin' || userRole === 'checker') {
            // For admin/checker users, we need to get an admin session token
            // Try admin login directly to get proper admin session
            setLoginAttempt('admin');
            await handleAdminLogin();
          }
          return;
          
        } catch (regularLoginError) {
          console.log('🔐 LOGIN - Regular login failed:', regularLoginError.message);
          
          // Check if it's an email verification issue
          if (regularLoginError.message && regularLoginError.message.includes('verify your email')) {
            setError('Please verify your email address before logging in. Check your inbox for a verification link.');
            setIsLoading(false);
            return;
          }
          
          // Try admin login next
          setLoginAttempt('admin');
          await handleAdminLogin();
        }
      } else if (loginAttempt === 'admin') {
        // Try admin login
        await handleAdminLogin();
      }
    } catch (error) {
      console.error('🔐 LOGIN - Login error:', error);
      setError('Login failed. Please check your credentials and try again.');
      setLoginAttempt('failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    try {
      console.log('🔐 LOGIN - Attempting admin login...');
      
      const adminResponse = await fetch('http://localhost:5000/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.email,
          password: formData.password
        })
      });

      const adminData = await adminResponse.json();

      if (adminResponse.ok) {
        // Admin login successful
        const userRole = adminData.admin.role;
        console.log('🔐 LOGIN - Admin login successful, role:', userRole);
        
        // Store admin authentication
        adminAuthStorage.setAuth(adminData.token, adminData.admin, adminData.admin.role);
        
        // Redirect directly to appropriate dashboard based on role
        if (userRole === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else if (userRole === 'checker') {
          navigate('/checker-dashboard', { replace: true });
        } else {
          navigate('/admin/dashboard', { replace: true });
        }
        return;
      } else {
        // Admin login also failed
        console.log('🔐 LOGIN - Admin login failed:', adminData.message);
        
        // If both logins failed, show appropriate error
        if (loginAttempt === 'admin') {
          if (adminData.message.includes('Invalid credentials')) {
            setError('Invalid email or password. Please check your credentials and try again.');
          } else {
            setError(adminData.message || 'Login failed. Please try again.');
          }
          setLoginAttempt('failed');
        }
      }
    } catch (adminLoginError) {
      console.error('🔐 LOGIN - Admin login error:', adminLoginError);
      
      if (loginAttempt === 'admin') {
        setError('Network error. Please check your connection and try again.');
        setLoginAttempt('failed');
      }
    }
  };

  const resetLogin = () => {
    setLoginAttempt('first');
    setError('');
    setFormData({ email: '', password: '' });
  };

  return (
    <div className="login-page">
      <Navbar />
      <section className="login-section">
        <div className="container">
          <div className="login-container">
            <div className="login-header">
              <h1>
                <i className="fas fa-sign-in-alt"></i>
                Welcome Back
              </h1>
              <p>Sign in to your account to continue helping rebuild South Lebanon</p>
            </div>

            {loginAttempt === 'admin' && (
              <div className="alert alert-info">
                <i className="fas fa-info-circle"></i>
                Trying administrator login...
              </div>
            )}

            <div className="login-form">
              {error && (
                <div className="alert alert-error">
                  <i className="fas fa-exclamation-triangle"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="email">
                    <i className="fas fa-envelope"></i>
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your email address"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">
                    <i className="fas fa-lock"></i>
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your password"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="login-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        {loginAttempt === 'admin' ? 'Trying Admin Login...' : 'Signing In...'}
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt"></i>
                        Sign In
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {loginAttempt === 'failed' && (
              <div className="login-actions">
                <button onClick={resetLogin} className="reset-btn">
                  <i className="fas fa-redo"></i>
                  Try Again
                </button>
              </div>
            )}

            <div className="login-footer">
              <p>
                Don't have an account?
                <a href="/register" className="register-link">
                  Create one here
                </a>
              </p>

              <div className="login-help">
                <a href="/forgot-password" className="forgot-link">
                  <i className="fas fa-question-circle"></i>
                  Forgot your password?
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LoginPage;
