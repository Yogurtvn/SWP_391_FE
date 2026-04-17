import { Navigate, useLocation } from "react-router";
import { useAuth, UserRole } from "@/store/auth/AuthContext";
import { getLandingPathByRole } from "@/store/auth/authRedirect";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const { user, isAuthenticated, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If allowedRoles is specified, check if user has the required role
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={getLandingPathByRole(user.role)} replace />;
  }

  return <>{children}</>;
}
