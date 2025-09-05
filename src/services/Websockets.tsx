// types
export type ConnectionState = "connected" | "disconnected" | "error";
function decodeJwt(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

async function ensureFreshToken(): Promise<string> {
  let token = localStorage.getItem("token") || localStorage.getItem("token-dummy");
  if (token) {
    const payload = decodeJwt(token);
    const exp = payload?.exp ? payload.exp * 1000 : 0;
    if (Date.now() < exp - 5 * 60 * 1000) {
      // still valid for 5 more min
      return token;
    }
  }

  // fetch new dummy token
  const res = await fetch(`${API_BASE_URL}/auth/dummy-admin-token`);
  const data = await res.json();
  if (data.token) {
    token = data.token;
    localStorage.setItem("token-dummy", token);
    console.log("🔄 Refreshed dummy token ✅");
    return token;
  }
  return "";
}
const getApiBaseUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const override = params.get("api") || localStorage.getItem("apiBase");

  if (override) {
    return `${override.replace(/\/+$/, "")}/api`;
  }

  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:8087/api`;
};
const API_BASE_URL = getApiBaseUrl();

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  let token: string | null = null;

  try {
    // Always fetch dummy token before any request
    const res = await fetch(`${API_BASE_URL}/auth/dummy-admin-token`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!res.ok) {
      console.warn(`⚠️ Dummy token endpoint returned ${res.status}, proceeding without token`);
    } else {
      const data = await res.json();
      if (data.token) {
        token = data.token;
        localStorage.setItem("token-dummy", token);
        console.log("Fetched dummy token ✅");
      }
    }
  } catch (err) {
    console.error("Failed to fetch dummy token", err);
    // Try to use existing token from localStorage
    token = localStorage.getItem("token") || localStorage.getItem("token-dummy");
    if (token) {
      console.log("Using existing token from localStorage");
    }
  } 
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || `Request failed: ${response.status}`);
  }
  return data;
};


// ✅ Always get a fresh token (real or dummy) before WS connection
async function ensureValidToken(): Promise<string> {
  let token = localStorage.getItem("token");

  if (token) return token; // real user token exists

  try {
    const res = await fetch(`${API_BASE_URL}/auth/dummy-admin-token`);
    const data = await res.json();
    if (data.token) {
      token = data.token;
      localStorage.setItem("token-dummy", token);
      console.log("Fetched fresh dummy token ✅");
      return token;
    }
  } catch (err) {
    console.error("Failed to fetch dummy token", err);
  }

  return "";
}

async function getWebSocketUrl(): Promise<string> {
  const token = await ensureFreshToken();
  const params = new URLSearchParams(window.location.search);
  const override =
    params.get("ws") || params.get("wsBase") || localStorage.getItem("wsBase");
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const hostname = window.location.hostname;

  let baseUrl = override ? override.replace(/\/+$/, "") : `${wsProtocol}//${hostname}:8087`;
  if (!/^wss?:\/\//.test(baseUrl)) {
    baseUrl = `${wsProtocol}//${baseUrl}`;
  }

  return `${baseUrl}/ws/admin${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}

export default class AdminWebSocketService {
  private static instance: AdminWebSocketService;
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectInterval = 3000;
  private subscribed = false;

  public onMessage: ((data: any) => void) | null = null;
  public onConnectionChange: ((state: ConnectionState) => void) | null = null;

  public static getInstance(): AdminWebSocketService {
    if (!AdminWebSocketService.instance) {
      AdminWebSocketService.instance = new AdminWebSocketService();
    }
    return AdminWebSocketService.instance;
  }

  private constructor() {}

   async connect(): Promise<void> {
  if (
    this.socket &&
    (this.socket.readyState === WebSocket.OPEN ||
      this.socket.readyState === WebSocket.CONNECTING)
  ) {
    console.log("WebSocket already connected or connecting, skipping...");
    return;
  }

  // Always get fresh token before each connect
  const token = await ensureValidToken();
  if (!token) {
    console.warn("❌ Cannot connect WebSocket without a valid token");
    return;
  }

  const WS_URL = await getWebSocketUrl(); // always includes fresh token
  console.log("Connecting with WS URL:", WS_URL);

  this.socket = new WebSocket(WS_URL);

  this.socket.onopen = () => {
    console.log("Admin WebSocket connected ✅");
    this.reconnectAttempts = 0;
    this.onConnectionChange?.("connected");
    this.send({ type: "subscribe_analytics" });
  };

  this.socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      this.onMessage?.(data);
    } catch {
      console.error("Error parsing WS message", event.data);
    }
  };

  this.socket.onclose = async (event) => {
    console.log("Admin WebSocket disconnected ❌", event);
    this.onConnectionChange?.("disconnected");
    this.socket = null;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(async () => {
        this.reconnectAttempts++;
        await this.connect();
      }, this.reconnectInterval);
    }
  };

  this.socket.onerror = (error) => {
    console.error("WebSocket error", error);
    this.onConnectionChange?.("error");
  };
}
  disconnect(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send({ type: "unsubscribe_analytics" });
      this.socket.close(1000, "Client disconnect");
      this.socket = null;
      this.subscribed = false;
      console.log("Admin WebSocket disconnected by client ✅");
    }
  }

  send(message: object): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  requestAnalytics(timeRange: string = "7days"): void {
    this.send({ type: "request_analytics", timeRange });
  }

  requestRealTimeData(): void {
    this.send({ type: "request_real_time_data" });
  }

  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}