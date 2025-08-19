import React from 'react';
import './StatsOverview.css';

const StatsOverview = ({ stats }) => {
  return (
    <div className="stats-overview">
      <div className="stats-grid">
        <div className="stat-card assigned">
          <div className="stat-icon">
            <i className="fas fa-clipboard-list"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalAssigned || 0}</h3>
            <p>Total Assigned</p>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.pending || 0}</h3>
            <p>Pending Review</p>
          </div>
        </div>

        <div className="stat-card approved">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.approved || 0}</h3>
            <p>Approved</p>
          </div>
        </div>

        <div className="stat-card rejected">
          <div className="stat-icon">
            <i className="fas fa-times-circle"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.rejected || 0}</h3>
            <p>Rejected</p>
          </div>
        </div>

        <div className="stat-card available">
          <div className="stat-icon">
            <i className="fas fa-inbox"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.availableCases || 0}</h3>
            <p>Available Cases</p>
          </div>
        </div>

        <div className="stat-card efficiency">
          <div className="stat-icon">
            <i className="fas fa-tachometer-alt"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.avgReviewTime || 0}h</h3>
            <p>Avg Review Time</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
