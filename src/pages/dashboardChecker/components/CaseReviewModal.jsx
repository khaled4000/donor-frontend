import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './CaseReviewModal.css';

const CaseReviewModal = ({ caseData, onClose, onSubmitDecision, onAssignCase, currentCheckerId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [decision, setDecision] = useState('');
  const [formData, setFormData] = useState({
    comments: '',
    finalDamagePercentage: '',
    estimatedCost: '',
    fieldNotes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    // Pre-fill damage percentage from family data
    if (caseData.familyData?.destructionPercentage) {
      setFormData(prev => ({
        ...prev,
        finalDamagePercentage: caseData.familyData.destructionPercentage.toString(),
      }));
    }
  }, [caseData]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!decision) {
      toast.error('Please select a decision (Approve or Reject)');
      return false;
    }

    if (!formData.comments.trim()) {
      toast.error('Please provide comments for your decision');
      return false;
    }

    if (decision === 'approved') {
      if (!formData.finalDamagePercentage || formData.finalDamagePercentage < 0 || formData.finalDamagePercentage > 100) {
        toast.error('Please provide a valid final damage percentage (0-100%)');
        return false;
      }

      if (!formData.estimatedCost || formData.estimatedCost < 100) {
        toast.error('Please provide a valid estimated cost (minimum $100)');
        return false;
      }
    }

    return true;
  };

  const handleSubmitDecision = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await onSubmitDecision(caseData.caseId, decision, formData);
      toast.success(`Case ${decision} successfully!`);
      onClose();
    } catch (error) {
      console.error('Error submitting decision:', error);
      // Error is already handled in parent component
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignToMe = async () => {
    try {
      await onAssignCase(caseData.caseId);
      toast.success('Case assigned to you!');
    } catch (error) {
      console.error('Error assigning case:', error);
      toast.error('Failed to assign case');
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return 'fas fa-image';
    if (fileType.includes('pdf')) return 'fas fa-file-pdf';
    if (fileType.includes('word')) return 'fas fa-file-word';
    return 'fas fa-file';
  };

  const canAssign = !caseData.assignment && caseData.status === 'submitted';
  const isAssignedToMe = caseData.assignment && currentCheckerId === caseData.assignment.checker?.id;
  const canReview = (canAssign || isAssignedToMe) && ['submitted', 'under_review'].includes(caseData.status);
  const hasDecision = caseData.checkerDecision;

  return (
    <div className="case-review-modal-overlay" onClick={onClose}>
      <div className="case-review-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="header-info">
            <h2>{caseData.caseId}</h2>
            <div className="header-badges">
              <span className={`status-badge ${caseData.status}`}>
                {caseData.status.replace('_', ' ')}
              </span>
              <span className={`priority-badge ${caseData.priority}`}>
                {caseData.priority} priority
              </span>
            </div>
          </div>
          <button className="close-modal" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Modal Navigation */}
        <div className="modal-nav">
          <button 
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fas fa-info-circle"></i>
            Overview
          </button>
          <button 
            className={`nav-tab ${activeTab === 'family' ? 'active' : ''}`}
            onClick={() => setActiveTab('family')}
          >
            <i className="fas fa-users"></i>
            Family Details
          </button>
          <button 
            className={`nav-tab ${activeTab === 'damage' ? 'active' : ''}`}
            onClick={() => setActiveTab('damage')}
          >
            <i className="fas fa-home"></i>
            Damage Report
          </button>
          <button 
            className={`nav-tab ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            <i className="fas fa-paperclip"></i>
            Documents ({caseData.uploadedFiles?.length || 0})
          </button>
          <button 
            className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <i className="fas fa-history"></i>
            History
          </button>
          {canReview && (
            <button 
              className={`nav-tab ${activeTab === 'review' ? 'active' : ''}`}
              onClick={() => setActiveTab('review')}
            >
              <i className="fas fa-gavel"></i>
              Review
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="modal-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="tab-content">
              <div className="overview-grid">
                <div className="overview-section">
                  <h3>Case Summary</h3>
                  <div className="summary-items">
                    <div className="summary-item">
                      <label>Case ID:</label>
                      <span>{caseData.caseId}</span>
                    </div>
                    <div className="summary-item">
                      <label>Family:</label>
                      <span>{caseData.familyData.familyName}</span>
                    </div>
                    <div className="summary-item">
                      <label>Head of Household:</label>
                      <span>{caseData.familyData.headOfHousehold}</span>
                    </div>
                    <div className="summary-item">
                      <label>Location:</label>
                      <span>{caseData.location.village}</span>
                    </div>
                    <div className="summary-item">
                      <label>Family Size:</label>
                      <span>{caseData.familyData.numberOfMembers} members</span>
                    </div>
                    <div className="summary-item">
                      <label>Destruction:</label>
                      <span>{caseData.familyData.destructionPercentage}%</span>
                    </div>
                  </div>
                </div>

                <div className="overview-section">
                  <h3>Status Information</h3>
                  <div className="summary-items">
                    <div className="summary-item">
                      <label>Current Status:</label>
                      <span className={`status-indicator ${caseData.status}`}>
                        {caseData.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="summary-item">
                      <label>Priority:</label>
                      <span className={`priority-indicator ${caseData.priority}`}>
                        {caseData.priority}
                      </span>
                    </div>
                    <div className="summary-item">
                      <label>Submitted:</label>
                      <span>{formatDate(caseData.timestamps.submitted)}</span>
                    </div>
                    <div className="summary-item">
                      <label>Form Completion:</label>
                      <span>{caseData.formCompletion}%</span>
                    </div>
                  </div>
                </div>

                {caseData.assignment && (
                  <div className="overview-section">
                    <h3>Assignment Information</h3>
                    <div className="summary-items">
                      <div className="summary-item">
                        <label>Assigned to:</label>
                        <span>{caseData.assignment.checker?.name || 'Unknown'}</span>
                      </div>
                      <div className="summary-item">
                        <label>Assigned on:</label>
                        <span>{formatDate(caseData.assignment.assignedAt)}</span>
                      </div>
                      {caseData.assignment.notes && (
                        <div className="summary-item">
                          <label>Notes:</label>
                          <span>{caseData.assignment.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {hasDecision && (
                  <div className="overview-section">
                    <h3>Checker Decision</h3>
                    <div className="decision-display">
                      <div className={`decision-status ${caseData.checkerDecision.decision}`}>
                        <i className={`fas ${caseData.checkerDecision.decision === 'approved' ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                        {caseData.checkerDecision.decision.toUpperCase()}
                      </div>
                      {caseData.checkerDecision.decision === 'approved' && (
                        <div className="decision-details">
                          <p><strong>Final Damage:</strong> {caseData.checkerDecision.finalDamagePercentage}%</p>
                          <p><strong>Estimated Cost:</strong> {formatCurrency(caseData.checkerDecision.estimatedCost)}</p>
                        </div>
                      )}
                      <div className="decision-comments">
                        <strong>Comments:</strong>
                        <p>{caseData.checkerDecision.comments}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Family Details Tab */}
          {activeTab === 'family' && (
            <div className="tab-content">
              <div className="family-details-grid">
                <div className="detail-section">
                  <h3>Family Information</h3>
                  <div className="detail-items">
                    <div className="detail-item">
                      <label>Family Name:</label>
                      <span>{caseData.familyData.familyName}</span>
                    </div>
                    <div className="detail-item">
                      <label>Head of Household:</label>
                      <span>{caseData.familyData.headOfHousehold}</span>
                    </div>
                    <div className="detail-item">
                      <label>Phone Number:</label>
                      <span>{caseData.familyData.phoneNumber}</span>
                    </div>
                    {caseData.familyData.email && (
                      <div className="detail-item">
                        <label>Email:</label>
                        <span>{caseData.familyData.email}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <label>Total Members:</label>
                      <span>{caseData.familyData.numberOfMembers}</span>
                    </div>
                    {caseData.familyData.childrenCount > 0 && (
                      <div className="detail-item">
                        <label>Children:</label>
                        <span>{caseData.familyData.childrenCount}</span>
                      </div>
                    )}
                    {caseData.familyData.elderlyCount > 0 && (
                      <div className="detail-item">
                        <label>Elderly:</label>
                        <span>{caseData.familyData.elderlyCount}</span>
                      </div>
                    )}
                    {caseData.familyData.specialNeedsCount > 0 && (
                      <div className="detail-item">
                        <label>Special Needs:</label>
                        <span>{caseData.familyData.specialNeedsCount}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Location Information</h3>
                  <div className="detail-items">
                    <div className="detail-item">
                      <label>Village:</label>
                      <span>{caseData.familyData.village}</span>
                    </div>
                    <div className="detail-item">
                      <label>Current Address:</label>
                      <span>{caseData.familyData.currentAddress}</span>
                    </div>
                    <div className="detail-item">
                      <label>Original Address:</label>
                      <span>{caseData.familyData.originalAddress}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Property Information</h3>
                  <div className="detail-items">
                    <div className="detail-item">
                      <label>Property Type:</label>
                      <span>{caseData.familyData.propertyType}</span>
                    </div>
                    <div className="detail-item">
                      <label>Ownership Status:</label>
                      <span>{caseData.familyData.ownershipStatus}</span>
                    </div>
                    {caseData.familyData.propertyValue && (
                      <div className="detail-item">
                        <label>Property Value:</label>
                        <span>{formatCurrency(caseData.familyData.propertyValue)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Aid History</h3>
                  <div className="detail-items">
                    <div className="detail-item">
                      <label>Previously Received Aid:</label>
                      <span>{caseData.familyData.previouslyReceivedAid}</span>
                    </div>
                    {caseData.familyData.aidDetails && (
                      <div className="detail-item full-width">
                        <label>Aid Details:</label>
                        <span>{caseData.familyData.aidDetails}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Damage Report Tab */}
          {activeTab === 'damage' && (
            <div className="tab-content">
              <div className="damage-report">
                <div className="damage-section">
                  <h3>Destruction Details</h3>
                  <div className="damage-overview">
                    <div className="damage-percentage-large">
                      <div className="damage-circle">
                        <span className="percentage">{caseData.familyData.destructionPercentage}%</span>
                        <span className="label">Damaged</span>
                      </div>
                    </div>
                    <div className="damage-info">
                      <div className="damage-item">
                        <label>Destruction Date:</label>
                        <span>{formatDate(caseData.familyData.destructionDate)}</span>
                      </div>
                      <div className="damage-item">
                        <label>Destruction Cause:</label>
                        <span>{caseData.familyData.destructionCause}</span>
                      </div>
                      <div className="damage-item">
                        <label>Property Type:</label>
                        <span>{caseData.familyData.propertyType}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="damage-section">
                  <h3>Damage Description</h3>
                  <div className="damage-description">
                    <p>{caseData.familyData.damageDescription}</p>
                  </div>
                </div>

                {caseData.checkerDecision && caseData.checkerDecision.decision === 'approved' && (
                  <div className="damage-section">
                    <h3>Checker Assessment</h3>
                    <div className="checker-assessment">
                      <div className="assessment-item">
                        <label>Final Damage Assessment:</label>
                        <span>{caseData.checkerDecision.finalDamagePercentage}%</span>
                      </div>
                      <div className="assessment-item">
                        <label>Estimated Rebuilding Cost:</label>
                        <span>{formatCurrency(caseData.checkerDecision.estimatedCost)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div className="tab-content">
              <div className="files-section">
                <h3>Uploaded Documents</h3>
                {caseData.uploadedFiles && caseData.uploadedFiles.length > 0 ? (
                  <div className="files-grid">
                    {caseData.uploadedFiles.map((file, index) => (
                      <div key={index} className="file-item">
                        <div className="file-header">
                          <i className={getFileIcon(file.type)}></i>
                          <span className="file-name">{file.originalName}</span>
                        </div>
                        <div className="file-details">
                          <span className="file-category">{file.category}</span>
                          <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                        {file.description && (
                          <div className="file-description">
                            <p>{file.description}</p>
                          </div>
                        )}
                        {file.base64 && file.type.startsWith('image/') && (
                          <div 
                            className="file-preview"
                            onClick={() => setSelectedImage(file)}
                          >
                            <img 
                              src={`data:${file.type};base64,${file.base64}`}
                              alt={file.originalName}
                              loading="lazy"
                            />
                            <div className="preview-overlay">
                              <i className="fas fa-expand"></i>
                              <span>View Full Size</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-files">
                    <i className="fas fa-folder-open"></i>
                    <p>No documents uploaded</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="tab-content">
              <div className="history-section">
                <h3>Case History</h3>
                {caseData.auditLog && caseData.auditLog.length > 0 ? (
                  <div className="timeline">
                    {caseData.auditLog.slice().reverse().map((log, index) => (
                      <div key={index} className="timeline-item">
                        <div className="timeline-marker">
                          <i className={`fas ${getActionIcon(log.action)}`}></i>
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="action">{log.action.replace('_', ' ')}</span>
                            <span className="timestamp">{formatDate(log.timestamp)}</span>
                          </div>
                          <div className="timeline-details">
                            <span className="performer">
                              by {log.performedBy?.name || 'Unknown'} ({log.performedByRole})
                            </span>
                          </div>
                          {log.notes && (
                            <div className="timeline-notes">
                              <p>{log.notes}</p>
                            </div>
                          )}
                          {log.details && Object.keys(log.details).length > 0 && (
                            <div className="timeline-details-data">
                              <details>
                                <summary>Additional Details</summary>
                                <pre>{JSON.stringify(log.details, null, 2)}</pre>
                              </details>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-history">
                    <i className="fas fa-history"></i>
                    <p>No history available</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Review Tab */}
          {activeTab === 'review' && canReview && (
            <div className="tab-content">
              <div className="review-section">
                <h3>Case Review</h3>
                
                {canAssign && (
                  <div className="assign-section">
                    <div className="assign-notice">
                      <i className="fas fa-info-circle"></i>
                      <span>This case is not assigned yet. Assign it to yourself to begin review.</span>
                    </div>
                    <button 
                      className="assign-to-me-btn"
                      onClick={handleAssignToMe}
                    >
                      <i className="fas fa-hand-paper"></i>
                      Assign to Me
                    </button>
                  </div>
                )}

                {(isAssignedToMe || canAssign) && !hasDecision && (
                  <div className="decision-form">
                    <div className="decision-buttons">
                      <button
                        className={`decision-btn approve ${decision === 'approved' ? 'selected' : ''}`}
                        onClick={() => setDecision('approved')}
                      >
                        <i className="fas fa-check-circle"></i>
                        Approve Case
                      </button>
                      <button
                        className={`decision-btn reject ${decision === 'rejected' ? 'selected' : ''}`}
                        onClick={() => setDecision('rejected')}
                      >
                        <i className="fas fa-times-circle"></i>
                        Reject Case
                      </button>
                    </div>

                    {decision && (
                      <div className="decision-details-form">
                        <div className="form-group">
                          <label htmlFor="comments">
                            Comments <span className="required">*</span>
                          </label>
                          <textarea
                            id="comments"
                            name="comments"
                            value={formData.comments}
                            onChange={handleInputChange}
                            placeholder={`Explain your decision to ${decision} this case...`}
                            rows={4}
                            required
                          />
                        </div>

                        {decision === 'approved' && (
                          <>
                            <div className="form-row">
                              <div className="form-group">
                                <label htmlFor="finalDamagePercentage">
                                  Final Damage Percentage <span className="required">*</span>
                                </label>
                                <input
                                  type="number"
                                  id="finalDamagePercentage"
                                  name="finalDamagePercentage"
                                  value={formData.finalDamagePercentage}
                                  onChange={handleInputChange}
                                  min="0"
                                  max="100"
                                  placeholder="0-100"
                                  required
                                />
                                <small>Based on your field assessment</small>
                              </div>

                              <div className="form-group">
                                <label htmlFor="estimatedCost">
                                  Estimated Rebuilding Cost <span className="required">*</span>
                                </label>
                                <input
                                  type="number"
                                  id="estimatedCost"
                                  name="estimatedCost"
                                  value={formData.estimatedCost}
                                  onChange={handleInputChange}
                                  min="100"
                                  placeholder="Amount in USD"
                                  required
                                />
                                <small>Minimum $100 required</small>
                              </div>
                            </div>
                          </>
                        )}

                        <div className="form-group">
                          <label htmlFor="fieldNotes">Field Notes (Optional)</label>
                          <textarea
                            id="fieldNotes"
                            name="fieldNotes"
                            value={formData.fieldNotes}
                            onChange={handleInputChange}
                            placeholder="Additional notes from your field visit..."
                            rows={3}
                          />
                        </div>

                        <div className="form-actions">
                          <button
                            className="submit-decision-btn"
                            onClick={handleSubmitDecision}
                            disabled={submitting}
                          >
                            {submitting ? (
                              <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Submitting...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-gavel"></i>
                                Submit {decision === 'approved' ? 'Approval' : 'Rejection'}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {hasDecision && (
                  <div className="existing-decision">
                    <div className="decision-notice">
                      <i className="fas fa-check-circle"></i>
                      <span>This case has already been reviewed and decided.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="image-modal" onClick={(e) => e.stopPropagation()}>
            <div className="image-modal-header">
              <h3>{selectedImage.originalName}</h3>
              <button onClick={() => setSelectedImage(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="image-modal-content">
              <img 
                src={`data:${selectedImage.type};base64,${selectedImage.base64}`}
                alt={selectedImage.originalName}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get action icons
const getActionIcon = (action) => {
  switch (action) {
    case 'created': return 'fa-plus-circle';
    case 'submitted': return 'fa-paper-plane';
    case 'assigned': return 'fa-user-check';
    case 'reviewed': return 'fa-search';
    case 'approved': return 'fa-check-circle';
    case 'rejected': return 'fa-times-circle';
    case 'donated': return 'fa-heart';
    case 'fully_funded': return 'fa-flag-checkered';
    default: return 'fa-circle';
  }
};

export default CaseReviewModal;
