// SystemConfigContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { getSystemConfig } from "@/services/apis/api";
import { SystemConfiguration } from "@/components/SystemConfiguration/SystemConfig";

interface SystemConfigContextType {
  config: SystemConfiguration | null;
  refresh: () => void;
}

const SystemConfigContext = createContext<SystemConfigContextType>({
  config: null,
  refresh: () => {},
});

export const SystemConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SystemConfiguration | null>(null);

  const fetchConfig = () => {
    getSystemConfig()
      .then(setConfig)
      .catch((err) => console.error("Failed to fetch config:", err));
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <SystemConfigContext.Provider value={{ config, refresh: fetchConfig }}>
      {children}
    </SystemConfigContext.Provider>
  );
};

export const useSystemConfig = () => useContext(SystemConfigContext);