import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const PublicRoute = ({ children }) => {
  const { user } = useAuth();

  if (user) {
    // Redirect theo role
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "user") return <Navigate to="/user/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
