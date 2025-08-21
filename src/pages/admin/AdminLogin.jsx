import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAuthStorage } from '../../utils/authStorage';
import config from '../../config/environment';
import './AdminLogin.css';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${config.API_BASE_URL}/admin/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Store authentication data
                adminAuthStorage.setAuth(data.token, data.admin, data.admin.role);
                
                // Redirect to admin dashboard
                navigate('/admin/dashboard', { replace: true });
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-container">
                <div className="admin-login-header">
                    <div className="admin-logo">
                        <i className="fas fa-shield-alt"></i>
                    </div>
                    <h1>Admin Access</h1>
                    <p>Secure login for case reviewers and administrators</p>
                </div>

                <div className="admin-login-content">
                    <form onSubmit={handleSubmit} className="admin-login-form">
                        <div className="form-group">
                            <label htmlFor="username">Email or Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter your email or username"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter your password"
                                disabled={isLoading}
                            />
                        </div>

                        {error && (
                            <div className="error-message">
                                <i className="fas fa-exclamation-triangle"></i>
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="login-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Logging in...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-sign-in-alt"></i>
                                    Login
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="admin-login-footer">
                    <div className="security-notice">
                        <i className="fas fa-info-circle"></i>
                        <p>This is a secure area. All access attempts are logged and monitored.</p>
                    </div>
                    
                    <div className="back-to-site">
                        <button 
                            onClick={() => navigate('/')}
                            className="back-btn"
                        >
                            <i className="fas fa-arrow-left"></i>
                            Back to Main Site
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
