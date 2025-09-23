import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

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
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  const setToken = (newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setTokenState(newToken);
  };

  const removeToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    setTokenState(null);
  };

  const isAuthenticated = isTokenValid(token);

  // optional: auto-remove expired token
  useEffect(() => {
    if (!isTokenValid(token)) {
      removeToken();
    }
  }, [token]);

  return (
    <TokenContext.Provider value={{ token, setToken, removeToken, isAuthenticated }}>
      {children}
    </TokenContext.Provider>
  );
};