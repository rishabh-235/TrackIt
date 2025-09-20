// Role-based utility functions
// This file contains reusable utilities for role-based conditional rendering and logic

/**
 * Check if user has permission to create resources
 * @param {string} userRole - The user's role (Admin, Manager, Developer)
 * @returns {boolean} - Whether user can create resources
 */
export const canCreateResources = (userRole) => {
  return userRole === "Admin" || userRole === "Manager";
};

/**
 * Check if user is an admin
 * @param {string} userRole - The user's role
 * @returns {boolean} - Whether user is an admin
 */
export const isAdmin = (userRole) => {
  return userRole === "Admin";
};

/**
 * Check if user is a manager or admin
 * @param {string} userRole - The user's role
 * @returns {boolean} - Whether user is manager or admin
 */
export const isManagerOrAdmin = (userRole) => {
  return userRole === "Admin" || userRole === "Manager";
};

/**
 * Check if user is a developer
 * @param {string} userRole - The user's role
 * @returns {boolean} - Whether user is a developer
 */
export const isDeveloper = (userRole) => {
  return userRole === "Developer";
};

/**
 * Get user role display name
 * @param {string} userRole - The user's role
 * @returns {string} - Formatted role name
 */
export const getRoleDisplayName = (userRole) => {
  const roleMap = {
    Admin: "Administrator",
    Manager: "Project Manager",
    Developer: "Developer",
  };
  return roleMap[userRole] || userRole;
};

/**
 * Get role-based permissions object
 * @param {string} userRole - The user's role
 * @returns {object} - Permissions object
 */
export const getRolePermissions = (userRole) => {
  return {
    canCreate: canCreateResources(userRole),
    canManageUsers: isAdmin(userRole),
    canViewTeamPerformance: isManagerOrAdmin(userRole),
    canAssignTasks: isManagerOrAdmin(userRole),
    canDeleteProjects: isManagerOrAdmin(userRole),
    isReadOnly: isDeveloper(userRole),
  };
};

/**
 * Utility function for conditional role-based rendering
 * @param {string} userRole - The user's role
 * @param {string|string[]} allowedRoles - Role(s) that can see this content
 * @param {any} content - Content to return if allowed
 * @param {any} fallback - Content to return if not allowed
 * @returns {any} - Content based on role
 */
export const renderBasedOnRole = (
  userRole,
  allowedRoles,
  content,
  fallback = null
) => {
  const allowed = Array.isArray(allowedRoles)
    ? allowedRoles.includes(userRole)
    : allowedRoles === userRole;

  return allowed ? content : fallback;
};

/**
 * HOC factory for role-based component protection
 * @param {string|string[]} allowedRoles - Role(s) that can access this component
 * @param {React.ReactNode} fallback - Component to show if access denied
 * @returns {function} - HOC function that takes a component and returns protected component
 */
export const createRoleProtectedComponent = (allowedRoles, fallback = null) => {
  return (Component) => {
    const ProtectedComponent = (props) => {
      const userRole = props.userRole || props.user?.role;
      const allowed = Array.isArray(allowedRoles)
        ? allowedRoles.includes(userRole)
        : allowedRoles === userRole;

      return allowed ? Component(props) : fallback;
    };

    ProtectedComponent.displayName = `RoleProtected(${
      Component.displayName || Component.name
    })`;
    return ProtectedComponent;
  };
};
