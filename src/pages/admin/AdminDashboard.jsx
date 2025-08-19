import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import { adminAuthStorage } from '../../utils/authStorage';
import CheckerManagement from './components/CheckerManagement';
import './AdminDashboard.css';

// Import React Icons for enhanced dashboard buttons and stats
import { 
  FiLogOut, 
  FiArrowLeft, 
  FiUser, 
  FiUsers, 
  FiFileText, 
  FiCheckCircle, 
  FiXCircle, 
  FiClock,
  FiGrid,
  FiList,
  FiUserCheck,
  FiDollarSign,
  FiRefreshCw
} from 'react-icons/fi';

const AdminDashboard = () => {
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState('kanban');
  const [kanbanData, setKanbanData] = useState({
    submitted: [],
    under_review: [],
    approved: []
  });
  const [allCases, setAllCases] = useState([]);
  const [fullyFundedCases, setFullyFundedCases] = useState([]);
  const [users, setUsers] = useState([]);
  const [checkers, setCheckers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [draggedCase, setDraggedCase] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  // API rate limiting and request management
  const [isApiRequestInProgress, setIsApiRequestInProgress] = useState(false);
  const lastApiRequestTime = useRef(0);
  const MIN_API_REQUEST_INTERVAL = 1000; // Increased to 1 second between API requests
  const dataRefreshInterval = useRef(null);

  // Calculate dynamic stats from existing data
  const stats = useMemo(() => {
    const allCasesData = activeTab === 'cases' ? allCases : [
      ...kanbanData.submitted,
      ...kanbanData.under_review,
      ...kanbanData.approved
    ];

    const pending = kanbanData.submitted.length;
    const underReview = kanbanData.under_review.length;
    const approved = kanbanData.approved.length;
    const rejected = allCasesData.filter(c => c.status === 'rejected').length;
    const families = users.filter(u => u.role === 'family').length;

    return {
      cases: {
        pending,
        under_review: underReview,
        approved,
        rejected
      },
      users: {
        families
      }
    };
  }, [kanbanData, allCases, users, activeTab]);

  // API request throttling function
  const throttledApiRequest = useCallback(async (requestFn) => {
    const now = Date.now();
    if (now - lastApiRequestTime.current < MIN_API_REQUEST_INTERVAL) {
      return; // Skip if too soon
    }

    if (isApiRequestInProgress) {
      return; // Skip if already in progress
    }

    setIsApiRequestInProgress(true);
    try {
      await requestFn();
      lastApiRequestTime.current = now;
    } catch (error) {
      console.error('API request failed:', error);
    } finally {
      setIsApiRequestInProgress(false);
    }
  }, [isApiRequestInProgress]);

  // Verify admin authentication
  const verifyAdminAuth = useCallback(async () => {
    const authData = adminAuthStorage.getAuth();
    
    if (!authData.isAuthenticated) {
      navigate('/admin/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/admin/auth/verify', {
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAdminUser(data.admin);
        setIsLoading(false);
      } else {
        adminAuthStorage.clearAuth();
        navigate('/admin/login');
      }
    } catch (error) {
      console.error('Auth verification error:', error);
      setError('Authentication verification failed. Please check your connection.');
      setIsLoading(false);
    }
  }, [navigate]);

  // Load kanban data
  const loadKanbanData = useCallback(async () => {
    await throttledApiRequest(async () => {
      try {
        const authData = adminAuthStorage.getAuth();
        const token = authData.token;
        const response = await fetch('http://localhost:5000/api/admin/cases/kanban', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setKanbanData(data.data);
        }
      } catch (error) {
        console.error('Error loading kanban data:', error);
      }
    });
  }, [throttledApiRequest]);

  // Load all cases
  const loadAllCases = useCallback(async () => {
    await throttledApiRequest(async () => {
      try {
        const authData = adminAuthStorage.getAuth();
        const token = authData.token;
        const response = await fetch('http://localhost:5000/api/admin/cases/all', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setAllCases(data.cases);
        }
      } catch (error) {
        console.error('Error loading all cases:', error);
      }
    });
  }, [throttledApiRequest]);

  // Load fully funded cases
  const loadFullyFundedCases = useCallback(async () => {
    await throttledApiRequest(async () => {
      try {
        const authData = adminAuthStorage.getAuth();
        const token = authData.token;
        const response = await fetch('http://localhost:5000/api/cases/fully-funded', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setFullyFundedCases(data.data.cases || []);
        }
      } catch (error) {
        console.error('Error loading fully funded cases:', error);
      }
    });
  }, [throttledApiRequest]);

  // Load users
  const loadUsers = useCallback(async () => {
    await throttledApiRequest(async () => {
      try {
        const authData = adminAuthStorage.getAuth();
        const token = authData.token;
        const response = await fetch('http://localhost:5000/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setUsers(data.users);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      }
    });
  }, [throttledApiRequest]);

  // Load checkers
  const loadCheckers = useCallback(async () => {
    await throttledApiRequest(async () => {
      try {
        const authData = adminAuthStorage.getAuth();
        const token = authData.token;
        const response = await fetch('http://localhost:5000/api/admin/checkers', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setCheckers(data.checkers);
        }
      } catch (error) {
        console.error('Error loading checkers:', error);
      }
    });
  }, [throttledApiRequest]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      adminAuthStorage.clearAuth();
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if there's an error
      window.location.href = '/';
    } finally {
      setTimeout(() => setIsLoggingOut(false), 1000);
    }
  }, [isLoggingOut, navigate]);

  // Modal handlers
  const handleModalOverlayClick = useCallback((event) => {
    if (event.target === event.currentTarget) {
      setShowCaseModal(false);
    }
  }, []);

  const handleModalContentClick = useCallback((event) => {
    event.stopPropagation();
  }, []);

  // Load tab data when tab changes
  const loadTabData = useCallback(async () => {
    if (!adminUser) return;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      switch (activeTab) {
        case 'kanban':
          await loadKanbanData();
          break;
        case 'cases':
          await loadAllCases();
          break;
        case 'fully-funded':
          await loadFullyFundedCases();
          break;
        case 'users':
          await loadUsers();
          break;
        case 'checkers':
          await loadCheckers();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error loading tab data:', error);
      setError(`Failed to load ${activeTab} data`);
    }
  }, [activeTab, adminUser, loadKanbanData, loadAllCases, loadFullyFundedCases, loadUsers, loadCheckers]);

  // Set up data refresh interval (only when needed)
  const setupDataRefresh = useCallback(() => {
    if (dataRefreshInterval.current) {
      clearInterval(dataRefreshInterval.current);
    }
    
    // Only refresh data every 30 seconds when on active tabs
    dataRefreshInterval.current = setInterval(() => {
      if (adminUser && !isLoading) {
        loadTabData();
      }
    }, 30000);
  }, [adminUser, isLoading, loadTabData]);

  // Initial authentication verification
  useEffect(() => {
    verifyAdminAuth();
  }, [verifyAdminAuth]);

  // Load tab data when tab changes
  useEffect(() => {
    if (adminUser) {
      loadTabData();
    }
  }, [activeTab, adminUser, loadTabData]);

  // Set up data refresh interval
  useEffect(() => {
    if (adminUser) {
      setupDataRefresh();
    }
    
    return () => {
      if (dataRefreshInterval.current) {
        clearInterval(dataRefreshInterval.current);
      }
    };
  }, [adminUser, setupDataRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dataRefreshInterval.current) {
        clearInterval(dataRefreshInterval.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="admin-dashboard-loading">
        <ClipLoader size={50} color="#007bff" />
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Admin Dashboard</h1>
          <div className="header-actions">
            <button 
              className="refresh-btn"
              onClick={loadTabData}
              disabled={isApiRequestInProgress}
            >
              <FiRefreshCw className={isApiRequestInProgress ? 'spinning' : ''} />
              Refresh
            </button>
            <button 
              className="logout-btn"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <FiLogOut />
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'kanban' ? 'active' : ''}`}
          onClick={() => setActiveTab('kanban')}
        >
          <FiGrid />
          Kanban Board
        </button>
        <button 
          className={`tab ${activeTab === 'cases' ? 'active' : ''}`}
          onClick={() => setActiveTab('cases')}
        >
          <FiList />
          All Cases
        </button>
        <button 
          className={`tab ${activeTab === 'fully-funded' ? 'active' : ''}`}
          onClick={() => setActiveTab('fully-funded')}
        >
          <FiDollarSign />
          Fully Funded
        </button>
        <button 
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <FiUsers />
          Users
        </button>
        <button 
          className={`tab ${activeTab === 'checkers' ? 'active' : ''}`}
          onClick={() => setActiveTab('checkers')}
        >
          <FiUserCheck />
          Checkers
        </button>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <FiFileText />
          <div className="stat-content">
            <h3>{stats.cases.pending}</h3>
            <p>Pending Cases</p>
          </div>
        </div>
        <div className="stat-card">
          <FiClock />
          <div className="stat-content">
            <h3>{stats.cases.under_review}</h3>
            <p>Under Review</p>
          </div>
        </div>
        <div className="stat-card">
          <FiCheckCircle />
          <div className="stat-content">
            <h3>{stats.cases.approved}</h3>
            <p>Approved</p>
          </div>
        </div>
        <div className="stat-card">
          <FiUsers />
          <div className="stat-content">
            <h3>{stats.users.families}</h3>
            <p>Families</p>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'kanban' && (
          <div className="kanban-section">
            <h2>Case Management Kanban</h2>
            {/* Kanban board implementation would go here */}
            <p>Kanban board content</p>
          </div>
        )}
        
        {activeTab === 'cases' && (
          <div className="cases-section">
            <h2>All Cases</h2>
            <p>Total cases: {allCases.length}</p>
            {/* Cases list implementation would go here */}
          </div>
        )}
        
        {activeTab === 'fully-funded' && (
          <div className="fully-funded-section">
            <h2>Fully Funded Cases</h2>
            <p>Total fully funded: {fullyFundedCases.length}</p>
            {/* Fully funded cases implementation would go here */}
          </div>
        )}
        
        {activeTab === 'users' && (
          <div className="users-section">
            <h2>User Management</h2>
            <p>Total users: {users.length}</p>
            {/* User management implementation would go here */}
          </div>
        )}
        
        {activeTab === 'checkers' && (
          <div className="checkers-section">
            <h2>Checker Management</h2>
            <CheckerManagement />
          </div>
        )}
      </div>

      {/* Case Modal */}
      {showCaseModal && selectedCase && (
        <div className="modal-overlay" onClick={handleModalOverlayClick}>
          <div className="modal-content" onClick={handleModalContentClick}>
            <h3>Case Details</h3>
            <p>Case ID: {selectedCase.caseId}</p>
            {/* More case details would go here */}
            <button onClick={() => setShowCaseModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;