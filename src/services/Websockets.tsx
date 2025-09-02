// types
export type ConnectionState = "connected" | "disconnected" | "error";

// ✅ Get the real token or fallback to dummy token if testing
function getToken(): string {
  return localStorage.getItem("token") || localStorage.getItem("token-dummy") || "";
}

// ✅ Helper to build WebSocket URL with token
function getWebSocketUrl(): string {
  const token = getToken();
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

    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("❌ No real user token found, WebSocket cannot connect.");
      return;
    }

    const WS_URL = getWebSocketUrl();
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