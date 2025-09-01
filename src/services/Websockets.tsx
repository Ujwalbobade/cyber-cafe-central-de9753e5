// types
export type ConnectionState = "connected" | "disconnected" | "error";
const token = localStorage.getItem("token");

const WS_URL = `${
  window.location.protocol === "https:" ? "wss:" : "ws:"
}//${window.location.hostname}:8087/ws/admin?token=${token}`;

const ws = new WebSocket(`ws://localhost:8087/ws/admin?token=${token}`);

export default class AdminWebSocketService {
  private static instance: AdminWebSocketService;
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectInterval = 3000;
  private subscribed = false;

  public onMessage: ((data: any) => void) | null = null;
  public onConnectionChange: ((state: ConnectionState) => void) | null = null;

  // Singleton instance getter
  public static getInstance(): AdminWebSocketService {
    if (!AdminWebSocketService.instance) {
      AdminWebSocketService.instance = new AdminWebSocketService();
    }
    return AdminWebSocketService.instance;
  }

  private constructor() {}

  connect(): void {
  if (this.socket) {
    // Only connect if the socket does not exist or is closed
    if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
      console.log("WebSocket already connected or connecting, skipping...");
      return;
    }
  }

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

  this.socket.onclose = (event) => {
    console.log("Admin WebSocket disconnected ❌", event);
    this.onConnectionChange?.("disconnected");
    this.socket = null;

    // Optional: auto-reconnect
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
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