import React, { useEffect, useState } from "react";
import StationCard, { Station } from "../components/Station/StationCard";
import AdminWebSocketService from "@/services/Websockets";

const StationList: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const wsService = AdminWebSocketService.getInstance();

  useEffect(() => {
    wsService.connect();

    wsService.onMessage = (data: any) => {
      if (data.type === "station_status") {
        setStations((prev) =>
          prev.map((s) => (s.id === data.stationId ? { ...s, status: data.status } : s))
        );
      } else if (data.type === "session_update") {
        setStations((prev) =>
          prev.map((s) => (s.id === data.stationId ? { ...s, currentSession: data.session } : s))
        );
      } else {
        console.log("Unhandled WS event:", data);
      }
    };

    return () => wsService.disconnect();
  }, []);

  const handleAction = (stationId: string, action: string, data?: any) => {
    console.log(`Action: ${action}`, { stationId, data });
    wsService.send({ stationId, action, ...data });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stations.map((station) => (
        <StationCard
          key={station.id}
          station={station}
          onAction={handleAction}
          onDelete={() => console.log("delete", station.id)}
        />
      ))}
    </div>
  );
};

export default StationList;