// src/utils/userStorage.js

/**
 * Utility functions for managing user data in localStorage
 */

const USERS_STORAGE_KEY = 'registeredUsers';

/**
 * Get all registered users from localStorage
 * @returns {Array} Array of user objects
 */
export const getAllUsers = () => {
  try {
    const users = localStorage.getItem(USERS_STORAGE_KEY);
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error('Error parsing users from localStorage:', error);
    return [];
  }
};

/**
 * Save a new user to localStorage
 * @param {Object} userData - User data object
 * @param {string} userType - Type of user (family, donor, checker)
 * @returns {Object} Complete user object with ID and metadata
 */
export const saveUser = (userData, userType) => {
  try {
    const existingUsers = getAllUsers();
    
    // Create new user object with all registration data
    const newUser = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Unique ID
      ...userData,
      userType: userType,
      registrationDate: new Date().toISOString(),
      lastLoginDate: null,
      isActive: true
    };
    
    // Add new user to the array
    existingUsers.push(newUser);
    
    // Save updated users array back to localStorage
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
    
    return newUser;
  } catch (error) {
    console.error('Error saving user to localStorage:', error);
    throw new Error('Failed to save user data');
  }
};

/**
 * Find a user by email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Object|null} User object if found, null otherwise
 */
export const authenticateUser = (email, password) => {
  try {
    const users = getAllUsers();
    const user = users.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && 
      u.password === password && 
      u.isActive
    );
    
    if (user) {
      // Update last login date
      user.lastLoginDate = new Date().toISOString();
      updateUser(user);
      
      // Return user without password for security
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    
    return null;
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
};

/**
 * Update an existing user in localStorage
 * @param {Object} updatedUser - Updated user object
 * @returns {boolean} True if successful, false otherwise
 */
export const updateUser = (updatedUser) => {
  try {
    const users = getAllUsers();
    const userIndex = users.findIndex(u => u.id === updatedUser.id);
    
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updatedUser };
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error updating user:', error);
    return false;
  }
};

/**
 * Check if an email is already registered
 * @param {string} email - Email to check
 * @returns {boolean} True if email exists, false otherwise
 */
export const emailExists = (email) => {
  try {
    const users = getAllUsers();
    return users.some(u => u.email.toLowerCase() === email.toLowerCase() && u.isActive);
  } catch (error) {
    console.error('Error checking email existence:', error);
    return false;
  }
};

/**
 * Get users by type
 * @param {string} userType - Type of users to retrieve (family, donor, checker)
 * @returns {Array} Array of users of the specified type
 */
export const getUsersByType = (userType) => {
  try {
    const users = getAllUsers();
    return users.filter(u => u.userType === userType && u.isActive);
  } catch (error) {
    console.error('Error getting users by type:', error);
    return [];
  }
};

/**
 * Get user statistics
 * @returns {Object} Object containing user statistics
 */
export const getUserStats = () => {
  try {
    const users = getAllUsers();
    const activeUsers = users.filter(u => u.isActive);
    
    return {
      total: activeUsers.length,
      families: activeUsers.filter(u => u.userType === 'family').length,
      donors: activeUsers.filter(u => u.userType === 'donor').length,
      checkers: activeUsers.filter(u => u.userType === 'checker').length,
      registrationsThisMonth: activeUsers.filter(u => {
        const regDate = new Date(u.registrationDate);
        const now = new Date();
        return regDate.getMonth() === now.getMonth() && regDate.getFullYear() === now.getFullYear();
      }).length
    };
  } catch (error) {
    console.error('Error getting user statistics:', error);
    return {
      total: 0,
      families: 0,
      donors: 0,
      checkers: 0,
      registrationsThisMonth: 0
    };
  }
};

/**
 * Delete user data (for development/testing purposes)
 * @param {string} userId - ID of user to delete
 * @returns {boolean} True if successful, false otherwise
 */
export const deleteUser = (userId) => {
  try {
    const users = getAllUsers();
    const updatedUsers = users.filter(u => u.id !== userId);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
};

/**
 * Clear all user data (for development/testing purposes)
 * @returns {boolean} True if successful, false otherwise
 */
export const clearAllUsers = () => {
  try {
    localStorage.removeItem(USERS_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing all users:', error);
    return false;
  }
};