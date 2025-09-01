// ✅ Detect API base URL dynamically - targeting backend on port 8087
const getApiBaseUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const override = params.get("api") || localStorage.getItem("apiBase");
  
  if (override) {
    return `${override.replace(/\/+$/, "")}/api`;
  }
  
  // Default: backend runs on port 8087
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:8087/api`;
};
const API_BASE_URL = getApiBaseUrl();
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
   // ✅ ensures cookies/auth headers are sent
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || `Request failed: ${response.status}`);
  }
  return data;
};


// ----------- AUTH -----------
export const login = (username: string, password: string) =>
  apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

export const register = (user: {
  username: string;
  email: string;
  password: string;
  role: string;
}) =>
  apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(user),
  });

// ----------- STATIONS -----------
export const getStations = () => apiFetch("/auth/stations");

export const createStation = (stationData) =>
  apiFetch("/auth/stations", {
    method: "POST",
    body: JSON.stringify(stationData),
  });

export const deleteStation = (stationId) =>
  apiFetch(`/auth/stations/${stationId}`, { method: "DELETE" });

export const lockStation = (stationId) =>
  apiFetch(`/auth/stations/${stationId}/lock`, { method: "POST" });

export const unlockStation = (stationId) =>
  apiFetch(`/auth/stations/${stationId}/unlock`, { method: "POST" });

// ----------- SESSIONS -----------
export const startSession = (stationId, sessionData) =>
  apiFetch("/auth/sessions/start", {
    method: "POST",
    body: JSON.stringify({ stationId, ...sessionData }),
  });

export const endSession = (sessionId) =>
  apiFetch(`/auth/sessions/${sessionId}/end`, { method: "POST" });

export const addTime = (sessionId, minutes) =>
  apiFetch(`/auth/sessions/${sessionId}/add-time`, {
    method: "POST",
    body: JSON.stringify({ minutes }),
  });

// ----------- SYSTEM CONFIG -----------
export const getSystemConfig = () => apiFetch("/auth/system-config/latest");

export const saveSystemConfig = (configData) =>
  apiFetch("/auth/system-config", {
    method: "POST",
    body: JSON.stringify(configData),
  });