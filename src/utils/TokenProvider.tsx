import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type TokenContextType = {
  token: string | null;
  setToken: (token: string) => void;
  removeToken: () => void;
  isAuthenticated: boolean;
};

const TOKEN_KEY = "adminToken";
const TokenContext = createContext<TokenContextType | undefined>(undefined);

export const useToken = (): TokenContextType => {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error("useToken must be used within a TokenProvider");
  }
  return context;
};

const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp && Date.now() < payload.exp * 1000 - 30_000; // 30s buffer
  } catch {
    return false;
  }
};

type Props = { children: ReactNode };

export const TokenProvider: React.FC<Props> = ({ children }) => {
  const navigate = useNavigate();
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  const setToken = (newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setTokenState(newToken);
  };

  const removeToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("token");
    localStorage.removeItem("token-dummy");
    setTokenState(null);
  };

  const isAuthenticated = isTokenValid(token);

  // Auto-remove expired token and redirect to login
  useEffect(() => {
    if (token && !isTokenValid(token)) {
      removeToken();
      navigate("/login");
    }
  }, [token, navigate]);

  return (
    <TokenContext.Provider value={{ token, setToken, removeToken, isAuthenticated }}>
      {children}
    </TokenContext.Provider>
  );
};