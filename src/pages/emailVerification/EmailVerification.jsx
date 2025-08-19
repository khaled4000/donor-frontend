import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import './EmailVerification.css';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    console.log('🔍 URL Parameters Debug:');
    console.log('- Token from URL:', token);
    console.log('- Email from URL:', email);
    console.log('- Full search params:', searchParams.toString());
    
    if (!token || !email) {
      console.log('❌ Missing required parameters');
      setStatus('error');
      setMessage('Invalid verification link. Missing token or email parameter. Please check your email and try again.');
      return;
    }

    verifyEmail();
  }, [token, email]);

  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === 'success' && countdown === 0) {
      navigate('/login');
    }
  }, [status, countdown, navigate]);

  const verifyEmail = async () => {
    try {
      setStatus('verifying');
      setMessage('Verifying your email address...');

      console.log('🔍 Verification Debug - Token:', token);
      console.log('🔍 Verification Debug - Email:', email);

      const response = await ApiService.verifyEmail(token, email);
      
      if (response.message) {
        setStatus('success');
        setMessage('Email verified successfully! You can now log in to your account.');
        
        // Store the new token if provided
        if (response.token) {
          // Use namespaced storage consistent with AuthContext
          const { regularAuthStorage } = await import('../../utils/authStorage');
          regularAuthStorage.setAuth(response.token, response.user, response.user?.userType || response.user?.role);
        }
      } else {
        setStatus('error');
        setMessage('Verification failed. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setStatus('error');
      
      // Extract error message from different possible formats
      let errorMessage = 'Verification failed. Please check your link and try again.';
      
      if (error.message) {
        // Direct error message from ApiService
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        // Traditional axios-style error
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setMessage(errorMessage);
    }
  };

  const resendVerification = async () => {
    try {
      setMessage('Sending verification email...');
      await ApiService.resendVerification(email);
      setMessage('Verification email sent! Please check your inbox.');
    } catch (error) {
      console.error('Resend verification error:', error);
      
      // Extract error message from different possible formats
      let errorMessage = 'Failed to resend verification email. Please try again.';
      
      if (error.message) {
        // Direct error message from ApiService
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        // Traditional axios-style error
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setMessage(errorMessage);
    }
  };

  const goToLogin = () => {
    navigate('/login');
  };

  if (status === 'verifying') {
    return (
      <div className="email-verification">
        <div className="verification-container">
          <div className="verification-header">
            <h1>🔍 Verifying Your Email</h1>
            <p>Please wait while we verify your email address...</p>
          </div>
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
          <p className="verification-message">{message}</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="email-verification">
        <div className="verification-container success">
          <div className="verification-header">
            <h1>✅ Email Verified!</h1>
            <p>Your email has been successfully verified.</p>
          </div>
          <div className="success-icon">🎉</div>
          <p className="verification-message">{message}</p>
          <p className="redirect-message">
            Redirecting to login page in {countdown} seconds...
          </p>
          <button className="login-button" onClick={goToLogin}>
            Go to Login Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="email-verification">
      <div className="verification-container error">
        <div className="verification-header">
          <h1>❌ Verification Failed</h1>
          <p>We couldn't verify your email address.</p>
        </div>
        <div className="error-icon">⚠️</div>
        <p className="verification-message">{message}</p>
        
        <div className="verification-actions">
          <button className="resend-button" onClick={resendVerification}>
            Resend Verification Email
          </button>
          <button className="login-button" onClick={goToLogin}>
            Go to Login
          </button>
        </div>
        
        <div className="help-text">
          <p>If you continue to have issues:</p>
          <ul>
            <li>Check that you clicked the link from your email</li>
            <li>Make sure the link hasn't expired (24 hours)</li>
            <li>Try copying and pasting the link into your browser</li>
            <li>Ensure the URL contains both 'token' and 'email' parameters</li>
            <li>Contact support if the problem persists</li>
          </ul>
          {(!token || !email) && (
            <div className="debug-info">
              <p><strong>Debug Info:</strong></p>
              <p>Current URL: {window.location.href}</p>
              <p>Expected format: {window.location.origin}/verify-email?token=YOUR_TOKEN&email=YOUR_EMAIL</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
