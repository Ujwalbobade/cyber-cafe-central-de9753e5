// types
export type ConnectionState = "connected" | "disconnected" | "error";

function decodeJwt(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

// ✅ Fetch fresh token (user first, then dummy)
async function fetchFreshToken(): Promise<string> {
  const BUFFER_MS = 30_000; // 30 sec buffer
  let token = localStorage.getItem("token") || localStorage.getItem("token-dummy");

  const isValid = (t: string) => {
    const payload = decodeJwt(t);
    if (!payload?.exp) return false;
    return Date.now() < payload.exp * 1000 - BUFFER_MS;
  };

  if (token && isValid(token)) return token;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/dummy-admin-token`);
    if (!res.ok) throw new Error(`Failed to fetch dummy token: ${res.status}`);
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token-dummy", data.token);
      console.log("🔄 Refreshed dummy token ✅");
      return data.token;
    }
  } catch (err) {
    console.error("Error fetching dummy token:", err);
  }

  return token || "";
}

const API_BASE_URL = (() => {
  const params = new URLSearchParams(window.location.search);
  const override = params.get("api") || localStorage.getItem("apiBase");
  if (override) return `${override.replace(/\/+$/, "")}/api`;
  return `${window.location.protocol}//${window.location.hostname}:8087/api`;
})();

// ✅ WebSocket URL generator
async function getWebSocketUrl(): Promise<string> {
  const token = await fetchFreshToken();
  const params = new URLSearchParams(window.location.search);
  const override = params.get("ws") || localStorage.getItem("wsBase");
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const hostname = window.location.hostname;
  let baseUrl = override ? override.replace(/\/+$/, "") : `${wsProtocol}//${hostname}:8087`;
  if (!/^wss?:\/\//.test(baseUrl)) baseUrl = `${wsProtocol}//${baseUrl}`;
  return `${baseUrl}/ws/admin${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}

export default class AdminWebSocketService {
  private static instance: AdminWebSocketService;
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectInterval = 3000;

  public onMessage: ((data: any) => void) | null = null;
  public onConnectionChange: ((state: ConnectionState) => void) | null = null;
  public onError: ((error: any) => void) | null = null;
  public onClose: (() => void) | null = null;

  public static getInstance(): AdminWebSocketService {
    if (!AdminWebSocketService.instance) {
      AdminWebSocketService.instance = new AdminWebSocketService();
    }
    return AdminWebSocketService.instance;
  }

  private constructor() { }

  async connect(): Promise<void> {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return; // already connected
    }

    const WS_URL = await getWebSocketUrl();
    if (!WS_URL) {
      console.warn("❌ Cannot connect WebSocket without a valid token");
      return;
    }

    this.socket = new WebSocket(WS_URL);
    this.socket.onopen = () => {
      console.log("Admin WebSocket connected ✅");
      this.reconnectAttempts = 0;
      this.onConnectionChange?.("connected");
      this.send({ type: "subscribe_analytics" });
    };

    this.socket.onmessage = (event) => {
      let data: any;

      // If already an object, use it directly; otherwise parse
      if (typeof event.data === "string") {
        try {
          data = JSON.parse(event.data);
        } catch (error) {
          console.error("Error parsing WS message", event.data, error);
          return;
        }
      } else {
        data = event.data;
      }

      this.onMessage?.(data);
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error", error);
      this.onConnectionChange?.("error");
      this.onError?.(error); // trigger external handler
    };

    this.socket.onclose = async () => {
      this.socket = null;
      this.onConnectionChange?.("disconnected");
      this.onClose?.(); // trigger external handler
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(async () => {
          this.reconnectAttempts++;
          await this.connect();
        }, this.reconnectInterval);
      }
    };
  }


  disconnect(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send({ type: "unsubscribe_analytics" });
      this.socket.close(1000, "Client disconnect");
      this.socket = null;
      console.log("Admin WebSocket disconnected by client ✅");
    }
  }

  send(message: object): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
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
    return this.socket != null && this.socket.readyState === WebSocket.OPEN;
  }
}