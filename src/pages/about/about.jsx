import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import './about.css';

const About = () => {
  return (
    <div className="about-page">
      <Navbar />
      <div className="about-container">
        
        {/* About South Lebanon Aid */}
        <section className="about-header">
          <h1 className="about-title">About South Lebanon Aid</h1>
          <p className="about-subtitle">Supporting Families Affected by War</p>
        </section>

        {/* Our Mission */}
        <section className="about-section">
          <h2 className="section-title">Our Mission</h2>
          <p className="section-description">
            This platform is designed to support families in South Lebanon whose homes were destroyed during wartime. 
            We provide a transparent, secure system that connects families in need with generous donors, while ensuring 
            all claims are properly verified through our trained professionals.
          </p>
        </section>

        {/* How It Works */}
        <section className="about-section">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <i className="fas fa-home"></i>
              <h3>Families Submit Claims</h3>
              <p>Affected families register and submit evidence of their destroyed homes, including photos and supporting documents.</p>
            </div>
            
            <div className="step-card">
              <div className="step-number">2</div>
              <i className="fas fa-search"></i>
              <h3>Professional Verification</h3>
              <p>Our trained checkers investigate each case, verify documents, and conduct field visits when necessary.</p>
            </div>
            
            <div className="step-card">
              <div className="step-number">3</div>
              <i className="fas fa-check-circle"></i>
              <h3>Case Approval</h3>
              <p>Verified cases are approved and made visible to potential donors with detailed information about needs.</p>
            </div>
            
            <div className="step-card">
              <div className="step-number">4</div>
              <i className="fas fa-heart"></i>
              <h3>Secure Donations</h3>
              <p>Donors can view approved cases on our interactive map and make targeted donations securely online.</p>
            </div>
          </div>
        </section>

        {/* Who We Serve */}
        <section className="about-section">
          <h2 className="section-title">Who We Serve</h2>
          <div className="user-types-grid">
            <div className="user-type-card">
              <i className="fas fa-users"></i>
              <h3>Families in Need</h3>
              <p>People whose homes were destroyed during wartime can register, submit evidence, and track their request status while receiving updates throughout the process.</p>
            </div>
            
            <div className="user-type-card">
              <i className="fas fa-user-shield"></i>
              <h3>Verification Specialists</h3>
              <p>Trained professionals who authenticate evidence, conduct field investigations, and ensure all claims are legitimate before approval.</p>
            </div>
            
            <div className="user-type-card">
              <i className="fas fa-donate"></i>
              <h3>Generous Donors</h3>
              <p>Individuals who wish to help can explore our interactive map, filter cases by region or need, and make secure donations with full transparency.</p>
            </div>
            
            <div className="user-type-card">
              <i className="fas fa-cog"></i>
              <h3>System Administrators</h3>
              <p>Manage the platform, oversee checker assignments, and monitor system performance to ensure smooth operations.</p>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="about-section">
          <h2 className="section-title">Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <i className="fas fa-map-marked-alt"></i>
              <h3>Interactive Regional Map</h3>
              <p>Explore South Lebanon with color-coded damage regions, case statistics, and filtering options for targeted assistance.</p>
            </div>
            
            <div className="feature-card">
              <i className="fas fa-shield-alt"></i>
              <h3>Secure Verification Process</h3>
              <p>Multi-layered verification including document authentication and field visits to ensure transparency and trust.</p>
            </div>
            
            <div className="feature-card">
              <i className="fas fa-chart-bar"></i>
              <h3>Real-time Tracking</h3>
              <p>Families can track their request status, and donors can monitor their contributions and impact in real-time.</p>
            </div>
            
            <div className="feature-card">
              <i className="fas fa-mobile-alt"></i>
              <h3>User-Friendly Interface</h3>
              <p>Accessible platform supporting both English and Arabic languages with intuitive navigation for all users.</p>
            </div>
          </div>
        </section>

        {/* Our Commitment to Transparency */}
        <section className="about-section transparency-section">
          <h2 className="section-title">Our Commitment to Transparency</h2>
          <p className="section-description">
            We believe in complete transparency in our operations. Every donation is tracked, every case is verified by professionals, 
            and donors receive detailed reports on how their contributions are making a difference. Our interactive dashboard provides 
            real-time statistics on fund distribution, case completion rates, and regional needs.
          </p>
        </section>

        {/* Call to Action */}
        <section className="about-section get-started-section">
          <h2 className="section-title">Get Started Today</h2>
          <p className="section-description">
            Whether you're a family in need, a potential donor, or someone who wants to volunteer as a verification specialist, 
            we're here to help. Join our community working together to rebuild South Lebanon.
          </p>
          <Link to="/register" className="cta-button">
            <i className="fas fa-hand-holding-heart"></i>
            START HELPING NOW
          </Link>
        </section>
      </div>
    </div>
  );
};

export default About;
