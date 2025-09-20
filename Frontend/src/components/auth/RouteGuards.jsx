import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectIsAuthenticated,
  selectUserRole,
  selectAuthLoading,
} from "../../redux/slices/authSlice";
import LoadingSpinner from "../ui/LoadingSpinner";

// Protected route that requires authentication
export const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const location = useLocation();

  // Show loading while checking authentication status
  if (isLoading) {
    return <LoadingRoute />;
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Public route that redirects authenticated users
export const PublicRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);

  // Show loading while checking authentication status
  if (isLoading) {
    return <LoadingRoute />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Role-based protected route
export const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const userRole = useSelector(selectUserRole);
  const location = useLocation();

  // Show loading while checking authentication status
  if (isLoading) {
    return <LoadingRoute />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">
            Access Denied
          </h1>
          <p className="mt-2 text-gray-600">
            You don't have permission to access this page.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Required role(s): {allowedRoles.join(", ")}
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};

// Admin only route
export const AdminRoute = ({ children }) => (
  <RoleProtectedRoute allowedRoles={["Admin"]}>{children}</RoleProtectedRoute>
);

// Manager and Admin route
export const ManagerRoute = ({ children }) => (
  <RoleProtectedRoute allowedRoles={["Admin", "Manager"]}>
    {children}
  </RoleProtectedRoute>
);

// Loading route component
export const LoadingRoute = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <LoadingSpinner size="xl" />
      <p className="mt-4 text-lg text-gray-600">Loading...</p>
    </div>
  </div>
);
