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

      switch (msg.type) {
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
        case "analytics_update":
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