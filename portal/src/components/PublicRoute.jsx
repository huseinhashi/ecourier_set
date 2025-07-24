// PublicRoute.jsx - Updated for E-Courier admin system
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user?.role === "admin") {
    // If admin is logged in, redirect to admin dashboard
    return <Navigate to="/admin" replace />;
  }

  return children;
};
