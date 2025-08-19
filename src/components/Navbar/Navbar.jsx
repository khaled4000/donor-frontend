import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../pages/authContext/AuthContext';
import { adminAuthStorage } from '../../utils/authStorage';
import SessionSwitcher from '../SessionSwitcher/SessionSwitcher';
import { FiLogOut } from 'react-icons/fi';
import './Navbar.css';

const Navbar = ({ language, onLanguageToggle }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  
  // Check for admin user in localStorage
  const [adminUser, setAdminUser] = useState(null);
  
  useEffect(() => {
    const authData = adminAuthStorage.getAuth();
    if (authData.isAuthenticated) {
      setAdminUser(authData.user);
    }
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleLanguage = () => {
    if (onLanguageToggle) {
      onLanguageToggle();
    } else {
      // Fallback language toggle functionality
      console.log('Language toggle clicked');
    }
  };

  const handleLogout = () => {
    if (adminUser) {
      // Admin logout
      adminAuthStorage.clearAuth();
      setAdminUser(null);
      window.location.href = '/';
    } else {
      // Regular user logout
      logout();
    }
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Determine which user to display (admin takes precedence)
  const currentUser = adminUser || user;
  const isAdmin = !!adminUser;

  if (currentUser) {
    return (
      <nav className="navbar navbar-authenticated">
        <div className="nav-container">
          <div className="nav-minimal">
            <Link to="/" className="nav-logo-minimal">
              <i className="fas fa-heart"></i>
              Donor Project
            </Link>
          </div>
          
          <div className="nav-actions">
            <SessionSwitcher />
            
            <button onClick={handleLogout} className="logout-btn">
              <FiLogOut />
              
            </button>
            
            <button onClick={toggleLanguage} className="language-btn">
              {language === 'en' ? 'العربية' : 'English'}
            </button>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <i className="fas fa-heart"></i>
          Donor Project
        </Link>
        
        <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <li><Link to="/" className="nav-link">Home</Link></li>
          <li><Link to="/about" className="nav-link">About</Link></li>
          <li><Link to="/register" className="nav-link">Register</Link></li>
          <li><Link to="/login" className="nav-link">Login</Link></li>
          <li><button onClick={toggleLanguage} className="language-btn">EN/AR</button></li>
        </ul>
        
        <button className="nav-toggle" onClick={toggleMenu}>
          <span className={`bar ${isMenuOpen ? 'active' : ''}`}></span>
          <span className={`bar ${isMenuOpen ? 'active' : ''}`}></span>
          <span className={`bar ${isMenuOpen ? 'active' : ''}`}></span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
