import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "./components/Login/LoginPage";
import AdminDashboard from "./components/AdminDashboard/Index";
import AnalyticsHub from "./components/Analytics/AnalyticsHub";
import SystemSettings from "./components/SystemConfiguration/SystemConfig";
import UserManagement from "@/components/userInfo/UserManagement";
import { useToken } from "./utils/TokenProvider";
import { SystemConfigProvider } from "@/utils/SystemConfigContext";
import { useEffect, useState } from "react";
import ResetPasswordPage from "@/components/Login/Passwordreset/ResetPasswordPage";

const queryClient = new QueryClient();

const App = () => {
  const { token, isAuthenticated, setToken, removeToken } = useToken();
  const [loading, setLoading] = useState(true);

    // ✅ Initialize currentUser synchronously from sessionStorage
    interface User {
      id?: string;
      username: string;
      email: string;
      role: string;
      loginTime?: string;
      [key: string]: unknown;
    }
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const userData = sessionStorage.getItem("currentUser");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        localStorage.setItem("role", user.role || "");
        return user;
      } catch (err) {
        console.error("Failed to parse currentUser:", err);
      }
    }
    return null;
  });

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Log token and user for debugging
  useEffect(() => {
    console.log("✅ Current Token:", token);
    console.log("👤 Logged-in User:", currentUser);
  }, [token, currentUser]);

  // Handle login
  const handleLogin = (newToken: string, userInfo: User) => {
    setToken(newToken);
    const userWithLoginTime = { ...userInfo, loginTime: new Date().toISOString() };
    sessionStorage.setItem("currentUser", JSON.stringify(userWithLoginTime));
    setCurrentUser(userWithLoginTime);
    localStorage.setItem("role", userWithLoginTime.role || "");
    console.log("User logged in App: ", userWithLoginTime);
  };

  // Handle logout
  const handleLogout = () => {
    removeToken();
    sessionStorage.removeItem("currentUser");
    setCurrentUser(null);
    localStorage.removeItem("role");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-primary font-mono font-semibold tracking-wider">
            INITIALIZING NEURAL NETWORK...
          </p>
        </div>
      </div>
    );
  }

  // ❌ No need for this check anymore because currentUser is initialized
  // if (isAuthenticated && !currentUser) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <p>Loading user data...</p>
  //     </div>
  //   );
  // }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SystemConfigProvider>
          <BrowserRouter>
            <Routes>
              {/* Login */}
              <Route
                path="/login"
                element={
                  isAuthenticated ? (
                    <Navigate to="/dashboard" />
                  ) : (
                    <LoginPage onLogin={handleLogin} />
                  )
                }
              />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  isAuthenticated ? (
                    <AdminDashboard onLogout={handleLogout} currentUser={currentUser} />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              <Route path="/reset-password" element={<ResetPasswordPage />} />

              <Route
                path="/analytics"
                element={
                  isAuthenticated ? <AnalyticsHub /> : <Navigate to="/login" />
                }
              />

              <Route
                path="/settings"
                element={
                  isAuthenticated ? (
                    <SystemSettings currentUser={currentUser} />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              <Route
                path="/user-management"
                element={
                  isAuthenticated ? (
                    <UserManagement loggedInUser={currentUser} />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              {/* Redirect root */}
              <Route
                path="/"
                element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />}
              />
            </Routes>
          </BrowserRouter>
        </SystemConfigProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;