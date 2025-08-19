import React from 'react';
import './CaseCard.css';

const CaseCard = ({ caseData, onCaseClick, onAssignCase, currentCheckerId }) => {
  const {
    caseId,
    status,
    priority,
    familyData,
    location,
    uploadedFiles,
    submitterInfo,
    assignment,
    checkerDecision,
    timestamps,
    formCompletion,
    totalNeeded,
    totalRaised,
    donationProgress,
  } = caseData;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'submitted': return 'status-submitted';
      case 'under_review': return 'status-under-review';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return 'status-submitted';
    }
  };

  const canAssign = !assignment && status === 'submitted';
  const isAssignedToMe = assignment && assignment.checker && currentCheckerId === assignment.checker.id;
  const canReview = (canAssign || isAssignedToMe) && ['submitted', 'under_review'].includes(status);

  return (
    <div className={`case-card ${getPriorityClass(priority)} ${getStatusClass(status)}`}>
      {/* Card Header */}
      <div className="case-header">
        <div className="case-id-section">
          <h3 className="case-id">{caseId}</h3>
          <div className="case-badges">
            <span className={`priority-badge ${getPriorityClass(priority)}`}>
              {priority} priority
            </span>
            <span className={`status-badge ${getStatusClass(status)}`}>
              {status.replace('_', ' ')}
            </span>
          </div>
        </div>
        
        <div className="case-actions">
          {canAssign && (
            <button
              className="assign-btn"
              onClick={(e) => {
                e.stopPropagation();
                onAssignCase(caseId);
              }}
              title="Assign case to me"
            >
              <i className="fas fa-hand-paper"></i>
            </button>
          )}
          
          <button
            className="view-btn"
            onClick={() => onCaseClick(caseData)}
            title="View case details"
          >
            <i className="fas fa-eye"></i>
          </button>
        </div>
      </div>

      {/* Family Information */}
      <div className="family-info">
        <h4 className="family-name">{familyData.familyName}</h4>
        <div className="family-details">
          <div className="detail-item">
            <i className="fas fa-user"></i>
            <span>{familyData.headOfHousehold}</span>
          </div>
          <div className="detail-item">
            <i className="fas fa-users"></i>
            <span>{familyData.numberOfMembers} members</span>
          </div>
          <div className="detail-item">
            <i className="fas fa-map-marker-alt"></i>
            <span>{location.village}</span>
          </div>
          <div className="detail-item">
            <i className="fas fa-calendar"></i>
            <span>Submitted: {formatDate(timestamps.submitted)}</span>
          </div>
        </div>
      </div>

      {/* Damage Information */}
      <div className="damage-info">
        <div className="damage-percentage">
          <div className="damage-label">
            <i className="fas fa-home"></i>
            <span>Damage: {familyData.destructionPercentage}%</span>
          </div>
          <div className="damage-bar">
            <div 
              className="damage-fill"
              style={{ width: `${familyData.destructionPercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div className="damage-description">
          <p>{familyData.damageDescription}</p>
        </div>
      </div>

      {/* Assignment Information */}
      {assignment && (
        <div className="assignment-info">
          <div className="assignment-header">
            <i className="fas fa-user-check"></i>
            <span>Assigned to: {assignment.checker?.name || 'Unknown'}</span>
          </div>
          <div className="assignment-date">
            Assigned: {formatDate(assignment.assignedAt)}
          </div>
        </div>
      )}

      {/* Decision Information */}
      {checkerDecision && (
        <div className={`decision-info ${checkerDecision.decision}`}>
          <div className="decision-header">
            <i className={`fas ${checkerDecision.decision === 'approved' ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
            <span>{checkerDecision.decision.toUpperCase()}</span>
          </div>
          {checkerDecision.decision === 'approved' && (
            <div className="financial-info">
              <div className="cost-estimate">
                <span>Estimated Cost: {formatCurrency(checkerDecision.estimatedCost)}</span>
              </div>
              {totalRaised > 0 && (
                <div className="funding-progress">
                  <div className="progress-label">
                    Raised: {formatCurrency(totalRaised)} of {formatCurrency(totalNeeded)} ({donationProgress}%)
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${donationProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Files Information */}
      {uploadedFiles && uploadedFiles.length > 0 && (
        <div className="files-info">
          <div className="files-count">
            <i className="fas fa-paperclip"></i>
            <span>{uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* Form Completion */}
      <div className="completion-info">
        <div className="completion-label">
          <i className="fas fa-clipboard-check"></i>
          <span>Form: {formCompletion}% complete</span>
        </div>
        <div className="completion-bar">
          <div 
            className="completion-fill"
            style={{ width: `${formCompletion}%` }}
          ></div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="case-footer">
        <div className="footer-info">
          <span className="submitter">By: {submitterInfo?.name || 'Unknown'}</span>
        </div>
        
        {canReview && (
          <div className="footer-actions">
            <button 
              className="review-btn"
              onClick={() => onCaseClick(caseData)}
            >
              <i className="fas fa-gavel"></i>
              Review Case
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseCard;
