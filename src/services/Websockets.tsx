type ConnectionState = "connected" | "disconnected" | "error";

const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8087/ws/admin`;

export default class AdminWebSocketService {
  private static instance: AdminWebSocketService;
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectInterval = 3000;

  public onMessage: ((data: any) => void) | null = null;
  public onConnectionChange: ((state: ConnectionState) => void) | null = null;

  // Singleton instance getter
  public static getInstance(): AdminWebSocketService {
    if (!AdminWebSocketService.instance) {
      AdminWebSocketService.instance = new AdminWebSocketService();
    }
    return AdminWebSocketService.instance;
  }

  private constructor() {} // Private constructor to prevent direct instantiation

  connect(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) return;

    try {
      this.socket = new WebSocket(WS_URL);

      this.socket.onopen = () => {
        console.log("Admin WebSocket connected ✅");
        this.reconnectAttempts = 0;
        this.onConnectionChange?.("connected");
      };

      this.socket.onmessage = (event: MessageEvent) => {
        console.log("📩 Raw WS message:", event.data);
        try {
          const data = JSON.parse(event.data as string);
          console.log("✅ Parsed WS message:", data);
          this.onMessage?.(data);
        } catch (error) {
          console.error("❌ Error parsing WebSocket message:", error);
        }
      };

      this.socket.onclose = () => {
        console.log("Admin WebSocket disconnected ❌");
        this.onConnectionChange?.("disconnected");

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => {
            console.log(
              `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
            );
            this.connect();
          }, this.reconnectInterval);
        }
      };

      this.socket.onerror = (error: Event) => {
        console.error("WebSocket error:", error);
        this.onConnectionChange?.("error");
      };
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
      this.onConnectionChange?.("error");
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  send(message: object): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not open. Message not sent:", message);
    }
  }
}