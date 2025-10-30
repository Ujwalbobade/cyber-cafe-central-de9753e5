import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToken } from "./TokenProvider";

/**
 * Component that handles automatic redirect to login when token expires.
 * Must be used inside a Router context.
 */
export const TokenExpirationHandler = () => {
  const { isAuthenticated } = useToken();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we're on a protected route and not authenticated
    const protectedRoutes = ["/dashboard", "/analytics", "/settings", "/user-management"];
    const currentPath = window.location.pathname;
    
    if (!isAuthenticated && protectedRoutes.some(route => currentPath.startsWith(route))) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return null; // This component doesn't render anything
};
