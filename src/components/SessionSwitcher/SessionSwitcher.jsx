import React, { useState, useEffect } from 'react';
import { AuthStorage } from '../../utils/authStorage';
import './SessionSwitcher.css';

const SessionSwitcher = () => {
  const [activeSessions, setActiveSessions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const updateSessions = () => {
      const sessions = AuthStorage.getActiveSessions();
      setActiveSessions(sessions);
    };

    updateSessions();
    
    // Update every 2 seconds to detect new logins
    const interval = setInterval(updateSessions, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const switchToSession = (namespace) => {
    if (namespace === 'admin') {
      window.location.href = '/admin/dashboard';
    } else {
      // For regular users, redirect based on their role
      const authData = new AuthStorage(namespace).getAuth();
      if (authData.user) {
        const userType = authData.user.userType || authData.user.role;
        window.location.href = `/${userType}-dashboard`;
      }
    }
  };

  const logoutFromSession = (namespace, e) => {
    e.stopPropagation();
    const storage = new AuthStorage(namespace);
    storage.clearAuth();
    
    // Update sessions after logout
    const sessions = AuthStorage.getActiveSessions();
    setActiveSessions(sessions);
    
    // If no sessions left, go to home
    if (sessions.length === 0) {
      window.location.href = '/';
    }
  };

  const logoutFromAll = () => {
    AuthStorage.clearAllSessions();
    window.location.href = '/';
  };

  if (activeSessions.length <= 1) {
    return null; // Don't show if only one or no sessions
  }

  return (
    <div className="session-switcher">
      <button 
        className="session-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={`${activeSessions.length} active sessions`}
      >
        <i className="fas fa-users"></i>
        <span className="session-count">{activeSessions.length}</span>
      </button>

      {isOpen && (
        <div className="session-dropdown">
          <div className="session-header">
            <h4>Active Sessions</h4>
            <button 
              className="logout-all-btn"
              onClick={logoutFromAll}
              title="Logout from all sessions"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
          
          <div className="session-list">
            {activeSessions.map((session) => (
              <div 
                key={session.namespace}
                className="session-item"
                onClick={() => switchToSession(session.namespace)}
              >
                <div className="session-info">
                  <div className="session-name">
                    {session.displayName}
                  </div>
                  <div className="session-type">
                    {session.userType}
                  </div>
                </div>
                <button
                  className="session-logout-btn"
                  onClick={(e) => logoutFromSession(session.namespace, e)}
                  title="Logout from this session"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionSwitcher;
