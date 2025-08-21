type ConnectionState = "connected" | "disconnected" | "error";

export default class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectInterval = 3000;

  public onMessage: ((data: any) => void) | null = null;
  public onConnectionChange: ((state: ConnectionState) => void) | null = null;

  connect(): void {
    try {
      this.socket = new WebSocket("ws://localhost:8087/ws/admin");

      this.socket.onopen = () => {
        console.log("Admin WebSocket connected");
        this.reconnectAttempts = 0;
        this.onConnectionChange?.("connected");
      };

      this.socket.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          this.onMessage?.(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      this.socket.onclose = () => {
        console.log("Admin WebSocket disconnected");
        this.onConnectionChange?.("disconnected");

        // Attempt to reconnect
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
      console.warn("WebSocket is not open. Message not sent.");
    }
  }
}