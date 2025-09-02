// types
export type ConnectionState = "connected" | "disconnected" | "error";

// ✅ Fetch token from BE and store in localStorage (only if missing)
async function fetchDummyToken(): Promise<string> {
  let token = localStorage.getItem("token");

  if (token) {
    console.log("Reusing existing token from localStorage ✅");
    return token;
  }

  try {
    const res = await fetch("http://localhost:8087/api/auth/dummy-admin-token");
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      console.log("Dummy admin token fetched & stored ✅");
      return data.token;
    }
  } catch (err) {
    console.error("Failed to fetch dummy token", err);
  }

  return "";
}

// ✅ Helper to build WebSocket URL with latest token
function getWebSocketUrl(): string {
  const token = localStorage.getItem("token") || "";
  const params = new URLSearchParams(window.location.search);
  const override =
    params.get("ws") || params.get("wsBase") || localStorage.getItem("wsBase");
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const hostname = window.location.hostname;

  if (override) {
    let base = override.replace(/\/+$/, "");
    if (base.startsWith("http://"))
      base = "ws://" + base.slice("http://".length);
    if (base.startsWith("https://"))
      base = "wss://" + base.slice("https://".length);
    if (!/^wss?:\/\//.test(base)) {
      base = `${wsProtocol}//${base}`;
    }
    return `${base}/ws/admin${token ? `?token=${encodeURIComponent(token)}` : ""}`;
  }

  return `${wsProtocol}//${hostname}:8087/ws/admin${
    token ? `?token=${encodeURIComponent(token)}` : ""
  }`;
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

 // ✅ Modified connect(): ensures token is ready before connecting
// ✅ Always fetch a fresh token before connect
async connect(): Promise<void> {
  if (
    this.socket &&
    (this.socket.readyState === WebSocket.OPEN ||
      this.socket.readyState === WebSocket.CONNECTING)
  ) {
    console.log("WebSocket already connected or connecting, skipping...");
    return;
  }

  // 🔄 Always fetch a new token (don't rely on old one)
  console.log("Fetching fresh dummy token before connect...");
  const token = await fetchDummyToken();

  if (!token) {
    console.error("❌ No token received, cannot connect WebSocket.");
    return;
  }

  const WS_URL = getWebSocketUrl(); // this will now include fresh token
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

    // ♻️ Auto-reconnect with fresh token
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(async () => {
        this.reconnectAttempts++;
        await this.connect(); // will fetch a new token again
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