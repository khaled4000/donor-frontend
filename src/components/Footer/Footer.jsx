import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>About Us</h3>
            <p>Supporting families in South Lebanon affected by war through transparent aid distribution and community rebuilding efforts.</p>
          </div>
          
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/register">Register</a></li>
              <li><a href="/login">Login</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Contact Info</h3>
            <p>Email: khaledkassem223@gmail.com</p>
            <p>Phone: +96170142246</p>
            <p>Address: Tripoli-North Lebanon</p>
          </div>
          
          <div className="footer-section">
            <h3>Follow Us</h3>
            <ul>
              <li><a href="#">Facebook</a></li>
              <li><a href="#">Twitter</a></li>
              <li><a href="#">Instagram</a></li>
              <li><a href="#">LinkedIn</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 Nahdat Watan | نهضة وطن. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
