import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/store/auth/AuthContext";
import { getLandingPathByRole } from "@/store/auth/authRedirect";
function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const { user, isAuthenticated, isReady } = useAuth();
  if (!isReady) {
    return <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={getLandingPathByRole(user.role)} replace />;
  }
  return <>{children}</>;
}
export {
  ProtectedRoute as default
};
