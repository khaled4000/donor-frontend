import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './CaseReviewModal.css';

const CaseReviewModal = ({ 
  caseData, 
  isOpen,
  onClose, 
  onSubmitDecision,
  currentUser,
  currentCheckerId 
}) => {
  const [formData, setFormData] = useState({
    finalDamagePercentage: '',
    estimatedCost: '',
    comments: '',
    fieldNotes: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with case data
  useEffect(() => {
    if (caseData && isOpen) {
      setFormData({
        finalDamagePercentage: caseData.finalDamagePercentage || caseData.destructionPercentage || '',
        estimatedCost: caseData.estimatedCost || caseData.finalRebuildingCost || '',
        comments: '',
        fieldNotes: ''
      });
      setErrors({});
    }
  }, [caseData, isOpen]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Validate form data
  const validateForm = (decision) => {
    const newErrors = {};

    // Comments are always required
    if (!formData.comments.trim()) {
      newErrors.comments = 'Review comments are required';
    }

    // For approval, validate damage percentage and cost
    if (decision === 'approved') {
      // Validate damage percentage
      if (!formData.finalDamagePercentage) {
        newErrors.finalDamagePercentage = 'Damage percentage is required for approval';
      } else {
        const percentage = parseFloat(formData.finalDamagePercentage);
        if (isNaN(percentage) || percentage < 0 || percentage > 100) {
          newErrors.finalDamagePercentage = 'Percentage must be between 0 and 100';
        }
      }

      // Validate estimated cost
      if (!formData.estimatedCost) {
        newErrors.estimatedCost = 'Estimated cost is required for approval';
      } else {
        const cost = parseFloat(formData.estimatedCost);
        if (isNaN(cost) || cost <= 0) {
          newErrors.estimatedCost = 'Cost must be a positive number';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle decision submission
  const handleDecision = async (decision) => {
    if (isSubmitting) return;

    // Check if user data is available
    if (!currentUser || !currentUser.id) {
      toast.error('User session is invalid. Please refresh and try again.');
      return;
    }

    // Validate form
    if (!validateForm(decision)) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the data payload with correct field mapping
      const assessmentData = {
        comments: formData.comments.trim(),
        checkerId: currentUser.id,
        checkerName: currentUser.name || currentUser.firstName || 'Unknown Checker'
      };

      // Add field notes if provided
      if (formData.fieldNotes && formData.fieldNotes.trim()) {
        assessmentData.fieldNotes = formData.fieldNotes.trim();
      }

      // Only include assessment values for approved cases
      if (decision === 'approved') {
        // Use the correct field names that match the API expectations
        assessmentData.finalDamagePercentage = parseFloat(formData.finalDamagePercentage);
        assessmentData.estimatedCost = parseFloat(formData.estimatedCost);
      }

      console.log('Modal sending data:', { decision, assessmentData }); // Debug log

      await onSubmitDecision(decision, assessmentData);

      // Success handling is done in parent component
      
    } catch (error) {
      console.error('Error submitting decision:', error);
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage for display
  const formatPercentage = (percentage) => {
    if (!percentage) return '0%';
    return `${percentage}%`;
  };

  // Don't render if not open or no case data
  if (!isOpen || !caseData) return null;

  return (
    <div className="case-review-overlay" onClick={onClose}>
      <div className="case-review-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <div className="header-content">
            <h2>Case Review & Assessment</h2>
            <div className="case-info">
              <span className="case-id">#{caseData.caseId}</span>
              <span className={`status-badge ${caseData.status}`}>
                {caseData.status?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
          <button 
            className="close-btn" 
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Case Summary Section */}
        <div className="case-summary">
          <h3>Case Information</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <label>Family Name</label>
              <span>{caseData.familyData?.familyName || 'N/A'}</span>
            </div>
            <div className="summary-item">
              <label>Head of Household</label>
              <span>{caseData.familyData?.headOfHousehold || 'N/A'}</span>
            </div>
            <div className="summary-item">
              <label>Village</label>
              <span>{caseData.familyData?.village || 'N/A'}</span>
            </div>
            <div className="summary-item">
              <label>Family Size</label>
              <span>{caseData.familyData?.numberOfMembers || 'N/A'} members</span>
            </div>
            <div className="summary-item highlight">
              <label>Original Damage Assessment</label>
              <span>{formatPercentage(caseData.destructionPercentage || caseData.damagePercentage)}</span>
            </div>
            <div className="summary-item highlight">
              <label>Original Cost Estimate</label>
              <span>{formatCurrency(caseData.estimatedCost || caseData.rebuildingCost)}</span>
            </div>
          </div>
        </div>

        {/* Assessment Form */}
        <div className="assessment-form">
          <h3>Final Assessment</h3>
          
          {/* Damage Percentage Field */}
          <div className="form-group">
            <label htmlFor="finalDamagePercentage">
              Final Damage Percentage <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <input
                type="number"
                id="finalDamagePercentage"
                min="0"
                max="100"
                step="0.1"
                value={formData.finalDamagePercentage}
                onChange={(e) => handleInputChange('finalDamagePercentage', e.target.value)}
                className={`form-input ${errors.finalDamagePercentage ? 'error' : ''}`}
                placeholder="Enter percentage (0-100)"
                disabled={isSubmitting}
              />
              <span className="input-suffix">%</span>
            </div>
            {errors.finalDamagePercentage && (
              <span className="error-message">{errors.finalDamagePercentage}</span>
            )}
            <div className="help-text">
              Original assessment: {formatPercentage(caseData.destructionPercentage || caseData.damagePercentage)}
            </div>
          </div>

          {/* Estimated Cost Field */}
          <div className="form-group">
            <label htmlFor="estimatedCost">
              Final Estimated Cost (USD) <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <span className="input-prefix">$</span>
              <input
                type="number"
                id="estimatedCost"
                min="0"
                step="100"
                value={formData.estimatedCost}
                onChange={(e) => handleInputChange('estimatedCost', e.target.value)}
                className={`form-input cost-input ${errors.estimatedCost ? 'error' : ''}`}
                placeholder="Enter amount"
                disabled={isSubmitting}
              />
            </div>
            {errors.estimatedCost && (
              <span className="error-message">{errors.estimatedCost}</span>
            )}
            <div className="help-text">
              Original estimate: {formatCurrency(caseData.estimatedCost || caseData.rebuildingCost)}
            </div>
          </div>

          {/* Comments Field */}
          <div className="form-group">
            <label htmlFor="comments">
              Review Comments <span className="required">*</span>
            </label>
            <textarea
              id="comments"
              value={formData.comments}
              onChange={(e) => handleInputChange('comments', e.target.value)}
              className={`form-textarea ${errors.comments ? 'error' : ''}`}
              placeholder="Provide detailed comments about your assessment, field observations, and decision rationale..."
              rows="4"
              disabled={isSubmitting}
            />
            {errors.comments && (
              <span className="error-message">{errors.comments}</span>
            )}
          </div>

          {/* Field Notes (Optional) */}
          <div className="form-group">
            <label htmlFor="fieldNotes">
              Field Notes <span className="optional">(Optional)</span>
            </label>
            <textarea
              id="fieldNotes"
              value={formData.fieldNotes}
              onChange={(e) => handleInputChange('fieldNotes', e.target.value)}
              className="form-textarea"
              placeholder="Additional field observations, photos taken, weather conditions, etc..."
              rows="3"
              disabled={isSubmitting}
            />
            <div className="help-text">
              Include any additional observations from your field visit
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <i className="fas fa-times"></i>
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-danger"
            onClick={() => handleDecision('rejected')}
            disabled={isSubmitting || !formData.comments.trim()}
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Processing...
              </>
            ) : (
              <>
                <i className="fas fa-times-circle"></i>
                Reject Case
              </>
            )}
          </button>

          <button
            type="button"
            className="btn btn-success"
            onClick={() => handleDecision('approved')}
            disabled={
              isSubmitting || 
              !formData.comments.trim() ||
              !formData.finalDamagePercentage ||
              !formData.estimatedCost
            }
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Processing...
              </>
            ) : (
              <>
                <i className="fas fa-check-circle"></i>
                Approve Case
              </>
            )}
          </button>
        </div>

        {/* Form Validation Summary */}
        {Object.keys(errors).length > 0 && (
          <div className="validation-summary">
            <div className="validation-header">
              <i className="fas fa-exclamation-triangle"></i>
              Please fix the following errors:
            </div>
            <ul className="validation-list">
              {Object.values(errors).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseReviewModal;