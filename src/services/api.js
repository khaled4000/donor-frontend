// API Service for Backend Integration
import { regularAuthStorage, adminAuthStorage } from '../utils/authStorage';
import config from '../config/environment';

const API_BASE_URL = config.API_BASE_URL;
const DEBUG_MODE = config.DEBUG_MODE && localStorage.getItem('apiDebug') === 'true';

class ApiService {
  // Helper to enable debugging in console: ApiService.enableDebug()
  static enableDebug() {
    localStorage.setItem('apiDebug', 'true');
    console.log('🔧 API Debug mode enabled');
  }

  static disableDebug() {
    localStorage.removeItem('apiDebug');
    console.log('🔧 API Debug mode disabled');
  }
  static getAuthHeaders() {
    // Use namespaced token storage consistent with AuthContext
    const authData = regularAuthStorage.getAuth();
    const token = authData.token;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    if (DEBUG_MODE) {
      console.log('🔍 API DEBUG - Request URL:', url);
      console.log('🔍 API DEBUG - Request config:', config);
    }

    try {
      const response = await fetch(url, config);
      
      if (DEBUG_MODE) {
        console.log('🔍 API DEBUG - Response status:', response.status);
        console.log('🔍 API DEBUG - Response headers:', Object.fromEntries(response.headers.entries()));
      }
      
      let data;
      try {
        data = await response.json();
        if (DEBUG_MODE) {
          console.log('🔍 API DEBUG - Response data:', data);
        }
      } catch (parseError) {
        console.error('❌ API ERROR - Failed to parse JSON response:', parseError);
        // Don't try to read response.text() again - the body stream is already consumed
        throw new Error(`Server returned invalid JSON. Status: ${response.status}. Response: ${parseError.message}`);
      }

      if (!response.ok) {
        let errorMessage;
        if (response.status === 404) {
          errorMessage = `API endpoint not found. Please ensure the backend server is running and the route exists. Status: ${response.status}`;
        } else if (response.status === 401) {
          // Handle authentication failures
          const authMessage = data.message || data.error || 'Authentication failed';
          if (authMessage.includes('token') || authMessage.includes('authorization denied')) {
            // Clear invalid token and redirect to login
            regularAuthStorage.clearAuth();
            errorMessage = 'No token, authorization denied';
          } else {
            errorMessage = authMessage;
          }
        } else if (response.status === 403) {
          errorMessage = 'Access forbidden. Please check your permissions.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = data.message || data.error || `HTTP error! status: ${response.status}`;
        }
        
        if (DEBUG_MODE) {
          console.error('❌ API ERROR - Server error:', errorMessage);
        }
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      if (DEBUG_MODE) {
        console.error('❌ API ERROR - Request failed:', error);
      }
      throw error;
    }
  }

  // Auth APIs
  static async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  static async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  static async getProfile() {
    return this.request('/auth/profile');
  }

  static async updateProfile(userData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Email Verification APIs
  static async verifyEmail(token, email) {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token, email }),
    });
  }

  static async resendVerification(email) {
    return this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  static async forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  static async resetPassword(token, email, newPassword) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, email, newPassword }),
    });
  }

  // Case Management APIs
  static async createCase(caseData) {
    return this.request('/cases', {
      method: 'POST',
      body: JSON.stringify(caseData),
    });
  }

  static async getMyCases() {
    return this.request('/cases/my-cases');
  }

  static async getCase(caseId) {
    return this.request(`/cases/${caseId}`);
  }

  static async updateCase(caseId, caseData) {
    return this.request(`/cases/${caseId}`, {
      method: 'PUT',
      body: JSON.stringify(caseData),
    });
  }

  static async submitCase(caseId) {
    return this.request(`/cases/${caseId}/submit`, {
      method: 'POST',
    });
  }

  static async getVerifiedCases(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/cases/verified/list${queryString ? `?${queryString}` : ''}`);
  }

  static async getApprovedCases(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/cases/approved${queryString ? `?${queryString}` : ''}`);
  }

  static async getFullyFundedCases(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/cases/fully-funded${queryString ? `?${queryString}` : ''}`);
  }

  // Donation APIs
  static async makeDonation(donationData) {
    return this.request('/donations', {
      method: 'POST',
      body: JSON.stringify(donationData),
    });
  }

  static async getDonationHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/donations/history${queryString ? `?${queryString}` : ''}`);
  }

  static async getDonorStats() {
    return this.request('/donations/stats');
  }

  // Admin/Checker APIs
  static async getPendingCases() {
    return this.request('/admin/cases/pending');
  }

  static async getCaseForReview(caseId) {
    return this.request(`/admin/cases/${caseId}/review`);
  }

  static async submitCaseDecision(caseId, decisionData) {
    return this.request(`/admin/cases/${caseId}/decision`, {
      method: 'POST',
      body: JSON.stringify(decisionData),
    });
  }

  static async deleteCase(caseId) {
    return this.request(`/admin/cases/${caseId}`, {
      method: 'DELETE',
    });
  }

  // Stats APIs
  static async getStats() {
    return this.request('/stats');
  }

  static async getImpactStats() {
    return this.request('/stats/impact');
  }

  // File APIs
  static async uploadFile(fileData) {
    return this.request('/files/upload', {
      method: 'POST',
      body: JSON.stringify(fileData),
    });
  }

  static async getFile(fileId) {
    return this.request(`/files/${fileId}`);
  }

  static async deleteFile(fileId) {
    return this.request(`/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  // Checker APIs with Admin Headers
  static getCheckerAuthHeaders() {
    // Use admin auth storage for checker operations
    const authData = adminAuthStorage.getAuth();
    const token = authData.token;
    
    if (DEBUG_MODE) {
      console.log('🔍 CHECKER AUTH DEBUG - Auth data:', authData);
      console.log('🔍 CHECKER AUTH DEBUG - Token exists:', !!token);
    }
    
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  static async checkerRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getCheckerAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    if (DEBUG_MODE) {
      console.log('🔍 CHECKER API DEBUG - Request URL:', url);
      console.log('🔍 CHECKER API DEBUG - Request config:', config);
    }

    try {
      const response = await fetch(url, config);
      
      let data;
      try {
        data = await response.json();
        if (DEBUG_MODE) {
          console.log('🔍 CHECKER API DEBUG - Response data:', data);
        }
      } catch (parseError) {
        throw new Error(`Server returned invalid JSON. Status: ${response.status}`);
      }

      if (!response.ok) {
        const errorMessage = data.message || data.error || `HTTP error! status: ${response.status}`;
        if (DEBUG_MODE) {
          console.error('❌ CHECKER API ERROR:', errorMessage);
        }
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      if (DEBUG_MODE) {
        console.error('❌ CHECKER API ERROR:', error);
      }
      throw error;
    }
  }

  static async getCheckerCases() {
    return this.checkerRequest('/checker/cases');
  }

  static async getCheckerStats() {
    return this.checkerRequest('/checker/stats');
  }

  static async getCheckerCase(caseId) {
    return this.checkerRequest(`/checker/cases/${caseId}`);
  }

  static async assignCaseToChecker(caseId, checkerData) {
    return this.checkerRequest(`/checker/cases/${caseId}/assign`, {
      method: 'POST',
      body: JSON.stringify(checkerData),
    });
  }

  // Fixed checker decision submission
  static async submitCheckerDecision(caseId, decisionData) {
    // Validate required fields
    if (!decisionData.decision) {
      throw new Error('Decision is required');
    }
    
    if (!decisionData.comments || !decisionData.comments.trim()) {
      throw new Error('Comments are required');
    }

    // Build the payload with proper validation
    const payload = {
      decision: decisionData.decision,
      comments: decisionData.comments.trim(),
      checkerId: decisionData.checkerId,
      checkerName: decisionData.checkerName || 'Unknown Checker',
      reviewCompletedAt: new Date().toISOString(),
    };

    // Add assessment fields only for approved cases
    if (decisionData.decision === 'approved') {
      if (!decisionData.finalDamagePercentage && !decisionData.finalDestructionPercentage) {
        throw new Error('Damage percentage is required for approval');
      }
      
      if (!decisionData.estimatedCost && !decisionData.finalRebuildingCost) {
        throw new Error('Estimated cost is required for approval');
      }

      // Use the correct field names and ensure they're numbers
      const damagePercentage = parseFloat(
        decisionData.finalDamagePercentage || decisionData.finalDestructionPercentage
      );
      const estimatedCost = parseFloat(
        decisionData.estimatedCost || decisionData.finalRebuildingCost
      );

      if (isNaN(damagePercentage) || damagePercentage < 0 || damagePercentage > 100) {
        throw new Error('Invalid damage percentage');
      }

      if (isNaN(estimatedCost) || estimatedCost <= 0) {
        throw new Error('Invalid estimated cost');
      }

      payload.finalDamagePercentage = damagePercentage;
      payload.estimatedCost = estimatedCost;
      
      // Include field notes if provided
      if (decisionData.fieldNotes) {
        payload.fieldNotes = decisionData.fieldNotes;
      }
    }

    if (DEBUG_MODE) {
      console.log('🔍 CHECKER DECISION DEBUG - Payload:', payload);
    }

    return this.checkerRequest(`/checker/cases/${caseId}/decision`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Admin Checker Management APIs
  static getAdminAuthHeaders() {
    // Get admin token from admin storage using the proper utility
    const authData = adminAuthStorage.getAuth();
    const token = authData.token;
    
    if (DEBUG_MODE) {
      console.log('🔍 ADMIN AUTH DEBUG - Auth data:', authData);
      console.log('🔍 ADMIN AUTH DEBUG - Token exists:', !!token);
    }
    
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  static async adminRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAdminAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    if (DEBUG_MODE) {
      console.log('🔍 ADMIN API DEBUG - Request URL:', url);
      console.log('🔍 ADMIN API DEBUG - Request config:', config);
    }

    try {
      const response = await fetch(url, config);
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error(`Server returned invalid JSON. Status: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('❌ ADMIN API ERROR:', error);
      throw error;
    }
  }

  // Get all checkers
  static async getCheckers(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.adminRequest(`/admin/checker-management/checkers${queryParams ? `?${queryParams}` : ''}`);
  }

  // Get specific checker details
  static async getChecker(checkerId) {
    return this.adminRequest(`/admin/checker-management/checkers/${checkerId}`);
  }

  // Create new checker
  static async createChecker(checkerData) {
    return this.adminRequest('/admin/checker-management/checkers', {
      method: 'POST',
      body: JSON.stringify(checkerData),
    });
  }

  // Update checker
  static async updateChecker(checkerId, updateData) {
    return this.adminRequest(`/admin/checker-management/checkers/${checkerId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Delete checker
  static async deleteChecker(checkerId) {
    return this.adminRequest(`/admin/checker-management/checkers/${checkerId}`, {
      method: 'DELETE',
    });
  }

  // Toggle checker status
  static async toggleCheckerStatus(checkerId, isActive) {
    return this.adminRequest(`/admin/checker-management/checkers/${checkerId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  // Get checker statistics
  static async getCheckerManagementStats() {
    return this.adminRequest('/admin/checker-management/checkers/stats/overview');
  }
}

export default ApiService;