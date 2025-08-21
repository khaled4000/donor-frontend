import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import ApiService from '../../../services/api';
import './CheckerManagement.css';

// Import React Icons for enhanced button styling
import { 
  FiEdit3, 
  FiTrash2, 
  FiUserCheck, 
  FiUserX, 
  FiRefreshCw, 
  FiPlus,
  FiSearch,
  FiFilter
} from 'react-icons/fi';
import { 
  HiOutlineUserAdd, 
  HiOutlineUser,
  HiOutlineShieldCheck,
  HiOutlineShieldExclamation
} from 'react-icons/hi';
import { BiUserCheck, BiUserX } from 'react-icons/bi';

const CheckerManagement = () => {
  const [checkers, setCheckers] = useState([]);
  const [checkerStats, setCheckerStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedChecker, setSelectedChecker] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [checkerToDelete, setCheckerToDelete] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    sendNotification: true
  });

  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    address: '',
    isActive: true,
    newPassword: ''
  });

  // Load checkers and stats using admin API methods
  const loadCheckers = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Use admin API methods instead of checker methods
      const [checkersResponse, statsResponse] = await Promise.all([
        ApiService.getCheckers({ status: statusFilter }),
        ApiService.getCheckerManagementStats() // This is the correct admin method
      ]);
      
      setCheckers(checkersResponse.checkers || checkersResponse.data || []);
      setCheckerStats(statsResponse.stats || statsResponse.data || {});
    } catch (error) {
      console.error('Error loading checkers:', error);
      
      // More specific error handling
      if (error.message.includes("403")) {
        toast.error('Access denied. Admin privileges required.');
      } else if (error.message.includes("401")) {
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error('Failed to load checkers');
      }
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadCheckers();
  }, [loadCheckers]);

  // Filter checkers based on search term and status
  const filteredCheckers = checkers.filter(checker => {
    const matchesSearch = !searchTerm || 
      (checker.name && checker.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (checker.email && checker.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (checker.username && checker.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (checker.firstName && checker.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (checker.lastName && checker.lastName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && checker.isActive) ||
      (statusFilter === 'inactive' && !checker.isActive);

    return matchesSearch && matchesStatus;
  });

  // Handle create checker
  const handleCreateChecker = async (e) => {
    e.preventDefault();
    try {
      // Validate form data
      if (!createForm.firstName.trim() || !createForm.lastName.trim()) {
        toast.error('First name and last name are required');
        return;
      }
      
      if (!createForm.email.trim()) {
        toast.error('Email is required');
        return;
      }
      
      if (!createForm.password || createForm.password.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }

      await ApiService.createChecker(createForm);
      toast.success('Checker created successfully');
      setShowCreateModal(false);
      setCreateForm({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        sendNotification: true
      });
      loadCheckers();
    } catch (error) {
      console.error('Error creating checker:', error);
      toast.error(error.message || 'Failed to create checker');
    }
  };

  // Handle edit checker
  const handleEditChecker = async (e) => {
    e.preventDefault();
    try {
      if (!selectedChecker) {
        toast.error('No checker selected');
        return;
      }

      // Remove empty password field to avoid updating it
      const updateData = { ...editForm };
      if (!updateData.newPassword || updateData.newPassword.trim() === '') {
        delete updateData.newPassword;
      }

      await ApiService.updateChecker(selectedChecker.id, updateData);
      toast.success('Checker updated successfully');
      setShowEditModal(false);
      setSelectedChecker(null);
      loadCheckers();
    } catch (error) {
      console.error('Error updating checker:', error);
      toast.error(error.message || 'Failed to update checker');
    }
  };

  // Handle delete checker
  const handleDeleteChecker = async () => {
    try {
      if (!checkerToDelete) {
        toast.error('No checker selected for deletion');
        return;
      }

      await ApiService.deleteChecker(checkerToDelete.id);
      toast.success('Checker deleted successfully');
      setShowDeleteConfirm(false);
      setCheckerToDelete(null);
      loadCheckers();
    } catch (error) {
      console.error('Error deleting checker:', error);
      toast.error(error.message || 'Failed to delete checker');
    }
  };

  // Handle toggle checker status
  const handleToggleStatus = async (checker) => {
    try {
      await ApiService.toggleCheckerStatus(checker.id, !checker.isActive);
      toast.success(`Checker ${!checker.isActive ? 'activated' : 'deactivated'} successfully`);
      loadCheckers();
    } catch (error) {
      console.error('Error toggling checker status:', error);
      toast.error(error.message || 'Failed to update checker status');
    }
  };

  // Open edit modal
  const openEditModal = (checker) => {
    setSelectedChecker(checker);
    setEditForm({
      firstName: checker.firstName || '',
      lastName: checker.lastName || '',
      username: checker.username || '',
      email: checker.email || '',
      phone: checker.phone || '',
      address: checker.address || '',
      isActive: checker.isActive !== false, // Default to true if undefined
      newPassword: ''
    });
    setShowEditModal(true);
  };

  // Open delete confirmation
  const openDeleteConfirm = (checker) => {
    setCheckerToDelete(checker);
    setShowDeleteConfirm(true);
  };

  // Helper function to get checker display name
  const getCheckerDisplayName = (checker) => {
    if (checker.name) return checker.name;
    if (checker.firstName && checker.lastName) {
      return `${checker.firstName} ${checker.lastName}`;
    }
    if (checker.firstName) return checker.firstName;
    if (checker.lastName) return checker.lastName;
    return checker.email || 'Unknown Checker';
  };

  if (isLoading) {
    return (
      <div className="checker-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading checker management...</p>
      </div>
    );
  }

  return (
    <div className="checker-management">
      {/* Header with Stats */}
      <div className="checker-management-header">
        <div className="header-title">
          <h2>Checker Management</h2>
          <p>Manage checker accounts and permissions</p>
        </div>
        
        <div className="checker-stats">
          <div className="stat-card">
            <div className="stat-icon total">
              <HiOutlineUser />
            </div>
            <div className="stat-content">
              <span className="stat-number">{checkerStats.totalCheckers || 0}</span>
              <span className="stat-label">TOTAL CHECKERS</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon active">
              <FiUserCheck />
            </div>
            <div className="stat-content">
              <span className="stat-number">{checkerStats.activeCheckers || 0}</span>
              <span className="stat-label">ACTIVE</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon inactive">
              <FiUserX />
            </div>
            <div className="stat-content">
              <span className="stat-number">{checkerStats.inactiveCheckers || 0}</span>
              <span className="stat-label">INACTIVE</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon created">
              <HiOutlineUserAdd />
            </div>
            <div className="stat-content">
              <span className="stat-number">{checkerStats.adminCreated || 0}</span>
              <span className="stat-label">ADMIN CREATED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="checker-controls">
        <div className="search-and-filter">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search checkers by name, email, or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
        
        <div className="action-buttons">
          <button
            onClick={loadCheckers}
            className="refresh-btn"
          >
            <FiRefreshCw className="btn-icon" />
            Refresh
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="create-btn"
          >
            <HiOutlineUserAdd className="btn-icon" />
            Add New Checker
          </button>
        </div>
      </div>

      {/* Checkers Table */}
      <div className="checkers-table-container">
        <table className="checkers-table">
          <thead>
            <tr>
              <th>Checker Details</th>
              <th>Contact Info</th>
              <th>Status</th>
              <th>Statistics</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCheckers.map((checker) => (
              <tr key={checker.id} className={!checker.isActive ? 'inactive-row' : ''}>
                <td>
                  <div className="checker-details">
                    <div className="checker-name">
                      <strong>{getCheckerDisplayName(checker)}</strong>
                      {checker.username && (
                        <span className="username">@{checker.username}</span>
                      )}
                    </div>
                    <div className="checker-id">ID: {checker.id}</div>
                  </div>
                </td>
                
                <td>
                  <div className="contact-info">
                    <div className="email">
                      <i className="fas fa-envelope"></i>
                      {checker.email}
                    </div>
                    {checker.phone && (
                      <div className="phone">
                        <i className="fas fa-phone"></i>
                        {checker.phone}
                      </div>
                    )}
                  </div>
                </td>
                
                <td>
                  <div className="status-info">
                    <span className={`status-badge ${checker.isActive ? 'active' : 'inactive'}`}>
                      {checker.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {checker.lastLoginDate && (
                      <div className="last-login">
                        Last login: {new Date(checker.lastLoginDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </td>
                
                <td>
                  <div className="checker-stats">
                    <div className="stat-item">
                      <strong>{checker.statistics?.totalAssigned || 0}</strong>
                      <span>Assigned</span>
                    </div>
                    <div className="stat-item">
                      <strong>{checker.statistics?.approved || 0}</strong>
                      <span>Approved</span>
                    </div>
                    <div className="stat-item">
                      <strong>{checker.statistics?.reviewRate || 0}%</strong>
                      <span>Review Rate</span>
                    </div>
                  </div>
                </td>
                
                <td>
                  <div className="creation-info">
                    <div className="creation-date">
                      {checker.createdAt ? new Date(checker.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="creation-method">
                      {checker.creationMethod === 'admin_created' ? (
                        <span className="admin-created">
                          <i className="fas fa-user-cog"></i>
                          Admin Created
                        </span>
                      ) : (
                        <span className="self-registered">
                          <i className="fas fa-user"></i>
                          Self Registered
                        </span>
                      )}
                    </div>
                    {checker.createdBy && (
                      <div className="created-by">
                        by {checker.createdBy.name || 'Unknown'}
                      </div>
                    )}
                  </div>
                </td>
                
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => openEditModal(checker)}
                      className="edit-btn action-btn"
                      title="Edit Checker Details"
                    >
                      <FiEdit3 className="action-icon" />
                      <span className="action-label">Edit</span>
                    </button>
                    
                    <button
                      onClick={() => handleToggleStatus(checker)}
                      className={`toggle-btn action-btn ${checker.isActive ? 'deactivate' : 'activate'}`}
                      title={checker.isActive ? 'Deactivate Checker' : 'Activate Checker'}
                    >
                      {checker.isActive ? (
                        <>
                          <HiOutlineShieldExclamation className="action-icon" />
                          <span className="action-label">Deactivate</span>
                        </>
                      ) : (
                        <>
                          <HiOutlineShieldCheck className="action-icon" />
                          <span className="action-label">Activate</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => openDeleteConfirm(checker)}
                      className="delete-btn action-btn"
                      title="Delete Checker Permanently"
                    >
                      <FiTrash2 className="action-icon" />
                      <span className="action-label">Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredCheckers.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-users"></i>
            <h3>No checkers found</h3>
            <p>
              {searchTerm || statusFilter !== 'all' 
                ? 'No checkers match your current filters'
                : 'Get started by creating your first checker account'
              }
            </p>
          </div>
        )}
      </div>

      {/* Create Checker Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Checker</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="modal-close"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleCreateChecker} className="checker-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({...createForm, firstName: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({...createForm, lastName: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Username (optional)</label>
                  <input
                    type="text"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({...createForm, username: e.target.value})}
                    placeholder="Optional username for login"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                  required
                  minLength="6"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({...createForm, phone: e.target.value})}
                    placeholder="+961-XX-XXXXXX"
                  />
                </div>
                
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={createForm.address}
                    onChange={(e) => setCreateForm({...createForm, address: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={createForm.sendNotification}
                    onChange={(e) => setCreateForm({...createForm, sendNotification: e.target.checked})}
                  />
                  <span className="checkmark"></span>
                  Send welcome email with login credentials
                </label>
              </div>
              
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create Checker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Checker Modal */}
      {showEditModal && selectedChecker && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Checker: {getCheckerDisplayName(selectedChecker)}</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="modal-close"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleEditChecker} className="checker-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={editForm.newPassword}
                  onChange={(e) => setEditForm({...editForm, newPassword: e.target.value})}
                  placeholder="Enter new password or leave blank"
                />
              </div>
              
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})}
                  />
                  <span className="checkmark"></span>
                  Account is active
                </label>
              </div>
              
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Update Checker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && checkerToDelete && (
        <div className="modal-overlay">
          <div className="modal-content delete-confirm">
            <div className="modal-header">
              <h3>Delete Checker</h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="modal-close"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="delete-content">
              <div className="warning-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h4>Are you sure you want to delete this checker?</h4>
              <p>
                <strong>{getCheckerDisplayName(checkerToDelete)}</strong> ({checkerToDelete.email})
              </p>
              <p className="warning-text">
                This action cannot be undone. The checker will be permanently removed 
                and will no longer be able to access the system.
              </p>
              
              {checkerToDelete.statistics?.totalAssigned > 0 && (
                <div className="cases-warning">
                  <i className="fas fa-info-circle"></i>
                  This checker has {checkerToDelete.statistics.totalAssigned} assigned cases.
                  Make sure to reassign them before deletion.
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChecker}
                className="delete-btn"
              >
                Delete Checker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckerManagement;