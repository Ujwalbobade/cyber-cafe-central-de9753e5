import React, { useEffect } from "react"
import { Monitor, Gamepad2, Lock, Unlock, Hand } from "lucide-react"
import { Button } from "@/components/ui/button"
import AdminWebSocketService from "../../../services/Websockets"
import SessionPopup from "../../Session/SessionPopup"
import { Station } from "@/components/Station/Types/Stations"



interface StationGridViewProps {
  stations: Station[]
  onStationClick: (station: Station) => void
  onStationAction: (stationId: string, action: string, data?: any) => void
  updateStationStatus: (stationId: string, status: Station["status"]) => void
   currentUserRole: "admin" | "moderator"
}

const StationGridView: React.FC<StationGridViewProps> = ({
  stations,
  onStationClick,
  onStationAction,
  updateStationStatus,
   currentUserRole,
}) => {
  const stationWS = AdminWebSocketService.getInstance()
    const [selectedStation, setSelectedStation] = React.useState<Station | null>(null)

  useEffect(() => {
    stationWS.onMessage = (data) => {
      if (data.type === "STATION_STATUS") {
        updateStationStatus(data.stationId, data.status)
      }
    }
    return () => stationWS.disconnect()
  }, [stationWS, updateStationStatus])

   const handleStationClick = (station: Station) => {
    setSelectedStation(station) // ✅ open popup
    onStationClick(station)
  }

  const getStationColor = (station: Station) => {
    if (station.isLocked) return "bg-warning/20 border-warning shadow-glow-warning"
    switch (station.status) {
      case "AVAILABLE":
        return "bg-accent/20 border-accent shadow-glow-accent hover:shadow-glow-accent/80"
      case "OCCUPIED":
        return "bg-error/20 border-error shadow-glow-error"
      case "MAINTENANCE":
        return "bg-secondary/20 border-secondary shadow-glow-secondary"
      case "OFFLINE":
        return "bg-muted/40 border-muted text-muted-foreground"
      default:
        return "bg-muted/20 border-muted"
    }
  }

  const getStationNumber = (stationName: string) => {
    const match = stationName.match(/(\d+)/)
    return match ? match[1] : stationName.charAt(stationName.length - 1)
  }

  const getTypeIcon = (type: Station["type"]) => {
    switch (type) {
      case "PC":
        return <Monitor className="w-4 h-4 text-primary" />
      case "PS5":
      case "PS4":
        return <Gamepad2 className="w-4 h-4 text-secondary" />
      default:
        return <Monitor className="w-4 h-4 text-primary" />
    }
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-4 p-6">
      {stations.map((station, index) => (
        <div
          key={station.id}
          className={`
            relative w-16 h-16 rounded-full border-2 cursor-pointer
            flex flex-col items-center justify-center
            transition-all duration-300 hover:scale-110
            ${getStationColor(station)}
            animate-fade-in group
          `}
          style={{ animationDelay: `${index * 0.05}s` }}
          onClick={() => handleStationClick(station)}  // ✅ delegate to parent
        >
          {/* Station Type Icon */}
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-card rounded-full flex items-center justify-center border border-primary/30">
            {getTypeIcon(station.type)}
          </div>

          {/* Station Number */}
          <div className="font-gaming font-bold text-sm text-foreground">
            {getStationNumber(station.name)}
          </div>

          {/* Status Indicator */}
          <div className="text-xs font-gaming text-muted-foreground">
            {station.status === "AVAILABLE"
              ? "FREE"
              : station.status === "OCCUPIED" && station.currentSession
              ? `${Math.floor(station.currentSession.timeRemaining / 60)}:${(
                  station.currentSession.timeRemaining % 60
                )
                  .toString()
                  .padStart(2, "0")}`
              : station.status === "OCCUPIED"
              ? "BUSY"
              : "MAINT"}
          </div>

          {/* Hand Raised Indicator */}
          {station.handRaised && (
            <div className="absolute -top-1 -left-1 w-4 h-4 bg-error rounded-full flex items-center justify-center animate-pulse">
              <Hand className="w-2 h-2 text-error-foreground" />
            </div>
          )}

          {/* Lock / Unlock Buttons */}
          {station.isLocked ? (
            <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-warning rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-warning-foreground rounded-full" />
            </div>
          ) : (
            <div className="absolute -bottom-1 -left-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                className="w-4 h-4 p-0 bg-primary/20 hover:bg-primary/40 rounded-full"
                onClick={(e) => {
                  e.stopPropagation()
                  onStationAction(station.id, "lock")
                }}
              >
                <Lock className="w-2 h-2 text-primary" />
              </Button>
            </div>
          )}

          {station.isLocked && (
            <div className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                className="w-4 h-4 p-0 bg-warning/20 hover:bg-warning/40 rounded-full"
                onClick={(e) => {
                  e.stopPropagation()
                  onStationAction(station.id, "unlock")
                }}
              >
                <Unlock className="w-2 h-2 text-warning" />
              </Button>
            </div>
          )}

          {/* Active Session Pulse */}
          {station.status === "OCCUPIED" && (
            <div className="absolute inset-0 rounded-full border-2 border-error animate-pulse opacity-50" />
          )}
        </div>
      ))}
      {/* Session Popup (same as StationCard) */}
      {selectedStation && (
        <SessionPopup
          station={selectedStation}
          isOpen={!!selectedStation}
          onClose={() => setSelectedStation(null)}
          onAction={onStationAction}
          onDelete={() => onStationAction(selectedStation.id, "delete")}
          userRole={currentUserRole}
        />
      )}
    </div>
  )
}

export default StationGridView