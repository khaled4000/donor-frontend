import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../authContext/AuthContext';
import Navbar from '../../components/Navbar/Navbar';
import './Register.css';


const RegisterPage = () => {
  const [userType, setUserType] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { register } = useAuth();

  const userTypes = [
    {
      type: 'family',
      title: 'Victim',
      description: 'Submit information about your destroyed home',
      icon: 'fas fa-users',
      color: '#ed1c24'
    },
    {
      type: 'donor',
      title: 'Donor',
      description: 'Help families by providing financial support',
      icon: 'fas fa-heart',
      color: '#2a9d8f'
    }
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password) {
      setAlertMessage('Please fill in all required fields!');
      setAlertType('error');
      setShowAlert(true);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setAlertMessage('Passwords do not match!');
      setAlertType('error');
      setShowAlert(true);
      return;
    }

    if (formData.password.length < 6) {
      setAlertMessage('Password must be at least 6 characters long!');
      setAlertType('error');
      setShowAlert(true);
      return;
    }

    setIsLoading(true);
    
    try {
      // Create user data for API
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: userType, // API expects 'role' field
        address: '' // Optional field
      };

      // Use the API-based register from AuthContext
      const response = await register(userData);
      
      // Check if email verification is required
      if (response.requiresVerification) {
        setAlertMessage('Registration successful! Please check your email to verify your account before accessing your dashboard. You can verify your email from any device.');
        setAlertType('success');
        setShowAlert(true);
        
        // Don't redirect - just show the message and let user stay on the page
        // User can verify email from another device if needed
      } else {
        setAlertMessage('Registration successful! Redirecting to your dashboard...');
        setAlertType('success');
        setShowAlert(true);
        
        // Auto-redirect to appropriate dashboard based on user type
        setTimeout(() => {
          if (userType === 'family') {
            navigate('/family-dashboard', { replace: true });
          } else if (userType === 'donor') {
            navigate('/donor-dashboard', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        }, 1500);
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific error cases more gracefully
      let errorMessage = error.message || 'Registration failed. Please try again.';
      
      if (error.message && error.message.includes('User already exists')) {
        errorMessage = 'An account with this email already exists. Please try logging in instead, or use a different email address.';
      } else if (error.message && error.message.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message && error.message.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message && error.message.includes('Server returned invalid JSON')) {
        errorMessage = 'Server error. Please try again later or contact support if the problem persists.';
      }
      
      setAlertMessage(errorMessage);
      setAlertType('error');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-hide alerts after 5 seconds
  React.useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  if (!userType) {
    return (
      <div className="register-page">
        <Navbar />
        <section className="register-section">
          <div className="container">
            <div className="register-header">
              <h1>
                <i className="fas fa-user-plus"></i>
                Join Our Community
              </h1>
              <p>Choose your role to get started with helping rebuild South Lebanon</p>
            </div>
            
            <div className="user-types-grid">
              {userTypes.map((type) => (
                <div 
                  key={type.type}
                  className="user-type-card"
                  onClick={() => setUserType(type.type)}
                  style={{'--card-color': type.color}}
                >
                  <div className="user-type-icon">
                    <i className={type.icon}></i>
                  </div>
                  <h3>{type.title}</h3>
                  <p>{type.description}</p>
                  <button className="select-btn">
                    Register as {type.title}
                  </button>
                </div>
              ))}
            </div>
            
            <div className="register-footer">
              <p>
                Already have an account? 
                <Link to="/login" className="login-link">Sign in here</Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="register-page">
      <Navbar />
      <section className="form-section">
        <div className="container">
          <div className="form-container">
            <div className="form-header">
              <h2>
                <i className={userTypes.find(t => t.type === userType)?.icon}></i>
                Register as {userTypes.find(t => t.type === userType)?.title}
              </h2>
            </div>
            
            <div className="form-body">
              {showAlert && (
                <div className={`alert alert-${alertType}`}>
                  <i className={`fas ${alertType === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
                  {alertMessage}
                  {alertType === 'error' && alertMessage.includes('already exists') && (
                    <div className="alert-actions">
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => navigate('/login')}
                        style={{ marginLeft: '10px', marginTop: '5px' }}
                      >
                        <i className="fas fa-sign-in-alt"></i>
                        Go to Login
                      </button>
                    </div>
                  )}
                  <button 
                    className="alert-close" 
                    onClick={() => setShowAlert(false)}
                    aria-label="Close alert"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )}

              {/* Show email verification guidance when registration is successful and verification is required */}
              {showAlert && alertType === 'success' && alertMessage.includes('verify your email') && (
                <div className="email-verification-guidance">
                  <div className="guidance-content">
                    <i className="fas fa-envelope-open-text"></i>
                    <h4>Next Steps:</h4>
                    <ul>
                      <li>Check your email inbox (and spam folder)</li>
                      <li>Click the verification link in the email</li>
                      <li>Once verified, you can log in to your dashboard</li>
                      <li>You can verify from any device - no need to stay on this page</li>
                    </ul>
                    <div className="guidance-actions">
                      <button 
                        className="btn btn-secondary"
                        onClick={() => navigate('/login')}
                      >
                        Go to Login
                      </button>
                      <button 
                        className="btn btn-primary"
                        onClick={() => window.location.reload()}
                      >
                        Register Another Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="section-title">
                  <i className="fas fa-user"></i>
                  Personal Information
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      placeholder="+961 XX XXX XXX"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      placeholder="Enter password (min 6 characters)"
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm Password *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      placeholder="Confirm your password"
                    />
                  </div>
                </div>
              
                <div className="form-actions">
                  <button type="submit" className="submit-btn" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-user-plus"></i>
                        Create Account
                      </>
                    )}
                  </button>
                  
                  <button 
                    type="button"
                    className="back-btn"
                    onClick={() => setUserType('')}
                    disabled={isLoading}
                  >
                    <i className="fas fa-arrow-left"></i>
                    Choose Different User Type
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RegisterPage;
