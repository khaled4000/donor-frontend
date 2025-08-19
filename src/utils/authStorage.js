// Authentication storage utility with namespace support
// Allows multiple user types to be logged in simultaneously

const STORAGE_NAMESPACES = {
  REGULAR: 'auth',     // For donors and families
  ADMIN: 'admin',      // For admin/checker users
  CHECKER: 'checker'   // For checker users (if needed separately)
};

class AuthStorage {
  constructor(namespace = STORAGE_NAMESPACES.REGULAR) {
    this.namespace = namespace;
  }

  // Get storage key with namespace prefix
  getKey(key) {
    return `${this.namespace}_${key}`;
  }

  // Store authentication data
  setAuth(token, user, userType) {
    localStorage.setItem(this.getKey('token'), token);
    localStorage.setItem(this.getKey('user'), JSON.stringify(user));
    localStorage.setItem(this.getKey('userType'), userType);
    localStorage.setItem(this.getKey('isAuthenticated'), 'true');
  }

  // Get authentication data
  getAuth() {
    const token = localStorage.getItem(this.getKey('token'));
    const userStr = localStorage.getItem(this.getKey('user'));
    const userType = localStorage.getItem(this.getKey('userType'));
    const isAuthenticated = localStorage.getItem(this.getKey('isAuthenticated')) === 'true';

    return {
      token,
      user: userStr ? JSON.parse(userStr) : null,
      userType,
      isAuthenticated: isAuthenticated && token && userStr
    };
  }

  // Update user data only
  setUser(user) {
    localStorage.setItem(this.getKey('user'), JSON.stringify(user));
  }

  // Clear all authentication data for this namespace
  clearAuth() {
    localStorage.removeItem(this.getKey('token'));
    localStorage.removeItem(this.getKey('user'));
    localStorage.removeItem(this.getKey('userType'));
    localStorage.removeItem(this.getKey('isAuthenticated'));
  }

  // Check if this namespace has active authentication
  hasAuth() {
    const { isAuthenticated } = this.getAuth();
    return isAuthenticated;
  }

  // Get all active user sessions
  static getActiveSessions() {
    const sessions = [];
    
    Object.values(STORAGE_NAMESPACES).forEach(namespace => {
      const storage = new AuthStorage(namespace);
      if (storage.hasAuth()) {
        const { user, userType } = storage.getAuth();
        sessions.push({
          namespace,
          user,
          userType,
          displayName: user?.firstName || user?.name || userType
        });
      }
    });

    return sessions;
  }

  // Clear all sessions (logout from all user types)
  static clearAllSessions() {
    Object.values(STORAGE_NAMESPACES).forEach(namespace => {
      const storage = new AuthStorage(namespace);
      storage.clearAuth();
    });
  }
}

// Create pre-configured instances for different user types
export const regularAuthStorage = new AuthStorage(STORAGE_NAMESPACES.REGULAR);
export const adminAuthStorage = new AuthStorage(STORAGE_NAMESPACES.ADMIN);
export const checkerAuthStorage = new AuthStorage(STORAGE_NAMESPACES.CHECKER);

export { AuthStorage, STORAGE_NAMESPACES };
export default AuthStorage;
