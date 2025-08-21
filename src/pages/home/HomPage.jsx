import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaUsers, FaCheckCircle, FaDollarSign, FaHandHoldingHeart, FaMapMarkedAlt, FaClipboardCheck, FaUpload, FaSearch, FaHeart } from "react-icons/fa";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import ImageSlider from "../../components/ImageSlider/ImageSlider";
import ApiService from "../../services/api";
import "./Home-page.css";

const HomePage = () => {
  const location = useLocation();
  const [showLogoutMessage, setShowLogoutMessage] = useState(false);
  
  const [stats, setStats] = useState({
    familiesHelped: 0,
    villagesCovered: 0,
    casesVerified: 0,
    totalCases: 0,
    verifiedCases: 0,
    loading: true,
    error: null,
  });

  const [impactStats, setImpactStats] = useState({
    homesDestroyed: 0,
    peopleAffected: 0,
    casesVerifiedCount: 0,
    fundsRaised: 0,
    loading: true,
    error: null,
  });

  // Fetch hero stats from API/database
  const fetchStats = async () => {
    try {
      setStats((prev) => ({ ...prev, loading: true, error: null }));

      // Use the API service to fetch stats
      const response = await ApiService.getStats();

      if (response.success && response.data) {
        // Animate the numbers counting up
        animateStats(response.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load statistics",
      }));

      // Fallback to default values on error
      setStats((prev) => ({
        ...prev,
        familiesHelped: 2847,
        villagesCovered: 156,
        casesVerified: 89,
        totalCases: 3200,
        verifiedCases: 2848,
        loading: false,
        error: null,
      }));
    }
  };

  // Handle logout messages
  useEffect(() => {
    // Check for admin logout flag
    if (sessionStorage.getItem('adminLogout') === 'true') {
      setShowLogoutMessage(true);
      sessionStorage.removeItem('adminLogout');
      
      // Auto-hide message after 5 seconds
      const timer = setTimeout(() => {
        setShowLogoutMessage(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
    
    // Check for location state logout
    if (location.state?.fromLogout) {
      setShowLogoutMessage(true);
      
      // Auto-hide message after 5 seconds
      const timer = setTimeout(() => {
        setShowLogoutMessage(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  useEffect(() => {
    fetchStats();

    // Set up real-time updates with longer interval to reduce server load
    const interval = setInterval(fetchStats, 120000); // Refresh every 2 minutes instead of 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Fetch impact stats from API/database
  const fetchImpactStats = async () => {
    try {
      setImpactStats((prev) => ({ ...prev, loading: true, error: null }));

      // Use the API service to fetch impact stats
      const response = await ApiService.getImpactStats();

      if (response.success && response.data) {
        // Animate the impact stats counting up
        animateImpactStats(response.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching impact stats:", error);
      setImpactStats((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load impact statistics",
      }));

      // Fallback to default values on error
      setImpactStats((prev) => ({
        ...prev,
        homesDestroyed: 12543,
        peopleAffected: 45892,
        casesVerifiedCount: 8234,
        fundsRaised: 2.8,
        loading: false,
        error: null,
      }));
    }
  };

  useEffect(() => {
    fetchImpactStats();

    // Set up real-time updates with longer interval to reduce server load
    const interval = setInterval(fetchImpactStats, 180000); // Refresh every 3 minutes instead of 60 seconds

    return () => clearInterval(interval);
  }, []);

  // Animate counting up to the target numbers
  const animateStats = (targetStats) => {
    const duration = 2000; // 2 seconds animation
    const steps = 60; // 60 frames
    const stepDuration = duration / steps;

    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      // Easing function for smooth animation
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      setStats((prev) => ({
        ...prev,
        familiesHelped: Math.round(targetStats.familiesHelped * easeProgress),
        villagesCovered: Math.round(targetStats.villagesCovered * easeProgress),
        casesVerified: Math.round(targetStats.casesVerified * easeProgress),
        totalCases: Math.round(targetStats.totalCases * easeProgress),
        verifiedCases: Math.round(targetStats.verifiedCases * easeProgress),
        loading: false,
      }));

      if (currentStep >= steps) {
        clearInterval(interval);
        // Set final exact values
        setStats((prev) => ({
          ...prev,
          familiesHelped: targetStats.familiesHelped,
          villagesCovered: targetStats.villagesCovered,
          casesVerified: targetStats.casesVerified,
          totalCases: targetStats.totalCases,
          verifiedCases: targetStats.verifiedCases,
        }));
      }
    }, stepDuration);
  };

  // Animate impact stats counting up
  const animateImpactStats = (targetStats) => {
    const duration = 2500; // 2.5 seconds animation
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      // Easing function for smooth animation
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      setImpactStats((prev) => ({
        ...prev,
        homesDestroyed: Math.round(targetStats.homesDestroyed * easeProgress),
        peopleAffected: Math.round(targetStats.peopleAffected * easeProgress),
        casesVerifiedCount: Math.round(
          targetStats.casesVerifiedCount * easeProgress
        ),
        fundsRaised:
          Math.round(targetStats.fundsRaised * easeProgress * 10) / 10, // Keep 1 decimal
        loading: false,
      }));

      if (currentStep >= steps) {
        clearInterval(interval);
        // Set final exact values
        setImpactStats((prev) => ({
          ...prev,
          homesDestroyed: targetStats.homesDestroyed,
          peopleAffected: targetStats.peopleAffected,
          casesVerifiedCount: targetStats.casesVerifiedCount,
          fundsRaised: targetStats.fundsRaised,
        }));
      }
    }, stepDuration);
  };

  // Format numbers with commas
  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  // Calculate percentage with proper formatting
  const formatPercentage = (num) => {
    return `${num}%`;
  };

  // Format currency
  const formatCurrency = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return `${num.toLocaleString()}`;
  };

  return (
    <div className="home-page">
      <Navbar />

      {/* Logout Message */}
      {showLogoutMessage && (
        <div className="logout-message">
          <div className="logout-message-content">
            <i className="fas fa-check-circle"></i>
            <span>You have been successfully logged out.</span>
            <button 
              className="logout-message-close"
              onClick={() => setShowLogoutMessage(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="mainsection">
        <div className="hero-content">
          <h2 className="hero-title">Rebuilding Hope in South Lebanon</h2>
          <p className="hero-subtitle">
            Help families whose homes were destroyed during wartime. Your
            donation goes directly to verified families in need.
          </p>

          {/* Dynamic Hero Stats */}
          <div className="hero-stats">
            {stats.loading ? (
              <>
                <div className="stat-item loading">
                  <span className="stat-number">
                    {stats.loading ? (
                      <i className="fas fa-spinner fa-spin me-2"></i>
                    ) : null}
                    ---
                  </span>
                  <span className="stat-label">Loading...</span>
                </div>
                <div className="stat-item loading">
                  <span className="stat-number">
                    {stats.loading ? (
                      <i className="fas fa-spinner fa-spin me-2"></i>
                    ) : null}
                    ---
                  </span>
                  <span className="stat-label">Loading...</span>
                </div>
                <div className="stat-item loading">
                  <span className="stat-number">
                    {stats.loading ? (
                      <i className="fas fa-spinner fa-spin me-2"></i>
                    ) : null}
                    ---%
                  </span>
                  <span className="stat-label">Loading...</span>
                </div>
              </>
            ) : (
              <>
                <div className="stat-item" data-stat="families">
                  <div className="stat-icon-hero">
                    <FaHandHoldingHeart size={24} color="#ed1c24" />
                  </div>
                  <span className="stat-number">
                    {formatNumber(stats.familiesHelped)}
                  </span>
                  <span className="stat-label">Families Helped</span>
                </div>
                <div className="stat-item" data-stat="villages">
                  <div className="stat-icon-hero">
                    <FaMapMarkedAlt size={24} color="#17a2b8" />
                  </div>
                  <span className="stat-number">
                    {formatNumber(stats.villagesCovered)}
                  </span>
                  <span className="stat-label">Villages Covered</span>
                </div>
                <div className="stat-item stat-item-verified" data-stat="verified">
                  <div className="stat-icon-hero">
                    <FaClipboardCheck size={24} color="#28a745" />
                  </div>
                  <span className="stat-number">
                    {formatPercentage(stats.casesVerified)}
                  </span>
                  <span className="stat-label">Cases Verified</span>
                  
                  {/* Enhanced Progress Bar with Animation */}
                  <div className="progress-container">
                    <div className="progress-bar-wrapper">
                      <div className="progress-track">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: stats.loading ? '0%' : `${stats.casesVerified}%`,
                            transition: 'width 2s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        >
                          <div className="progress-glow"></div>
                        </div>
                      </div>
                      <span className="progress-percentage">
                        {stats.loading ? '...' : `${stats.casesVerified}%`}
                      </span>
                    </div>
                  </div>
                  
                  <small className="verification-details">
                    {stats.verifiedCases} of {stats.totalCases} cases verified
                  </small>
                </div>
              </>
            )}
            {stats.error && (
              <div className="stats-error">
                <small>{stats.error}</small>
              </div>
            )}
          </div>

          <Link to="/register" className="cta-button cta-button-enhanced">
            <div className="button-content">
              <i className="fas fa-hand-holding-heart button-icon"></i>
              <span className="button-text">Start Helping Now</span>
            </div>
            <div className="button-background"></div>
            <div className="button-shine"></div>
          </Link>
        </div>
      </section>
      {/* Statistics Section */}
      <section className="stats-section">
        <div className="section">
          <div className="container">
            <div className="section-title">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="display-5">Impact Statistics</h2>
                  <h2 className="lead">
                    Real-time data showing the scale of destruction and our
                    collective response
                  </h2>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="stat-icon">
                  <FaHome size={40} color="#ed1c24" />
                </div>
                <div className="stat-number-large">
                  {impactStats.loading
                    ? "---"
                    : formatNumber(impactStats.homesDestroyed)}
                </div>
                <div className="stat-label-large">Homes Destroyed</div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="stat-icon">
                  <FaUsers size={40} color="#ffc107" />
                </div>
                <div className="stat-number-large">
                  {impactStats.loading
                    ? "---"
                    : formatNumber(impactStats.peopleAffected)}
                </div>
                <div className="stat-label-large">People Affected</div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="stat-icon">
                  <FaCheckCircle size={40} color="#28a745" />
                </div>
                <div className="stat-number-large">
                  {impactStats.loading
                    ? "---"
                    : formatNumber(impactStats.casesVerifiedCount)}
                </div>
                <div className="stat-label-large">Cases Verified</div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="stat-icon">
                  <FaDollarSign size={40} color="#17a2b8" />
                </div>
                <div className="stat-number-large">
                  {impactStats.loading
                    ? "$---"
                    : formatCurrency(impactStats.fundsRaised)}
                </div>
                <div className="stat-label-large">Funds Raised</div>
              </div>
            </div>
          </div>

          {impactStats.error && (
            <div className="impact-stats-error">
              <small>{impactStats.error}</small>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="content-section">
        <div className="container">
          <h2>How It Works</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FaUpload size={40} color="#e74c3c" />
              </div>
              <h3>1. Families Submit</h3>
              <p>
                Affected families upload photos and documents of destroyed
                homes.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FaSearch size={40} color="#f39c12" />
              </div>
              <h3>2. Expert Verification</h3>
              <p>Trained auditors verify each case through investigation.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FaHeart size={40} color="#27ae60" />
              </div>
              <h3>3. Direct Aid</h3>
              <p>
                Donors contribute directly to verified families with
                transparency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Image Slider */}
      <ImageSlider />

      <Footer />
    </div>
  );
};

export default HomePage;
