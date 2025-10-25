import React, { useEffect, useState } from "react";
import StationCard, { Station } from "../components/Station/views/StationCardView";
import AdminWebSocketService from "@/services/Websockets";

const StationList: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const wsService = AdminWebSocketService.getInstance();


  useEffect(() => {
    wsService.connect();

    wsService.onMessage = (data: unknown) => {
      if (
        typeof data === "object" &&
        data !== null &&
        "type" in data
      ) {
        const d = data as Record<string, unknown>;
        if (d.type === "station_status" && typeof d.stationId === "string" && typeof d.status === "string") {
          setStations((prev) =>
            prev.map((s) => (s.id === d.stationId ? { ...s, status: d.status as Station["status"] } : s))
          );
        } else if (
          d.type === "session_update" &&
          typeof d.stationId === "string" &&
          typeof d.session === "object" &&
          d.session !== null &&
          "id" in d.session &&
          "customerName" in d.session &&
          "startTime" in d.session &&
          "timeRemaining" in d.session
        ) {
          setStations((prev) =>
            prev.map((s) =>
              s.id === d.stationId
                ? {
                    ...s,
                    currentSession: d.session as Station["currentSession"],
                  }
                : s
            )
          );
        } else {
          console.log("Unhandled WS event:", data);
        }
      }
    };

    return () => wsService.disconnect();
  }, [wsService]);

  const handleAction = async (stationId: string, action: string, data?: Record<string, unknown>) => {
    console.log(`Action: ${action}`, { stationId, data });
    wsService.send({ stationId, action, ...data });
  };

  const handleDelete = (station: Station) => {
    console.log("Delete station:", station.id);
    // Handle station deletion
  };

  const updateStationStatus = (stationId: string, status: Station["status"]) => {
    setStations((prev) =>
      prev.map((s) => (s.id === stationId ? { ...s, status } : s))
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stations.map((station) => (
        <StationCard
          key={station.id}
          station={station}
          onAction={handleAction}
          onDelete={() => handleDelete(station)}
          updateStationStatus={updateStationStatus}
          currentUserRole="admin"
        />
      ))}
    </div>
  );
};

export default StationList;