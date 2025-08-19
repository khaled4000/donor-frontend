// import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { toast } from 'react-toastify';
// import { ClipLoader } from 'react-spinners';
// import { adminAuthStorage } from '../../utils/authStorage';
// import CheckerManagement from './components/CheckerManagement';
// import './AdminDashboard.css';

// // Import React Icons for enhanced dashboard buttons and stats
// import { 
//   FiLogOut, 
//   FiArrowLeft, 
//   FiUser, 
//   FiUsers, 
//   FiFileText, 
//   FiCheckCircle, 
//   FiXCircle, 
//   FiClock,
//   FiGrid,
//   FiList,
//   FiUserCheck,
//   FiDollarSign,
//   FiRefreshCw
// } from 'react-icons/fi';

// // Alternative logout icon import
// import { HiOutlineLogout } from 'react-icons/hi';
// import { 
//   HiOutlineClipboardList,
//   HiOutlineUserGroup,
//   HiOutlineDocumentText,
//   HiOutlineCheckCircle,
//   HiOutlineXCircle,
//   HiOutlineClock,
//   HiOutlineShieldCheck
// } from 'react-icons/hi';
// import { 
//   BiPieChart, 
//   BiStats,
//   BiTrendingUp,
//   BiGroup,
//   BiLogOut
// } from 'react-icons/bi';

// const AdminDashboard = () => {
//     // Generate a unique ID for this component instance
//     const componentId = React.useMemo(() => Math.random().toString(36).substr(2, 9), []);
    
//     console.log(`🔍 AdminDashboard [${componentId}]: Component rendered`);
    
//     const [adminUser, setAdminUser] = useState(null);
//     const [activeTab, setActiveTab] = useState('kanban');
//     const [kanbanData, setKanbanData] = useState({
//         submitted: [],
//         under_review: [],
//         approved: []
//     });
//     const [allCases, setAllCases] = useState([]);
//     const [fullyFundedCases, setFullyFundedCases] = useState([]);
//     const [users, setUsers] = useState([]);
//     const [checkers, setCheckers] = useState([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState('');
//     const [selectedCase, setSelectedCase] = useState(null);
//     const [showCaseModal, setShowCaseModal] = useState(false);
//     const [draggedCase, setDraggedCase] = useState(null);
//     const [isLoggingOut, setIsLoggingOut] = useState(false);
//     const navigate = useNavigate();

//     // API rate limiting
//     const [isApiRequestInProgress, setIsApiRequestInProgress] = useState(false);
//     const lastApiRequestTime = useRef(0);
//     const MIN_API_REQUEST_INTERVAL = 500; // 500ms between API requests

//     // Ref for logout button to prevent unwanted triggers
//     const logoutButtonRef = useRef(null);

//     // API request throttling function
//     const throttledApiRequest = useCallback(async (requestFn) => {
//         const now = Date.now();
//         if (now - lastApiRequestTime.current < MIN_API_REQUEST_INTERVAL) {
//             console.log(`🔒 API request throttled, waiting ${MIN_API_REQUEST_INTERVAL - (now - lastApiRequestTime.current)}ms`);
//             return;
//         }

//         if (isApiRequestInProgress) {
//             console.log('🔒 API request already in progress, skipping');
//             return;
//         }

//         setIsApiRequestInProgress(true);
//         try {
//             await requestFn();
//             lastApiRequestTime.current = now;
//         } catch (error) {
//             console.error('API request failed:', error);
//         } finally {
//             setIsApiRequestInProgress(false);
//         }
//     }, [isApiRequestInProgress]);

//     // Calculate dynamic stats from existing data
//     const stats = useMemo(() => {
//         const allCasesData = activeTab === 'cases' ? allCases : [
//             ...kanbanData.submitted,
//             ...kanbanData.under_review,
//             ...kanbanData.approved
//         ];

//         const pending = kanbanData.submitted.length;
//         const underReview = kanbanData.under_review.length;
//         const approved = kanbanData.approved.length;
//         const rejected = allCasesData.filter(c => c.status === 'rejected').length;
//         const families = users.filter(u => u.role === 'family').length;

//         return {
//             cases: {
//                 pending,
//                 under_review: underReview,
//                 approved,
//                 rejected
//             },
//             users: {
//                 families
//             }
//         };
//     }, [kanbanData, allCases, users, activeTab]);

//     // Define all functions first
//     const verifyAdminAuth = useCallback(async () => {
//         const authData = adminAuthStorage.getAuth();
        
//         console.log('🔍 Verifying admin auth:', { 
//             isAuthenticated: authData.isAuthenticated, 
//             hasToken: !!authData.token,
//             tokenLength: authData.token?.length 
//         });
        
//         if (!authData.isAuthenticated) {
//             console.log('🔒 Not authenticated, redirecting to login');
//             navigate('/admin/login');
//             return;
//         }

//         try {
//             console.log('🔍 Making auth verification request...');
//             const response = await fetch('http://localhost:5000/api/admin/auth/verify', {
//                 headers: {
//                     'Authorization': `Bearer ${authData.token}`
//                 }
//             });

//             console.log('🔍 Auth verification response:', { 
//                 status: response.status, 
//                 ok: response.ok,
//                 statusText: response.statusText
//             });

//             if (response.ok) {
//                 const data = await response.json();
//                 console.log('✅ Auth verification successful:', data);
//                 setAdminUser(data.admin);
//                 setIsLoading(false);
//             } else {
//                 console.log('❌ Auth verification failed, clearing auth and redirecting');
//                 adminAuthStorage.clearAuth();
//                 navigate('/admin/login');
//             }
//         } catch (error) {
//             console.error('❌ Auth verification error:', error);
//             // Don't automatically logout on network errors, just show error
//             setError('Authentication verification failed. Please check your connection.');
//             setIsLoading(false);
//         }
//     }, [navigate]);

//     const loadKanbanData = useCallback(async () => {
//         await throttledApiRequest(async () => {
//             try {
//                 const authData = adminAuthStorage.getAuth();
//                 const token = authData.token;
//                 const response = await fetch('http://localhost:5000/api/admin/cases/kanban', {
//                     headers: { 'Authorization': `Bearer ${token}` }
//                 });

//                 if (response.ok) {
//                     const data = await response.json();
//                     setKanbanData(data.data);
//                 }
//             } catch (error) {
//                 console.error('Error loading kanban data:', error);
//             }
//         });
//     }, [throttledApiRequest]);

//     const loadAllCases = useCallback(async () => {
//         await throttledApiRequest(async () => {
//             try {
//                 const authData = adminAuthStorage.getAuth();
//                 const token = authData.token;
//                 const response = await fetch('http://localhost:5000/api/admin/cases/all', {
//                     headers: { 'Authorization': `Bearer ${token}` }
//                 });

//                 if (response.ok) {
//                     const data = await response.json();
//                     setAllCases(data.cases);
//                 }
//             } catch (error) {
//                 console.error('Error loading all cases:', error);
//             }
//         });
//     }, [throttledApiRequest]);

//     const loadFullyFundedCases = useCallback(async () => {
//         await throttledApiRequest(async () => {
//             try {
//                 const authData = adminAuthStorage.getAuth();
//                 const token = authData.token;
//                 const response = await fetch('http://localhost:5000/api/cases/fully-funded', {
//                     headers: { 'Authorization': `Bearer ${token}` }
//                 });

//                 if (response.ok) {
//                     const data = await response.json();
//                     setFullyFundedCases(data.data.cases || []);
//                 }
//             } catch (error) {
//                 console.error('Error loading fully funded cases:', error);
//             }
//         });
//     }, [throttledApiRequest]);

//     const loadUsers = useCallback(async () => {
//         await throttledApiRequest(async () => {
//             try {
//                 const authData = adminAuthStorage.getAuth();
//                 const token = authData.token;
//                 const response = await fetch('http://localhost:5000/api/admin/users', {
//                     headers: { 'Authorization': `Bearer ${token}` }
//                 });

//                 if (response.ok) {
//                     const data = await response.json();
//                     setUsers(data.users);
//                 }
//             } catch (error) {
//                 console.error('Error loading users:', error);
//             }
//         });
//     }, [throttledApiRequest]);

//     const loadCheckers = useCallback(async () => {
//         await throttledApiRequest(async () => {
//             try {
//                 const authData = adminAuthStorage.getAuth();
//                 const token = authData.token;
//                 const response = await fetch('http://localhost:5000/api/admin/checkers', {
//                     headers: { 'Authorization': `Bearer ${token}` }
//                 });

//                 if (response.ok) {
//                     const data = await response.json();
//                     setCheckers(data.checkers || []);
//                 }
//             } catch (error) {
//                 console.error('Error loading checkers:', error);
//                 // Set empty array as fallback
//                 setCheckers([]);
//             }
//         });
//     }, [throttledApiRequest]);

//     const handleDragStart = (e, caseItem) => {
//         setDraggedCase(caseItem);
//     };

//     const handleDragOver = (e) => {
//         e.preventDefault();
//     };

//     const handleDrop = async (e, targetStatus) => {
//         e.preventDefault();
//         if (!draggedCase) return;

//         try {
//             const authData = adminAuthStorage.getAuth();
//             const token = authData.token;
//             const response = await fetch(`http://localhost:5000/api/admin/cases/${draggedCase.caseId}/status`, {
//                 method: 'PATCH',
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({ status: targetStatus })
//             });

//             if (response.ok) {
//                 toast.success(`Case moved to ${targetStatus.replace('_', ' ')}`);
//                 await loadKanbanData();
//             } else {
//                 toast.error('Failed to move case');
//             }
//         } catch (error) {
//             console.error('Error moving case:', error);
//             toast.error('Error moving case');
//         } finally {
//             setDraggedCase(null);
//         }
//     };

//     const assignChecker = async (caseId, checkerId, notes = '') => {
//         try {
//             const authData = adminAuthStorage.getAuth();
//             const token = authData.token;
//             const response = await fetch(`http://localhost:5000/api/admin/cases/${caseId}/assign`, {
//                 method: 'POST',
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({ checkerId, notes })
//             });

//             if (response.ok) {
//                 toast.success('Checker assigned successfully');
//                 await loadKanbanData();
//                 setShowCaseModal(false);
//                 setSelectedCase(null);
//             } else {
//                 const errorData = await response.json();
//                 toast.error(errorData.message || 'Failed to assign checker');
//             }
//         } catch (error) {
//             console.error('Error assigning checker:', error);
//             toast.error('Error assigning checker');
//         }
//     };

//     const updateUserStatus = async (userId, isActive) => {
//         try {
//             const authData = adminAuthStorage.getAuth();
//             const token = authData.token;
//             const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/status`, {
//                 method: 'PATCH',
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({ isActive })
//             });

//             if (response.ok) {
//                 toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
//                 await loadUsers();
//             } else {
//                 const errorData = await response.json();
//                 toast.error(errorData.message || 'Failed to update user status');
//             }
//         } catch (error) {
//             console.error('Error updating user status:', error);
//             toast.error('Error updating user status');
//         }
//     };

//     const deleteUser = async (userId) => {
//         if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
//             return;
//         }

//         try {
//             const authData = adminAuthStorage.getAuth();
//             const token = authData.token;
//             const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
//                 method: 'DELETE',
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });

//             if (response.ok) {
//                 toast.success('User deleted successfully');
//                 await loadUsers();
//             } else {
//                 const errorData = await response.json();
//                 toast.error(errorData.message || 'Failed to delete user');
//             }
//         } catch (error) {
//             console.error('Error deleting user:', error);
//             toast.error('Error deleting user');
//         }
//     };

//     // FIXED: Properly isolated logout handler with event prevention
//     const handleLogout = useCallback((event) => {
//         // Prevent event bubbling and default behavior
//         if (event) {
//             event.preventDefault();
//             event.stopPropagation();
//             event.stopImmediatePropagation();
//         }

//         // Double-check if logout is already in progress
//         if (isLoggingOut) {
//             console.log('🔒 Logout already in progress, ignoring duplicate call');
//             return;
//         }
        
//         console.log('🔓 AdminDashboard: Logout button clicked, starting logout process');
//         setIsLoggingOut(true);
        
//         // Use setTimeout to ensure state updates and prevent re-triggering
//         setTimeout(async () => {
//             try {
//                 console.log('🔓 AdminDashboard: Logging out admin user');
                
//                 // Clear admin authentication
//                 adminAuthStorage.clearAuth();
//                 console.log('🔓 AdminDashboard: Auth cleared');
                
//                 // Clear browser cache and session storage for security
//                 if (typeof window !== 'undefined') {
//                     sessionStorage.clear();
//                     console.log('🔓 AdminDashboard: Session storage cleared');
                    
//                     // Clear any cached data
//                     try {
//                         if ('caches' in window) {
//                             const cacheNames = await caches.keys();
//                             await Promise.all(
//                                 cacheNames.map(cacheName => caches.delete(cacheName))
//                             );
//                             console.log('🔓 AdminDashboard: Caches cleared');
//                         }
//                     } catch (cacheError) {
//                         console.log('ℹ️ Cache clearing not available or failed:', cacheError);
//                     }
//                 }
                
//                 console.log('🔓 AdminDashboard: Redirecting to home page');
                
//                 // Use React Router navigation to home page
//                 navigate('/', { 
//                     replace: true,
//                     state: { 
//                         fromLogout: true,
//                         message: 'You have been successfully logged out.'
//                     }
//                 });
                
//                 // Additional cleanup after navigation
//                 setTimeout(() => {
//                     setIsLoggingOut(false);
//                     // Clear any remaining state
//                     setAdminUser(null);
//                     setActiveTab('kanban');
//                     setError('');
//                     setSelectedCase(null);
//                     setShowCaseModal(false);
//                 }, 500);
                
//             } catch (error) {
//                 console.error('❌ Logout error:', error);
//                 setIsLoggingOut(false);
                
//                 // Fallback: Force navigation to home even if there's an error
//                 try {
//                     navigate('/', { replace: true });
//                 } catch (navError) {
//                     console.error('❌ Navigation fallback failed:', navError);
//                     // Last resort: use window.location
//                     window.location.href = '/';
//                 }
//             }
//         }, 100); // Small delay to ensure clean state management
//     }, [isLoggingOut, navigate]);

//     // FIXED: Modal click handler with proper event isolation
//     const handleModalOverlayClick = useCallback((event) => {
//         // Only close modal if clicking directly on the overlay, not its children
//         if (event.target === event.currentTarget) {
//             event.preventDefault();
//             event.stopPropagation();
//             setShowCaseModal(false);
//         }
//     }, []);

//     const handleModalContentClick = useCallback((event) => {
//         // Prevent modal from closing when clicking inside the modal content
//         event.stopPropagation();
//     }, []);

//     // useEffect hooks
//     useEffect(() => {
//         console.log(`🔍 AdminDashboard [${componentId}]: useEffect triggered, verifying admin auth`);
        
//         // Add a small delay to prevent immediate execution
//         const timer = setTimeout(() => {
//             console.log(`🔍 AdminDashboard [${componentId}]: Executing verifyAdminAuth after delay`);
//             verifyAdminAuth();
//         }, 100);
        
//         // Cleanup function
//         return () => {
//             console.log(`🔍 AdminDashboard [${componentId}]: Component cleanup`);
//             clearTimeout(timer);
//         };
//     }, [verifyAdminAuth, componentId]);

//     useEffect(() => {
//         if (adminUser) {
//             const loadTabData = async () => {
//                 try {
//                     // Add a small delay to prevent overwhelming the API
//                     await new Promise(resolve => setTimeout(resolve, 200));
                    
//                     if (activeTab === 'kanban') {
//                         await loadKanbanData();
//                     } else if (activeTab === 'cases') {
//                         await loadAllCases();
//                     } else if (activeTab === 'fully-funded') {
//                         await loadFullyFundedCases();
//                     } else if (activeTab === 'users') {
//                         await loadUsers();
//                     } else if (activeTab === 'checkers') {
//                         await loadCheckers();
//                     }
//                 } catch (error) {
//                     console.error('Error loading tab data:', error);
//                     setError(`Failed to load ${activeTab} data`);
//                 }
//             };
            
//             loadTabData();
//         }
//     }, [activeTab, adminUser, loadKanbanData, loadAllCases, loadFullyFundedCases, loadUsers, loadCheckers]);

//     // FIXED: Add cleanup effect to prevent memory leaks and handle logout
//     useEffect(() => {
//         // Cleanup function for component unmounting
//         return () => {
//             console.log(`🔍 AdminDashboard [${componentId}]: Component unmounting, cleaning up`);
            
//             // Clear any pending timeouts or intervals
//             if (typeof window !== 'undefined') {
//                 // Clear any pending API calls
//                 setError('');
//                 setIsLoading(false);
//                 setIsLoggingOut(false);
                
//                 // If we're logging out, ensure we don't leave any hanging state
//                 if (isLoggingOut) {
//                     console.log('🔓 Cleanup: Logout in progress during unmount');
//                     adminAuthStorage.clearAuth();
//                     sessionStorage.clear();
//                 }
//             }
//         };
//     }, [componentId, isLoggingOut]);

//     // FIXED: Add effect to handle post-logout cleanup
//     useEffect(() => {
//         // If user is logged out (no adminUser) and we're not loading, redirect to home
//         if (!isLoading && !adminUser && !isLoggingOut) {
//             const authData = adminAuthStorage.getAuth();
//             if (!authData.isAuthenticated) {
//                 console.log('🔓 No authenticated admin user found, redirecting to home');
//                 navigate('/', { 
//                     replace: true,
//                     state: { 
//                         message: 'Please log in to access the admin dashboard.'
//                     }
//                 });
//             }
//         }
//     }, [adminUser, isLoading, isLoggingOut, navigate]);

//     // Global error handler
//     useEffect(() => {
//         const handleGlobalError = (event) => {
//             console.error('Global error caught:', event.error);
//             setError('An unexpected error occurred. Please refresh the page.');
//         };

//         const handleUnhandledRejection = (event) => {
//             console.error('Unhandled promise rejection:', event.reason);
//             setError('A network error occurred. Please check your connection.');
//         };

//         window.addEventListener('error', handleGlobalError);
//         window.addEventListener('unhandledrejection', handleUnhandledRejection);

//         return () => {
//             window.removeEventListener('error', handleGlobalError);
//             window.removeEventListener('unhandledrejection', handleUnhandledRejection);
//         };
//     }, []);

//     // FIXED: Add global click handler to prevent unwanted logout triggers
//     useEffect(() => {
//         const handleGlobalClick = (event) => {
//             // Ensure clicks on logout button don't trigger multiple times
//             if (logoutButtonRef.current && logoutButtonRef.current.contains(event.target)) {
//                 return; // Let the button's own handler deal with it
//             }
            
//             // Prevent any accidental logout triggers from other clicks
//             if (isLoggingOut) {
//                 event.preventDefault();
//                 event.stopPropagation();
//             }
//         };

//         document.addEventListener('click', handleGlobalClick, true);
        
//         return () => {
//             document.removeEventListener('click', handleGlobalClick, true);
//         };
//     }, [isLoggingOut]);

//     // Error boundary fallback
//     if (error && (error.includes('network') || error.includes('connection'))) {
//         return (
//             <div className="admin-dashboard">
//                 <div className="admin-header">
//                     <div className="admin-header-left">
//                         <h1>Admin Dashboard</h1>
//                         <p>Connection Error</p>
//                     </div>
//                     <div className="admin-header-right">
//                         <button 
//                             onClick={() => navigate('/')} 
//                             className="back-btn"
//                             type="button"
//                             style={{ marginRight: '10px' }}
//                         >
//                             <FiArrowLeft size={18} className="btn-icon" />
//                             <span>Go Home</span>
//                         </button>
//                         <button 
//                             onClick={() => window.location.reload()} 
//                             className="refresh-btn"
//                             type="button"
//                         >
//                             <FiRefreshCw size={18} className="btn-icon" />
//                             <span>Retry Connection</span>
//                         </button>
//                     </div>
//                 </div>
//                 <div className="error-display">
//                     <p><strong>Connection Error:</strong> {error}</p>
//                     <p>Please check your internet connection and try again.</p>
//                     <div style={{ marginTop: '20px', textAlign: 'center' }}>
//                         <button 
//                             onClick={() => navigate('/')}
//                             className="btn btn-primary"
//                             type="button"
//                             style={{
//                                 background: 'linear-gradient(135deg, #3498db, #2980b9)',
//                                 color: 'white',
//                                 border: 'none',
//                                 borderRadius: '8px',
//                                 padding: '12px 24px',
//                                 fontSize: '14px',
//                                 fontWeight: '600',
//                                 cursor: 'pointer',
//                                 display: 'inline-flex',
//                                 alignItems: 'center',
//                                 gap: '8px'
//                             }}
//                         >
//                             <FiArrowLeft size={16} />
//                             Return to Home Page
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         );
//     }

//     if (isLoading) {
//         return (
//             <div className="admin-dashboard-loading">
//                 <div className="loading-spinner">
//                     <ClipLoader
//                         color="#3498db"
//                         loading={isLoading}
//                         size={50}
//                         aria-label="Loading Admin Dashboard"
//                         data-testid="loader"
//                     />
//                     <p>Loading Admin Dashboard...</p>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="admin-dashboard">
//             {/* Header Section */}
//             <div className="admin-header">
//                 <div className="admin-header-left">
//                     <h1>Admin Dashboard</h1>
//                     <p>Welcome back, {adminUser?.name}</p>
//                 </div>
//                 <div className="admin-header-right">
//                     {/* FIXED: Logout button with proper event handling and ref */}
//                     <button 
//                         ref={logoutButtonRef}
//                         onClick={handleLogout}
//                         onMouseDown={(e) => e.stopPropagation()} // Prevent mousedown bubbling
//                         onTouchStart={(e) => e.stopPropagation()} // Prevent touch bubbling
//                         className={`logout-btn ${isLoggingOut ? 'loading' : ''}`}
//                         disabled={isLoggingOut}
//                         type="button"
//                         tabIndex={0}
//                         role="button"
//                         aria-label="Logout from admin dashboard"
//                     >
//                         <FiLogOut size={18} className="btn-icon" />
//                         <span>{isLoggingOut ? 'Logging Out...' : 'Logout'}</span>
//                     </button>
//                 </div>
//             </div>

//             {/* Error Display */}
//             {error && (
//                 <div className="error-display">
//                     <p><strong>Error:</strong> {error}</p>
//                 </div>
//             )}

//             {/* Navigation Tabs - Enhanced with React Icons */}
//             <div className="admin-tabs">
//                 <button 
//                     className={`tab-btn ${activeTab === 'kanban' ? 'active' : ''}`}
//                     onClick={() => setActiveTab('kanban')}
//                     type="button"
//                 >
//                     <FiGrid className="tab-icon" />
//                     Kanban Board
//                 </button>
//                 <button 
//                     className={`tab-btn ${activeTab === 'cases' ? 'active' : ''}`}
//                     onClick={() => setActiveTab('cases')}
//                     type="button"
//                 >
//                     <HiOutlineDocumentText className="tab-icon" />
//                     All Cases
//                 </button>
//                 <button 
//                     className={`tab-btn ${activeTab === 'fully-funded' ? 'active' : ''}`}
//                     onClick={() => setActiveTab('fully-funded')}
//                     type="button"
//                 >
//                     <FiDollarSign className="tab-icon" />
//                     Fully Funded
//                 </button>
//                 <button 
//                     className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
//                     onClick={() => setActiveTab('users')}
//                     type="button"
//                 >
//                     <HiOutlineUserGroup className="tab-icon" />
//                     User Management
//                 </button>
//                 <button 
//                     className={`tab-btn ${activeTab === 'checkers' ? 'active' : ''}`}
//                     onClick={() => setActiveTab('checkers')}
//                     type="button"
//                 >
//                     <HiOutlineShieldCheck className="tab-icon" />
//                     Checker Management
//                 </button>
//             </div>

//             {/* Stats Section - Only visible on Kanban Board tab */}
//             {activeTab === 'kanban' && (
//                 <div className="stats-section">
//                     <h3>
//                         <BiStats className="section-icon" />
//                         Quick Overview
//                     </h3>
//                     <div className="stats-grid">
//                         <div className="stat-item">
//                             <div className="stat-icon pending">
//                                 <HiOutlineClock />
//                             </div>
//                             <div className="stat-content">
//                                 <span className="stat-number">{stats.cases.pending}</span>
//                                 <span className="stat-label">Pending</span>
//                             </div>
//                         </div>
//                         <div className="stat-item">
//                             <div className="stat-icon approved">
//                                 <HiOutlineCheckCircle />
//                             </div>
//                             <div className="stat-content">
//                                 <span className="stat-number">{stats.cases.approved}</span>
//                                 <span className="stat-label">Approved</span>
//                             </div>
//                         </div>
//                         <div className="stat-item">
//                             <div className="stat-icon rejected">
//                                 <HiOutlineXCircle />
//                             </div>
//                             <div className="stat-content">
//                                 <span className="stat-number">{stats.cases.rejected}</span>
//                                 <span className="stat-label">Rejected</span>
//                             </div>
//                         </div>
//                         <div className="stat-item">
//                             <div className="stat-icon total">
//                                 <BiGroup />
//                             </div>
//                             <div className="stat-content">
//                                 <span className="stat-number">{stats.users.families}</span>
//                                 <span className="stat-label">Families</span>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {/* Main Content Area */}
//             <div className="admin-main-content">
//                 {/* Tab Content */}
//                 {activeTab === 'kanban' && (
//                     <div className="kanban-board">
//                         <div className="kanban-columns">
//                             <div className="kanban-column" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'submitted')}>
//                                 <div className="column-header submitted">
//                                     <h3>Submitted</h3>
//                                     <span className="case-count">{kanbanData.submitted.length}</span>
//                                 </div>
//                                 <div className="column-content">
//                                     {kanbanData.submitted.map(caseItem => (
//                                         <div
//                                             key={caseItem.id}
//                                             className="kanban-card"
//                                             draggable
//                                             onDragStart={(e) => handleDragStart(e, caseItem)}
//                                             onClick={() => {
//                                                 setSelectedCase(caseItem);
//                                                 setShowCaseModal(true);
//                                             }}
//                                         >
//                                             <div className="card-header">
//                                                 <h4>{caseItem.caseId}</h4>
//                                                 <span className="status-badge submitted">Submitted</span>
//                                             </div>
//                                             <div className="card-content">
//                                                 <h5>{caseItem.familyName}</h5>
//                                                 <p><i className="fas fa-map-marker-alt"></i> {caseItem.village}</p>
//                                                 <p><i className="fas fa-users"></i> {caseItem.numberOfMembers} members</p>
//                                                 <p><i className="fas fa-exclamation-triangle"></i> {caseItem.destructionPercentage}% damage</p>
//                                             </div>
//                                             <div className="card-footer">
//                                                 <small>Submitted: {new Date(caseItem.submittedDate).toLocaleDateString()}</small>
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>

//                             <div className="kanban-column" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'under_review')}>
//                                 <div className="column-header under-review">
//                                     <h3>Under Review</h3>
//                                     <span className="case-count">{kanbanData.under_review.length}</span>
//                                 </div>
//                                 <div className="column-content">
//                                     {kanbanData.under_review.map(caseItem => (
//                                         <div
//                                             key={caseItem.id}
//                                             className="kanban-card"
//                                             draggable
//                                             onDragStart={(e) => handleDragStart(e, caseItem)}
//                                             onClick={() => {
//                                                 setSelectedCase(caseItem);
//                                                 setShowCaseModal(true);
//                                             }}
//                                         >
//                                             <div className="card-header">
//                                                 <h4>{caseItem.caseId}</h4>
//                                                 <span className="status-badge under-review">Under Review</span>
//                                             </div>
//                                             <div className="card-content">
//                                                 <h5>{caseItem.familyName}</h5>
//                                                 <p><i className="fas fa-map-marker-alt"></i> {caseItem.village}</p>
//                                                 <p><i className="fas fa-users"></i> {caseItem.numberOfMembers} members</p>
//                                                 {caseItem.assignedChecker && (
//                                                     <p><i className="fas fa-user-shield"></i> {caseItem.assignedChecker.name}</p>
//                                                 )}
//                                             </div>
//                                             <div className="card-footer">
//                                                 <small>Review started: {new Date(caseItem.reviewStartedDate).toLocaleDateString()}</small>
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>

//                             <div className="kanban-column" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'approved')}>
//                                 <div className="column-header approved">
//                                     <h3>Approved</h3>
//                                     <span className="case-count">{kanbanData.approved.length}</span>
//                                 </div>
//                                 <div className="column-content">
//                                     {kanbanData.approved.map(caseItem => (
//                                         <div
//                                             key={caseItem.id}
//                                             className="kanban-card"
//                                             draggable
//                                             onDragStart={(e) => handleDragStart(e, caseItem)}
//                                             onClick={() => {
//                                                 setSelectedCase(caseItem);
//                                                 setShowCaseModal(true);
//                                             }}
//                                         >
//                                             <div className="card-header">
//                                                 <h4>{caseItem.caseId}</h4>
//                                                 <span className="status-badge approved">Approved</span>
//                                             </div>
//                                             <div className="card-content">
//                                                 <h5>{caseItem.familyName}</h5>
//                                                 <p><i className="fas fa-map-marker-alt"></i> {caseItem.village}</p>
//                                                 <p><i className="fas fa-users"></i> {caseItem.numberOfMembers} members</p>
//                                                 {caseItem.finalChecker && (
//                                                     <p><i className="fas fa-user-shield"></i> {caseItem.finalChecker.name}</p>
//                                                 )}
//                                                 {caseItem.totalNeeded && (
//                                                     <p><i className="fas fa-dollar-sign"></i> ${caseItem.totalNeeded.toLocaleString()}</p>
//                                                 )}
//                                             </div>
//                                             <div className="card-footer">
//                                                 <small>Approved: {new Date(caseItem.approvedDate).toLocaleDateString()}</small>
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 )}

//                 {activeTab === 'cases' && (
//                     <div className="cases-section">
//                         <div className="section-header">
//                             <h2>All Cases</h2>
//                             <button onClick={loadAllCases} className="refresh-btn" type="button">
//                                 <i className="fas fa-sync-alt"></i> Refresh
//                             </button>
//                         </div>
//                         <div className="cases-grid">
//                             {allCases.map(caseItem => (
//                                 <div key={caseItem.caseId} className="case-card">
//                                     <div className="case-header">
//                                         <h4>{caseItem.caseId}</h4>
//                                         <span className={`case-status ${caseItem.status}`}>{caseItem.status.replace('_', ' ')}</span>
//                                     </div>
//                                     <div className="case-content">
//                                         <h5>{caseItem.familyName}</h5>
//                                         <div className="case-details">
//                                             <p><i className="fas fa-map-marker-alt"></i> {caseItem.village}</p>
//                                             <p><i className="fas fa-exclamation-triangle"></i> {caseItem.destructionPercentage}% damage</p>
//                                             {caseItem.assignedChecker && (
//                                                 <p><i className="fas fa-user-shield"></i> {caseItem.assignedChecker}</p>
//                                             )}
//                                         </div>
//                                         <div className="case-meta">
//                                             <small>Submitted: {caseItem.submittedDate || 'N/A'}</small>
//                                         </div>
//                                     </div>
//                                     <div className="case-actions">
//                                         <button 
//                                             onClick={() => {
//                                                 setSelectedCase(caseItem);
//                                                 setShowCaseModal(true);
//                                             }}
//                                             className="review-btn"
//                                             type="button"
//                                         >
//                                             <i className="fas fa-eye"></i> View Details
//                                         </button>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 )}

//                 {activeTab === 'fully-funded' && (
//                     <div className="fully-funded-section">
//                         <div className="section-header">
//                             <h2>Fully Funded Cases</h2>
//                             <button onClick={loadFullyFundedCases} className="refresh-btn" type="button">
//                                 <i className="fas fa-sync-alt"></i> Refresh
//                             </button>
//                         </div>
//                         <div className="cases-summary">
//                             <div className="summary-stats">
//                                 <div className="summary-stat">
//                                     <i className="fas fa-check-circle"></i>
//                                     <div>
//                                         <span className="stat-number">{fullyFundedCases.length}</span>
//                                         <span className="stat-label">Families Helped</span>
//                                     </div>
//                                 </div>
//                                 <div className="summary-stat">
//                                     <i className="fas fa-users"></i>
//                                     <div>
//                                         <span className="stat-number">
//                                             {fullyFundedCases.reduce((sum, c) => sum + (c.numberOfMembers || 0), 0)}
//                                         </span>
//                                         <span className="stat-label">People Helped</span>
//                                     </div>
//                                 </div>
//                                 <div className="summary-stat">
//                                     <i className="fas fa-dollar-sign"></i>
//                                     <div>
//                                         <span className="stat-number">
//                                             ${fullyFundedCases.reduce((sum, c) => sum + (c.totalNeeded || 0), 0).toLocaleString()}
//                                         </span>
//                                         <span className="stat-label">Total Raised</span>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                         <div className="cases-grid">
//                             {fullyFundedCases.length === 0 ? (
//                                 <div className="no-cases">
//                                     <i className="fas fa-heart"></i>
//                                     <h3>No fully funded cases yet</h3>
//                                     <p>Cases that reach 100% funding will appear here.</p>
//                                 </div>
//                             ) : (
//                                 fullyFundedCases.map(caseItem => (
//                                     <div key={caseItem.caseId} className="case-card fully-funded">
//                                         <div className="case-header">
//                                             <h4>{caseItem.caseId}</h4>
//                                             <span className="case-status fully-funded">Fully Funded</span>
//                                         </div>
//                                         <div className="case-content">
//                                             <h5>{caseItem.familyName}</h5>
//                                             <div className="case-details">
//                                                 <p><i className="fas fa-map-marker-alt"></i> {caseItem.village}</p>
//                                                 <p><i className="fas fa-exclamation-triangle"></i> {caseItem.destructionPercentage || 0}% damage</p>
//                                                 <p><i className="fas fa-dollar-sign"></i> ${(caseItem.totalNeeded || 0).toLocaleString()} raised</p>
//                                             </div>
//                                             <div className="case-meta">
//                                                 <small>Approved: {caseItem.approvedAt ? new Date(caseItem.approvedAt).toLocaleDateString() : 'N/A'}</small>
//                                                 {caseItem.fullyFundedAt && (
//                                                     <small>Funded: {new Date(caseItem.fullyFundedAt).toLocaleDateString()}</small>
//                                                 )}
//                                             </div>
//                                         </div>
//                                         <div className="case-actions">
//                                             <button 
//                                                 onClick={() => {
//                                                     setSelectedCase(caseItem);
//                                                     setShowCaseModal(true);
//                                                 }}
//                                                 className="review-btn"
//                                                 type="button"
//                                             >
//                                                 <i className="fas fa-eye"></i> View Details
//                                             </button>
//                                         </div>
//                                     </div>
//                                 ))
//                             )}
//                         </div>
//                     </div>
//                 )}

//                 {activeTab === 'users' && (
//                     <div className="users-section">
//                         <div className="section-header">
//                             <h2>User Management</h2>
//                             <button onClick={loadUsers} className="refresh-btn" type="button">
//                                 <i className="fas fa-sync-alt"></i> Refresh
//                             </button>
//                         </div>
//                         <div className="users-table">
//                             <table>
//                                 <thead>
//                                     <tr>
//                                         <th>Name</th>
//                                         <th>Email</th>
//                                         <th>Role</th>
//                                         <th>Status</th>
//                                         <th>Registration Date</th>
//                                         <th>Actions</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {users.map(user => (
//                                         <tr key={user.id}>
//                                             <td>{user.name}</td>
//                                             <td>{user.email}</td>
//                                             <td>
//                                                 <span className={`role-badge ${user.role}`}>
//                                                     {user.role}
//                                                 </span>
//                                             </td>
//                                             <td>
//                                                 <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
//                                                     {user.isActive ? 'Active' : 'Inactive'}
//                                                 </span>
//                                             </td>
//                                             <td>{new Date(user.registrationDate).toLocaleDateString()}</td>
//                                             <td>
//                                                 <div className="action-buttons">
//                                                     <button
//                                                         onClick={() => updateUserStatus(user.id, !user.isActive)}
//                                                         className={`status-btn ${user.isActive ? 'deactivate' : 'activate'}`}
//                                                         type="button"
//                                                     >
//                                                         {user.isActive ? 'Deactivate' : 'Activate'}
//                                                     </button>
//                                                     <button
//                                                         onClick={() => deleteUser(user.id)}
//                                                         className="delete-btn"
//                                                         disabled={user.role === 'checker'}
//                                                         type="button"
//                                                     >
//                                                         Delete
//                                                     </button>
//                                                 </div>
//                                             </td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         </div>
//                     </div>
//                 )}

//                 {activeTab === 'checkers' && (
//                     <CheckerManagement />
//                 )}
//             </div>

//             {/* FIXED: Case Modal with proper event handling */}
//             {showCaseModal && selectedCase && (
//                 <div className="modal-overlay" onClick={handleModalOverlayClick}>
//                     <div className="case-modal" onClick={handleModalContentClick}>
//                         <div className="modal-header">
//                             <h3>Case Details: {selectedCase.caseId}</h3>
//                             <button 
//                                 onClick={() => setShowCaseModal(false)} 
//                                 className="close-btn"
//                                 type="button"
//                                 aria-label="Close modal"
//                             >
//                                 <i className="fas fa-times"></i>
//                             </button>
//                         </div>
//                         <div className="modal-content">
//                             <div className="case-info">
//                                 <h4>{selectedCase.familyName}</h4>
//                                 <p><strong>Village:</strong> {selectedCase.village}</p>
//                                 <p><strong>Members:</strong> {selectedCase.numberOfMembers}</p>
//                                 <p><strong>Damage:</strong> {selectedCase.destructionPercentage}%</p>
//                                 <p><strong>Status:</strong> {selectedCase.status.replace('_', ' ')}</p>
//                             </div>
                            
//                             {selectedCase.status === 'submitted' && (
//                                 <div className="checker-assignment">
//                                     <h4>Assign Checker</h4>
//                                     {checkers.length > 0 ? (
//                                         <select 
//                                             className="checker-select"
//                                             onChange={(e) => {
//                                                 if (e.target.value) {
//                                                     assignChecker(selectedCase.caseId, e.target.value);
//                                                 }
//                                             }}
//                                         >
//                                             <option value="">Select a checker...</option>
//                                             {checkers.map(checker => (
//                                                 <option key={checker.id} value={checker.id}>
//                                                     {checker.name}
//                                                 </option>
//                                             ))}
//                                         </select>
//                                     ) : (
//                                         <div className="no-checkers-available">
//                                             <p>No checkers available. Please create checkers first.</p>
//                                             <button 
//                                                 onClick={() => setActiveTab('checkers')}
//                                                 className="create-checker-btn"
//                                                 type="button"
//                                             >
//                                                 Go to Checker Management
//                                             </button>
//                                         </div>
//                                     )}
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default AdminDashboard;
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import { adminAuthStorage } from '../../utils/authStorage';
import CheckerManagement from './components/CheckerManagement';
import './AdminDashboard.css';


// Alternative logout icon import


const AdminDashboard = () => {
    // Generate a unique ID for this component instance
    const componentId = React.useMemo(() => Math.random().toString(36).substr(2, 9), []);
    
    console.log(`🔍 AdminDashboard [${componentId}]: Component rendered`);
    
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

    // API rate limiting
    const [isApiRequestInProgress, setIsApiRequestInProgress] = useState(false);
    const lastApiRequestTime = useRef(0);
    const MIN_API_REQUEST_INTERVAL = 500; // 500ms between API requests

    // Ref for logout button to prevent unwanted triggers
    const logoutButtonRef = useRef(null);

    // API request throttling function
    const throttledApiRequest = useCallback(async (requestFn) => {
        const now = Date.now();
        if (now - lastApiRequestTime.current < MIN_API_REQUEST_INTERVAL) {
            console.log(`🔒 API request throttled, waiting ${MIN_API_REQUEST_INTERVAL - (now - lastApiRequestTime.current)}ms`);
            return;
        }

        if (isApiRequestInProgress) {
            console.log('🔒 API request already in progress, skipping');
            return;
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

    // Define all functions first
    const verifyAdminAuth = useCallback(async () => {
        const authData = adminAuthStorage.getAuth();
        
        console.log('🔍 Verifying admin auth:', { 
            isAuthenticated: authData.isAuthenticated, 
            hasToken: !!authData.token,
            tokenLength: authData.token?.length 
        });
        
        if (!authData.isAuthenticated) {
            console.log('🔒 Not authenticated, redirecting to login');
            navigate('/admin/login');
            return;
        }

        try {
            console.log('🔍 Making auth verification request...');
            const response = await fetch('http://localhost:5000/api/admin/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${authData.token}`
                }
            });

            console.log('🔍 Auth verification response:', { 
                status: response.status, 
                ok: response.ok,
                statusText: response.statusText
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Auth verification successful:', data);
                setAdminUser(data.admin);
                setIsLoading(false);
            } else {
                console.log('❌ Auth verification failed, clearing auth and redirecting');
                adminAuthStorage.clearAuth();
                navigate('/admin/login');
            }
        } catch (error) {
            console.error('❌ Auth verification error:', error);
            // Don't automatically logout on network errors, just show error
            setError('Authentication verification failed. Please check your connection.');
            setIsLoading(false);
        }
    }, [navigate]);

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
                    setCheckers(data.checkers || []);
                }
            } catch (error) {
                console.error('Error loading checkers:', error);
                // Set empty array as fallback
                setCheckers([]);
            }
        });
    }, [throttledApiRequest]);

    const handleDragStart = (e, caseItem) => {
        setDraggedCase(caseItem);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (e, targetStatus) => {
        e.preventDefault();
        if (!draggedCase) return;

        try {
            const authData = adminAuthStorage.getAuth();
            const token = authData.token;
            const response = await fetch(`http://localhost:5000/api/admin/cases/${draggedCase.caseId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: targetStatus })
            });

            if (response.ok) {
                toast.success(`Case moved to ${targetStatus.replace('_', ' ')}`);
                await loadKanbanData();
            } else {
                toast.error('Failed to move case');
            }
        } catch (error) {
            console.error('Error moving case:', error);
            toast.error('Error moving case');
        } finally {
            setDraggedCase(null);
        }
    };

    const assignChecker = async (caseId, checkerId, notes = '') => {
        try {
            const authData = adminAuthStorage.getAuth();
            const token = authData.token;
            const response = await fetch(`http://localhost:5000/api/admin/cases/${caseId}/assign`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ checkerId, notes })
            });

            if (response.ok) {
                toast.success('Checker assigned successfully');
                await loadKanbanData();
                setShowCaseModal(false);
                setSelectedCase(null);
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || 'Failed to assign checker');
            }
        } catch (error) {
            console.error('Error assigning checker:', error);
            toast.error('Error assigning checker');
        }
    };

    const updateUserStatus = async (userId, isActive) => {
        try {
            const authData = adminAuthStorage.getAuth();
            const token = authData.token;
            const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isActive })
            });

            if (response.ok) {
                toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
                await loadUsers();
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || 'Failed to update user status');
            }
        } catch (error) {
            console.error('Error updating user status:', error);
            toast.error('Error updating user status');
        }
    };

    const deleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            const authData = adminAuthStorage.getAuth();
            const token = authData.token;
            const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                toast.success('User deleted successfully');
                await loadUsers();
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Error deleting user');
        }
    };

    // CLEAN: Simple logout handler without complex event handling
    const handleLogout = useCallback(async () => {
        // Prevent double-clicks during logout
        if (isLoggingOut) {
            return;
        }
        
        console.log('🔓 AdminDashboard: Starting logout process');
        setIsLoggingOut(true);
        
        try {
            // Clear admin authentication
            adminAuthStorage.clearAuth();
            console.log('🔓 AdminDashboard: Auth cleared');
            
            // Clear session storage
            sessionStorage.clear();
            console.log('🔓 AdminDashboard: Session storage cleared');
            
            // Clear any cached data if available
            try {
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(
                        cacheNames.map(cacheName => caches.delete(cacheName))
                    );
                    console.log('🔓 AdminDashboard: Caches cleared');
                }
            } catch (cacheError) {
                console.log('ℹ️ Cache clearing not available or failed:', cacheError);
            }
            
            console.log('🔓 AdminDashboard: Redirecting to home page');
            
            // Navigate to home page
            navigate('/', { 
                replace: true,
                state: { 
                    fromLogout: true,
                    message: 'You have been successfully logged out.'
                }
            });
            
        } catch (error) {
            console.error('❌ Logout error:', error);
            
            // Fallback navigation
            try {
                navigate('/', { replace: true });
            } catch (navError) {
                console.error('❌ Navigation fallback failed:', navError);
                window.location.href = '/';
            }
        } finally {
            // Reset logout state after a delay
            setTimeout(() => {
                setIsLoggingOut(false);
            }, 1000);
        }
    }, [isLoggingOut, navigate]);

    // FIXED: Modal click handler with safe event isolation
    const handleModalOverlayClick = useCallback((event) => {
        // Only close modal if clicking directly on the overlay, not its children
        if (event.target === event.currentTarget) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
                
                // Safe stopImmediatePropagation call
                if (typeof event.stopImmediatePropagation === 'function') {
                    event.stopImmediatePropagation();
                }
            }
            setShowCaseModal(false);
        }
    }, []);

    const handleModalContentClick = useCallback((event) => {
        // Prevent modal from closing when clicking inside the modal content
        if (event) {
            event.stopPropagation();
            
            // Safe stopImmediatePropagation call
            if (typeof event.stopImmediatePropagation === 'function') {
                event.stopImmediatePropagation();
            }
        }
    }, []);

    // useEffect hooks
    useEffect(() => {
        console.log(`🔍 AdminDashboard [${componentId}]: useEffect triggered, verifying admin auth`);
        
        // Add a small delay to prevent immediate execution
        const timer = setTimeout(() => {
            console.log(`🔍 AdminDashboard [${componentId}]: Executing verifyAdminAuth after delay`);
            verifyAdminAuth();
        }, 100);
        
        // Cleanup function
        return () => {
            console.log(`🔍 AdminDashboard [${componentId}]: Component cleanup`);
            clearTimeout(timer);
        };
    }, [verifyAdminAuth, componentId]);

    useEffect(() => {
        if (adminUser) {
            const loadTabData = async () => {
                try {
                    // Add a small delay to prevent overwhelming the API
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                    if (activeTab === 'kanban') {
                        await loadKanbanData();
                    } else if (activeTab === 'cases') {
                        await loadAllCases();
                    } else if (activeTab === 'fully-funded') {
                        await loadFullyFundedCases();
                    } else if (activeTab === 'users') {
                        await loadUsers();
                    } else if (activeTab === 'checkers') {
                        await loadCheckers();
                    }
                } catch (error) {
                    console.error('Error loading tab data:', error);
                    setError(`Failed to load ${activeTab} data`);
                }
            };
            
            loadTabData();
        }
    }, [activeTab, adminUser, loadKanbanData, loadAllCases, loadFullyFundedCases, loadUsers, loadCheckers]);

    // FIXED: Add cleanup effect to prevent memory leaks and handle logout
    useEffect(() => {
        // Cleanup function for component unmounting
        return () => {
            console.log(`🔍 AdminDashboard [${componentId}]: Component unmounting, cleaning up`);
            
            // Clear any pending timeouts or intervals
            if (typeof window !== 'undefined') {
                // Clear any pending API calls
                setError('');
                setIsLoading(false);
                setIsLoggingOut(false);
                
                // If we're logging out, ensure we don't leave any hanging state
                if (isLoggingOut) {
                    console.log('🔓 Cleanup: Logout in progress during unmount');
                    adminAuthStorage.clearAuth();
                    sessionStorage.clear();
                }
            }
        };
    }, [componentId, isLoggingOut]);

    // FIXED: Add effect to handle post-logout cleanup
    useEffect(() => {
        // If user is logged out (no adminUser) and we're not loading, redirect to home
        if (!isLoading && !adminUser && !isLoggingOut) {
            const authData = adminAuthStorage.getAuth();
            if (!authData.isAuthenticated) {
                console.log('🔓 No authenticated admin user found, redirecting to home');
                navigate('/', { 
                    replace: true,
                    state: { 
                        message: 'Please log in to access the admin dashboard.'
                    }
                });
            }
        }
    }, [adminUser, isLoading, isLoggingOut, navigate]);

    // Global error handler
    useEffect(() => {
        const handleGlobalError = (event) => {
            console.error('Global error caught:', event.error);
            setError('An unexpected error occurred. Please refresh the page.');
        };

        const handleUnhandledRejection = (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            setError('A network error occurred. Please check your connection.');
        };

        window.addEventListener('error', handleGlobalError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('error', handleGlobalError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);

    // FIXED: Add global click handler to prevent unwanted logout triggers
    useEffect(() => {
        const handleGlobalClick = (event) => {
            // Ensure clicks on logout button don't trigger multiple times
            if (logoutButtonRef.current && logoutButtonRef.current.contains(event.target)) {
                return; // Let the button's own handler deal with it
            }
            
            // Prevent any accidental logout triggers from other clicks
            if (isLoggingOut) {
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    
                    // Safe stopImmediatePropagation call
                    if (typeof event.stopImmediatePropagation === 'function') {
                        event.stopImmediatePropagation();
                    }
                }
            }
        };

        document.addEventListener('click', handleGlobalClick, true);
        
        return () => {
            document.removeEventListener('click', handleGlobalClick, true);
        };
    }, [isLoggingOut]);

    // Error boundary fallback
    if (error && (error.includes('network') || error.includes('connection'))) {
        return (
            <div className="admin-dashboard">
                <div className="admin-header">
                    <div className="admin-header-left">
                        <h1>Admin Dashboard</h1>
                        <p>Connection Error</p>
                    </div>
                    <div className="admin-header-right">
                        <button 
                            onClick={() => navigate('/')} 
                            className="back-btn"
                            type="button"
                            style={{ marginRight: '10px' }}
                        >
                            <span style={{ marginRight: '8px' }}>←</span>
                            <span>Go Home</span>
                        </button>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="refresh-btn"
                            type="button"
                        >
                            <span style={{ marginRight: '8px' }}>🔄</span>
                            <span>Retry Connection</span>
                        </button>
                    </div>
                </div>
                <div className="error-display">
                    <p><strong>Connection Error:</strong> {error}</p>
                    <p>Please check your internet connection and try again.</p>
                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <button 
                            onClick={() => navigate('/')}
                            className="btn btn-primary"
                            type="button"
                            style={{
                                background: 'linear-gradient(135deg, #3498db, #2980b9)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px 24px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <span>←</span>
                            Return to Home Page
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="admin-dashboard-loading">
                <div className="loading-spinner">
                    <ClipLoader
                        color="#3498db"
                        loading={isLoading}
                        size={50}
                        aria-label="Loading Admin Dashboard"
                        data-testid="loader"
                    />
                    <p>Loading Admin Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            {/* Header Section */}
            <div className="admin-header">
                <div className="admin-header-left">
                    <h1>Admin Dashboard</h1>
                    <p>Welcome back, {adminUser?.name}</p>
                </div>
                <div className="admin-header-right">
                    {/* NEW: Clean logout button without React icons */}
                    <button 
                        onClick={handleLogout}
                        className={`custom-logout-btn ${isLoggingOut ? 'loading' : ''}`}
                        disabled={isLoggingOut}
                        type="button"
                        aria-label="Logout from admin dashboard"
                    >
                        <span className="logout-icon">
                            {isLoggingOut ? '⏳' : '🚪'}
                        </span>
                        <span className="logout-text">
                            {isLoggingOut ? 'Logging Out...' : 'Logout'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="error-display">
                    <p><strong>Error:</strong> {error}</p>
                </div>
            )}

            {/* Navigation Tabs - Enhanced with React Icons */}
            <div className="admin-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'kanban' ? 'active' : ''}`}
                    onClick={() => setActiveTab('kanban')}
                    type="button"
                >
                    <span className="tab-icon">📊</span>
                    Kanban Board
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'cases' ? 'active' : ''}`}
                    onClick={() => setActiveTab('cases')}
                    type="button"
                >
                    <span className="tab-icon">📋</span>
                    All Cases
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'fully-funded' ? 'active' : ''}`}
                    onClick={() => setActiveTab('fully-funded')}
                    type="button"
                >
                    <span className="tab-icon">💰</span>
                    Fully Funded
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                    type="button"
                >
                    <span className="tab-icon">👥</span>
                    User Management
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'checkers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('checkers')}
                    type="button"
                >
                    <span className="tab-icon">🛡️</span>
                    Checker Management
                </button>
            </div>

            {/* Stats Section - Only visible on Kanban Board tab */}
            {activeTab === 'kanban' && (
                <div className="stats-section">
                    <h3>
                        <span className="section-icon">📈</span>
                        Quick Overview
                    </h3>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-icon pending">
                                <span>⏳</span>
                            </div>
                            <div className="stat-content">
                                <span className="stat-number">{stats.cases.pending}</span>
                                <span className="stat-label">Pending</span>
                            </div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-icon approved">
                                <span>✅</span>
                            </div>
                            <div className="stat-content">
                                <span className="stat-number">{stats.cases.approved}</span>
                                <span className="stat-label">Approved</span>
                            </div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-icon rejected">
                                <span>❌</span>
                            </div>
                            <div className="stat-content">
                                <span className="stat-number">{stats.cases.rejected}</span>
                                <span className="stat-label">Rejected</span>
                            </div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-icon total">
                                <span>👨‍👩‍👧‍👦</span>
                            </div>
                            <div className="stat-content">
                                <span className="stat-number">{stats.users.families}</span>
                                <span className="stat-label">Families</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="admin-main-content">
                {/* Tab Content */}
                {activeTab === 'kanban' && (
                    <div className="kanban-board">
                        <div className="kanban-columns">
                            <div className="kanban-column" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'submitted')}>
                                <div className="column-header submitted">
                                    <h3>Submitted</h3>
                                    <span className="case-count">{kanbanData.submitted.length}</span>
                                </div>
                                <div className="column-content">
                                    {kanbanData.submitted.map(caseItem => (
                                        <div
                                            key={caseItem.id}
                                            className="kanban-card"
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, caseItem)}
                                            onClick={() => {
                                                setSelectedCase(caseItem);
                                                setShowCaseModal(true);
                                            }}
                                        >
                                            <div className="card-header">
                                                <h4>{caseItem.caseId}</h4>
                                                <span className="status-badge submitted">Submitted</span>
                                            </div>
                                            <div className="card-content">
                                                <h5>{caseItem.familyName}</h5>
                                                <p><i className="fas fa-map-marker-alt"></i> {caseItem.village}</p>
                                                <p><i className="fas fa-users"></i> {caseItem.numberOfMembers} members</p>
                                                <p><i className="fas fa-exclamation-triangle"></i> {caseItem.destructionPercentage}% damage</p>
                                            </div>
                                            <div className="card-footer">
                                                <small>Submitted: {new Date(caseItem.submittedDate).toLocaleDateString()}</small>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="kanban-column" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'under_review')}>
                                <div className="column-header under-review">
                                    <h3>Under Review</h3>
                                    <span className="case-count">{kanbanData.under_review.length}</span>
                                </div>
                                <div className="column-content">
                                    {kanbanData.under_review.map(caseItem => (
                                        <div
                                            key={caseItem.id}
                                            className="kanban-card"
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, caseItem)}
                                            onClick={() => {
                                                setSelectedCase(caseItem);
                                                setShowCaseModal(true);
                                            }}
                                        >
                                            <div className="card-header">
                                                <h4>{caseItem.caseId}</h4>
                                                <span className="status-badge under-review">Under Review</span>
                                            </div>
                                            <div className="card-content">
                                                <h5>{caseItem.familyName}</h5>
                                                <p><i className="fas fa-map-marker-alt"></i> {caseItem.village}</p>
                                                <p><i className="fas fa-users"></i> {caseItem.numberOfMembers} members</p>
                                                {caseItem.assignedChecker && (
                                                    <p><i className="fas fa-user-shield"></i> {caseItem.assignedChecker.name}</p>
                                                )}
                                            </div>
                                            <div className="card-footer">
                                                <small>Review started: {new Date(caseItem.reviewStartedDate).toLocaleDateString()}</small>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="kanban-column" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'approved')}>
                                <div className="column-header approved">
                                    <h3>Approved</h3>
                                    <span className="case-count">{kanbanData.approved.length}</span>
                                </div>
                                <div className="column-content">
                                    {kanbanData.approved.map(caseItem => (
                                        <div
                                            key={caseItem.id}
                                            className="kanban-card"
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, caseItem)}
                                            onClick={() => {
                                                setSelectedCase(caseItem);
                                                setShowCaseModal(true);
                                            }}
                                        >
                                            <div className="card-header">
                                                <h4>{caseItem.caseId}</h4>
                                                <span className="status-badge approved">Approved</span>
                                            </div>
                                            <div className="card-content">
                                                <h5>{caseItem.familyName}</h5>
                                                <p><i className="fas fa-map-marker-alt"></i> {caseItem.village}</p>
                                                <p><i className="fas fa-users"></i> {caseItem.numberOfMembers} members</p>
                                                {caseItem.finalChecker && (
                                                    <p><i className="fas fa-user-shield"></i> {caseItem.finalChecker.name}</p>
                                                )}
                                                {caseItem.totalNeeded && (
                                                    <p><i className="fas fa-dollar-sign"></i> ${caseItem.totalNeeded.toLocaleString()}</p>
                                                )}
                                            </div>
                                            <div className="card-footer">
                                                <small>Approved: {new Date(caseItem.approvedDate).toLocaleDateString()}</small>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'cases' && (
                    <div className="cases-section">
                        <div className="section-header">
                            <h2>All Cases</h2>
                            <button onClick={loadAllCases} className="refresh-btn" type="button">
                                <span style={{ marginRight: '8px' }}>🔄</span>
                                Refresh
                            </button>
                        </div>
                        <div className="cases-grid">
                            {allCases.map(caseItem => (
                                <div key={caseItem.caseId} className="case-card">
                                    <div className="case-header">
                                        <h4>{caseItem.caseId}</h4>
                                        <span className={`case-status ${caseItem.status}`}>{caseItem.status.replace('_', ' ')}</span>
                                    </div>
                                    <div className="case-content">
                                        <h5>{caseItem.familyName}</h5>
                                        <div className="case-details">
                                            <p><i className="fas fa-map-marker-alt"></i> {caseItem.village}</p>
                                            <p><i className="fas fa-exclamation-triangle"></i> {caseItem.destructionPercentage}% damage</p>
                                            {caseItem.assignedChecker && (
                                                <p><i className="fas fa-user-shield"></i> {caseItem.assignedChecker}</p>
                                            )}
                                        </div>
                                        <div className="case-meta">
                                            <small>Submitted: {caseItem.submittedDate || 'N/A'}</small>
                                        </div>
                                    </div>
                                    <div className="case-actions">
                                        <button 
                                            onClick={() => {
                                                setSelectedCase(caseItem);
                                                setShowCaseModal(true);
                                            }}
                                            className="review-btn"
                                            type="button"
                                        >
                                            <i className="fas fa-eye"></i> View Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'fully-funded' && (
                    <div className="fully-funded-section">
                        <div className="section-header">
                            <h2>Fully Funded Cases</h2>
                            <button onClick={loadFullyFundedCases} className="refresh-btn" type="button">
                                <span style={{ marginRight: '8px' }}>🔄</span>
                                Refresh
                            </button>
                        </div>
                        <div className="cases-summary">
                            <div className="summary-stats">
                                <div className="summary-stat">
                                    <i className="fas fa-check-circle"></i>
                                    <div>
                                        <span className="stat-number">{fullyFundedCases.length}</span>
                                        <span className="stat-label">Families Helped</span>
                                    </div>
                                </div>
                                <div className="summary-stat">
                                    <i className="fas fa-users"></i>
                                    <div>
                                        <span className="stat-number">
                                            {fullyFundedCases.reduce((sum, c) => sum + (c.numberOfMembers || 0), 0)}
                                        </span>
                                        <span className="stat-label">People Helped</span>
                                    </div>
                                </div>
                                <div className="summary-stat">
                                    <i className="fas fa-dollar-sign"></i>
                                    <div>
                                        <span className="stat-number">
                                            ${fullyFundedCases.reduce((sum, c) => sum + (c.totalNeeded || 0), 0).toLocaleString()}
                                        </span>
                                        <span className="stat-label">Total Raised</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="cases-grid">
                            {fullyFundedCases.length === 0 ? (
                                <div className="no-cases">
                                    <i className="fas fa-heart"></i>
                                    <h3>No fully funded cases yet</h3>
                                    <p>Cases that reach 100% funding will appear here.</p>
                                </div>
                            ) : (
                                fullyFundedCases.map(caseItem => (
                                    <div key={caseItem.caseId} className="case-card fully-funded">
                                        <div className="case-header">
                                            <h4>{caseItem.caseId}</h4>
                                            <span className="case-status fully-funded">Fully Funded</span>
                                        </div>
                                        <div className="case-content">
                                            <h5>{caseItem.familyName}</h5>
                                            <div className="case-details">
                                                <p><i className="fas fa-map-marker-alt"></i> {caseItem.village}</p>
                                                <p><i className="fas fa-exclamation-triangle"></i> {caseItem.destructionPercentage || 0}% damage</p>
                                                <p><i className="fas fa-dollar-sign"></i> ${(caseItem.totalNeeded || 0).toLocaleString()} raised</p>
                                            </div>
                                            <div className="case-meta">
                                                <small>Approved: {caseItem.approvedAt ? new Date(caseItem.approvedAt).toLocaleDateString() : 'N/A'}</small>
                                                {caseItem.fullyFundedAt && (
                                                    <small>Funded: {new Date(caseItem.fullyFundedAt).toLocaleDateString()}</small>
                                                )}
                                            </div>
                                        </div>
                                        <div className="case-actions">
                                            <button 
                                                onClick={() => {
                                                    setSelectedCase(caseItem);
                                                    setShowCaseModal(true);
                                                }}
                                                className="review-btn"
                                                type="button"
                                            >
                                                <i className="fas fa-eye"></i> View Details
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="users-section">
                        <div className="section-header">
                            <h2>User Management</h2>
                            <button onClick={loadUsers} className="refresh-btn" type="button">
                                <span style={{ marginRight: '8px' }}>🔄</span>
                                Refresh
                            </button>
                        </div>
                        <div className="users-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Registration Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td>{user.name}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className={`role-badge ${user.role}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>{new Date(user.registrationDate).toLocaleDateString()}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        onClick={() => updateUserStatus(user.id, !user.isActive)}
                                                        className={`status-btn ${user.isActive ? 'deactivate' : 'activate'}`}
                                                        type="button"
                                                    >
                                                        {user.isActive ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteUser(user.id)}
                                                        className="delete-btn"
                                                        disabled={user.role === 'checker'}
                                                        type="button"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'checkers' && (
                    <CheckerManagement />
                )}
            </div>

            {/* CLEAN: Case Modal with simple click handling */}
            {showCaseModal && selectedCase && (
                <div className="modal-overlay" onClick={() => setShowCaseModal(false)}>
                    <div className="case-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Case Details: {selectedCase.caseId}</h3>
                            <button 
                                onClick={() => setShowCaseModal(false)} 
                                className="close-btn"
                                type="button"
                                aria-label="Close modal"
                            >
                                <span>✕</span>
                            </button>
                        </div>
                        <div className="modal-content">
                            <div className="case-info">
                                <h4>{selectedCase.familyName}</h4>
                                <p><strong>Village:</strong> {selectedCase.village}</p>
                                <p><strong>Members:</strong> {selectedCase.numberOfMembers}</p>
                                <p><strong>Damage:</strong> {selectedCase.destructionPercentage}%</p>
                                <p><strong>Status:</strong> {selectedCase.status.replace('_', ' ')}</p>
                            </div>
                            
                            {selectedCase.status === 'submitted' && (
                                <div className="checker-assignment">
                                    <h4>Assign Checker</h4>
                                    {checkers.length > 0 ? (
                                        <select 
                                            className="checker-select"
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    assignChecker(selectedCase.caseId, e.target.value);
                                                }
                                            }}
                                        >
                                            <option value="">Select a checker...</option>
                                            {checkers.map(checker => (
                                                <option key={checker.id} value={checker.id}>
                                                    {checker.name}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="no-checkers-available">
                                            <p>No checkers available. Please create checkers first.</p>
                                            <button 
                                                onClick={() => setActiveTab('checkers')}
                                                className="create-checker-btn"
                                                type="button"
                                            >
                                                Go to Checker Management
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;