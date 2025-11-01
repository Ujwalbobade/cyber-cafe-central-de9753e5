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
  const token = localStorage.getItem("token") || localStorage.getItem("token-dummy");

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
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const hostname = window.location.hostname;
  return `${wsProtocol}//${hostname}:8087/ws/admin${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}

export default class AdminWebSocketService {
  private notificationHandler: ((msg: { type?: string; message?: string }) => void) | null = null;
  public registerNotificationHandler(handler: (msg: { type?: string; message?: string }) => void) {
    this.notificationHandler = handler;
  }
  private static instance: AdminWebSocketService;
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectInterval = 3000;
  private heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  public onMessage: ((data: unknown) => void) | null = null;
  public onConnectionChange: ((state: ConnectionState) => void) | null = null;
  public onError: ((error: unknown) => void) | null = null;
  public onClose: (() => void) | null = null;
  public onStationConnected: ((station: any) => void) | null = null;
  public onStationDisconnected: ((station: any) => void) | null = null;
  public onStationStatus: ((stations: any[]) => void) | null = null;
  

  public static getInstance(): AdminWebSocketService {
    if (!AdminWebSocketService.instance) {
      AdminWebSocketService.instance = new AdminWebSocketService();
    }
    return AdminWebSocketService.instance;
  }

  private constructor() { }

  async connect(): Promise<void> {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) return;

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
      this.send({ action: "subscribe_analytics" });
      // Start heartbeat
      this.startHeartbeat();
    };

   this.socket.onmessage = (event) => {
  let data: any;
  try {
    data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
  } catch (error) {
    console.error("Error parsing WS message", event.data, error);
    return;
  }

  console.log("[WS RECV]", data);

  // 🧭 Central message routing
  switch (data.type) {
    case "STATION_CONNECTED":
      console.log("✅ Station connected:", data.data);
      this.onStationConnected?.(data.data);
      break;

    case "STATION_DISCONNECTED":
      console.log("⚠️ Station disconnected:", data.data);
      this.onStationDisconnected?.(data.data);
      break;

    case "station_status":
      this.onStationStatus?.(data.stations || []);
      break;

    case "notification":
      this.notificationHandler?.(data);
      break;

    default:
      console.warn("Unhandled WS message:", data);
      this.onMessage?.(data); // fallback for generic listeners
  }
};

    this.socket.onerror = (error) => {
      console.error("WebSocket error", error);
      this.onConnectionChange?.("error");
      this.onError?.(error);
    };

    this.socket.onclose = async () => {
      this.socket = null;
      this.onConnectionChange?.("disconnected");
      this.onClose?.();
      this.stopHeartbeat();
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(async () => {
          this.reconnectAttempts++;
          await this.connect();
        }, this.reconnectInterval);
      }
    };
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.send({ action : "heartbeat" });
    }, 5000); // send heartbeat every 5s
  }
  private stopHeartbeat() {
    if (this.heartbeatInterval) { clearInterval(this.heartbeatInterval); }
    if (this.heartbeatTimeout) { clearTimeout(this.heartbeatTimeout); }
    this.heartbeatInterval = null;
    this.heartbeatTimeout = null;
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
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      console.log('[WS SEND]', message);
    } else {
      console.warn("❌ WebSocket is not open. Message not sent:", message);
    }
  }

  startSession(stationId: string, userId: string, gameId: string, durationMinutes: number) {
    this.send({
      action: "start_session",
      stationId,
      userId,
      gameId,
      durationMinutes
    });
    console.log('[WS SEND] start_session', { stationId, userId, gameId, durationMinutes });
  }

  endSession(sessionId: string) {
    this.send({
      type: "end_session",
      sessionId
    });
    console.log('[WS SEND] end_session', { sessionId });
  }

  updateSessionTime(sessionId: string, additionalMinutes: number) {
    this.send({
      type: "add_time",
      sessionId,
      additionalMinutes
    });
    console.log('[WS SEND] add_time', { sessionId, additionalMinutes });
  }

  approveTimeRequest(requestId: number, approved: boolean) {
    this.send({
      type: "approve_time_request",
      requestId,
      approved
    });
    console.log('[WS SEND] approve_time_request', { requestId, approved });
  }

  
}