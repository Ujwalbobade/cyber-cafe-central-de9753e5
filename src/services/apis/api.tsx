
// ----------------- api.ts -----------------
const getApiBaseUrl = (): string => {
  const params = new URLSearchParams(window.location.search);
  const override = params.get("api") || localStorage.getItem("apiBase");

  if (override) return `${override.replace(/\/+$/, "")}/api`;

  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:8087/api`;
};
const API_BASE_URL = getApiBaseUrl();

// ----------------- TOKEN HANDLING -----------------
const getToken = async (): Promise<string | null> => {
  let token = localStorage.getItem("token") || localStorage.getItem("token-dummy");
  console.log("Existing token:", token);
  const isValid = (t: string) => {
    try {
      const payload = JSON.parse(atob(t.split(".")[1]));
      return payload.exp && Date.now() < payload.exp * 1000 - 30_000; // 30s buffer
    } catch {
      return false;
    }
  };

  if (token && isValid(token)) return token;

  // Fetch new dummy token if needed
  try {
    const res = await fetch(`${API_BASE_URL}/auth/dummy-admin-token`);
    if (!res.ok) throw new Error("Failed to fetch dummy token");
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token-dummy", data.token);
      return data.token;
    }
  } catch (err) {
    console.error("Token fetch error:", err);
  }

  return token; // fallback to old token if dummy fails
};

const getAuthHeaders = async () => {
  const token = await getToken();
  console.log("Using token:", token);
  localStorage.setItem("token", token || "");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};


// ----------------- GENERIC FETCH -----------------
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  // Always use getAuthHeaders so we never forget the token
  const authHeaders = await getAuthHeaders();

  const headers: HeadersInit = {
    ...authHeaders,          // includes Content-Type + Authorization if token exists
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("You are not logged in or your session expired.");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Request failed");
  }

  return response.json();
};

// ----------------- AUTH -----------------
export const login = async (username: string, password: string) => {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  if (data.token) {
    localStorage.setItem("token", data.token);
    console.log("Login successful, token saved:", data.token);
  } else {
    console.warn("Login response did not include a token:", data);
  }

  return data;
};

export const getCurrentUser = () => apiFetch("/auth/me");

export const register = (user: {
  username: string;
  email: string;
  password: string;
  role: string;
  fullName: string;
  phoneNumber: string;
}) => apiFetch("/auth/register", { method: "POST", body: JSON.stringify(user) });

// ----------------- STATIONS -----------------
export const getStations = () => apiFetch("/auth/stations");
export const createStation = (stationData: any) => apiFetch("/auth/stations", { method: "POST", body: JSON.stringify(stationData) });
export const deleteStation = (stationId: string) => apiFetch(`/auth/stations/${stationId}`, { method: "DELETE" });
export const lockStation = (stationId: string) => apiFetch(`/auth/stations/${stationId}/lock`, { method: "POST" });
export const unlockStation = (stationId: string) => apiFetch(`/auth/stations/${stationId}/unlock`, { method: "POST" });
export const getTotalStations = () => apiFetch("/auth/stations/count");

// ----------------- SESSIONS -----------------
export const startSession = (stationId: string, sessionData: any) =>
  apiFetch("/auth/sessions/start", { method: "POST", body: JSON.stringify({ stationId, ...sessionData }) });

export const endSession = (sessionId: string) => apiFetch(`/auth/sessions/${sessionId}/end`, { method: "POST" });
export const addTime = (sessionId: string, minutes: number) =>
  apiFetch(`/auth/sessions/${sessionId}/add-time`, { method: "POST", body: JSON.stringify({ minutes }) });

// ----------------- ANALYTICS -----------------
export const getAnalytics = (timeRange: string = "7days") =>
  apiFetch(`/auth/analytics?timeRange=${timeRange}`);

export const getRealTimeAnalytics = () => apiFetch("/auth/analytics/real-time");

// ----------------- SYSTEM CONFIG -----------------
export const getSystemConfig = () => apiFetch("/auth/system-config/latest");

export const saveSystemConfig = (configData: any) =>  apiFetch("/auth/system-config", {method: "POST", body: JSON.stringify(configData)});

// ----------------- USERS -----------------
export const getAllUsers = () => apiFetch("/auth/users");

export const updateUser = (id: string, updatedUser: any) =>
  apiFetch(`/auth/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(updatedUser),
  });
