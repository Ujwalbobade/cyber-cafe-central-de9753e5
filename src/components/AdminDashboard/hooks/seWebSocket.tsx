import { useEffect, useState} from 'react';
import AdminWebSocketService from "../../../services/Websockets";
import { Station } from "../../Station/Types/Stations";

export const useWebSocket = (setStations: React.Dispatch<React.SetStateAction<Station[]>>) => {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');

  useEffect(() => {
    const ws = AdminWebSocketService.getInstance();

    ws.onConnectionChange = (state) => setConnectionStatus(state);

    ws.onMessage = (event: any) => {
      let msg: any;
      try {
        msg = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch (err) {
        console.error("Error parsing WS message", event.data, err);
        return;
      }

      if (!msg) {
        console.warn('WebSocket message is undefined:', event);
        return;
      }
      const { type, data } = msg;

      switch (type) {
        case "STATION_CONNECTED":
          setStations((prev) =>
            prev.map((station) =>
              station.id === data.stationId
                ? { ...station, status: "OCCUPIED", ipAddress: data.ipAddress }
                : station
            )
          );
          break;

        case "STATION_IDLE":
          setStations((prev) =>
            prev.map((station) =>
              station.id === data.stationId
                ? { ...station, status: "AVAILABLE", ipAddress: data.ipAddress, currentSession: undefined }
                : station
            )
          );
          break;

        case "STATION_DISCONNECTED":
          setStations((prev) =>
            prev.map((station) =>
              station.id === data.stationId
                ? { ...station, status: "OFFLINE", currentSession: undefined }
                : station
            )
          );
          break;

        case "STATION_STATUS_UPDATE":
          setStations((prev) =>
            prev.map((station) =>
              station.id === data.stationId
                ? {
                  ...station,
                  status: data.status,
                  currentSession: data.user ? {
                    id: station.currentSession?.id || "",
                    customerName: data.user,
                    startTime: station.currentSession?.startTime || new Date().toISOString(),
                    timeRemaining: data.timeLeft || 0
                  } : undefined
                }
                : station
            )
          );
          break;

        case "SESSION_UPDATE":
          setStations((prev) =>
            prev.map((station) =>
              station.id === msg.stationId
                ? {
                  ...station,
                  status: msg.status === "COMPLETED" ? "AVAILABLE" : "OCCUPIED",
                  currentSession: msg.status === "COMPLETED" ? undefined : {
                    id: msg.sessionId,
                    customerName: station.currentSession?.customerName || "Customer",
                    startTime: new Date(msg.currentTime).toISOString(),
                    timeRemaining: Math.max(0, Math.floor((msg.endTime - Date.now()) / 60000))
                  }
                }
                : station
            )
          );
          break;

        case "USER_LOGIN":
          setStations((prev) =>
            prev.map((station) =>
              station.id === data.stationId
                ? { ...station, status: "OCCUPIED" }
                : station
            )
          );
          break;

        case "USER_LOGOUT":
          setStations((prev) =>
            prev.map((station) =>
              station.id === data.stationId
                ? { ...station, status: "AVAILABLE", currentSession: undefined }
                : station
            )
          );
          break;

        case "GAME_LAUNCH":
          console.log(`Game launched on station ${data.stationId}: ${data.gameName}`);
          break;

        case "TIME_REQUEST_SUBMITTED":
        case "time_request":
          console.log("Time request received:", data);
          break;

        case "analytics_update":
        case "real_time_data":
          break;

        default:
          console.log("Unhandled WS message:", msg);
      }
    };

    ws.onClose = () => setConnectionStatus("disconnected");
    ws.onError = () => setConnectionStatus("error");

    ws.connect();

    return () => ws.disconnect();
  }, [setStations]);

  return { connectionStatus };
};