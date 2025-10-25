import React, { useEffect, useState } from "react"
import {
  Monitor,
  Gamepad2,
  Lock,
  Unlock,
  Play,
  Clock,
  Trash2,
  Edit,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import AdminWebSocketService from "../../../services/Websockets"
import SessionPopup from "../../Session/SessionPopup"
import { Hand } from "lucide-react"

interface Station {
  id: string
  name: string
  type: "PC" | "PS5" | "PS4"
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "OFFLINE"
  hourlyRate: number
  specifications: string
  isLocked: boolean
  lockedFor?: string
  handRaised?: boolean
  currentSession?: {
    id: string
    customerName: string
    startTime: string
    timeRemaining: number
  }
}

interface StationTableViewProps {
  stations: Station[]
  onStationClick: (station: Station) => void
  onStationAction: (stationId: string, action: string, data?: Record<string, unknown>) => void
  onDelete: (station: Station) => void
  updateStationStatus: (stationId: string, status: Station["status"]) => void
  currentUserRole: "admin" | "moderator"
}

const StationTableView: React.FC<StationTableViewProps> = ({
  stations,
  onStationClick,
  onStationAction,
  onDelete,
  updateStationStatus,
  currentUserRole,
}) => {
  const wsService = AdminWebSocketService.getInstance()
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)
  const [showSessionPopup, setShowSessionPopup] = useState(false)

  useEffect(() => {
    wsService.connect()

    wsService.onMessage = (data) => {
      if (
        typeof data === "object" &&
        data !== null &&
        "type" in data
      ) {
        const d = data as Record<string, unknown>;
        if (d.type === "STATION_STATUS" && typeof d.stationId === "string" && typeof d.status === "string") {
          updateStationStatus(d.stationId, d.status as Station["status"]);
        }
        if (
          d.type === "STATION_UPDATE" &&
          typeof d.station === "object" &&
          d.station !== null &&
          "id" in d.station &&
          "status" in d.station
        ) {
          const s = d.station as Record<string, unknown>;
          if (typeof s.id === "string" && typeof s.status === "string") {
            updateStationStatus(s.id, s.status as Station["status"]);
          }
        }
      }
    }

    return () => {
      // keep WS alive for other components
    }
  }, [wsService, updateStationStatus])

  const getStatusBadge = (station: Station) => {
    if (station.isLocked) {
      return (
        <Badge
          variant="outline"
          className="bg-warning/20 text-warning border-warning/30"
        >
          <Lock className="w-3 h-3 mr-1" />
          LOCKED
        </Badge>
      )
    }

    switch (station.status) {
      case "AVAILABLE":
        return (
          <Badge
            variant="outline"
            className="bg-accent/20 text-accent border-accent/30"
          >
            AVAILABLE
          </Badge>
        )
      case "OCCUPIED":
        return (
          <Badge
            variant="outline"
            className="bg-error/20 text-error border-error/30"
          >
            <Play className="w-3 h-3 mr-1" />
            OCCUPIED
          </Badge>
        )
      case "MAINTENANCE":
        return (
          <Badge
            variant="outline"
            className="bg-secondary/20 text-secondary border-secondary/30"
          >
            MAINTENANCE
          </Badge>
        )
      default:
        return (
          <Badge
            variant="outline"
            className="bg-muted/20 text-muted-foreground border-muted/30"
          >
            UNKNOWN
          </Badge>
        )
    }
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

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const handleRowClick = (station: Station) => {
    setSelectedStation(station)
    setShowSessionPopup(true)
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-gaming text-foreground">Station</TableHead>
            <TableHead className="font-gaming text-foreground">Type</TableHead>
            <TableHead className="font-gaming text-foreground">Status</TableHead>
            <TableHead className="font-gaming text-foreground">Rate</TableHead>
            <TableHead className="font-gaming text-foreground">Session</TableHead>
            <TableHead className="font-gaming text-foreground">Hand Raise</TableHead>
            <TableHead className="font-gaming text-foreground text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stations.map((station) => (
            <TableRow
              key={station.id}
              className="hover:bg-muted/30 cursor-pointer transition-colors"
              onClick={() => handleRowClick(station)}
            >
              <TableCell className="font-gaming font-semibold text-foreground">
                {station.name}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  {getTypeIcon(station.type)}
                  <span className="text-sm font-gaming">{station.type}</span>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(station)}</TableCell>
              <TableCell>
                <span className="font-gaming text-sm">
                  ₹{station.hourlyRate}/hr
                </span>
              </TableCell>
              {/* 👇 Session */}
              <TableCell>
                {station.currentSession ? (
                  <div className="space-y-1">
                    <div className="text-sm font-gaming text-foreground">
                      {station.currentSession.customerName}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTime(station.currentSession.timeRemaining)} left
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              {/* 👇 Hand Raise */}
              <TableCell>
                {station.handRaised ? (
                  <Badge
                    variant="outline"
                    className="bg-yellow-100 text-yellow-800 border-yellow-300 flex items-center"
                  >
                    <Hand className="w-3 h-3 mr-1" />
                    Hand Raised
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-1">
                  {station.isLocked ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onStationAction(station.id, "unlock")
                      }}
                      className="h-8 w-8 p-0 hover:bg-warning/10 hover:text-warning"
                    >
                      <Unlock className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onStationAction(station.id, "lock")
                      }}
                      className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                    >
                      <Lock className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRowClick(station)
                    }}
                    className="h-8 w-8 p-0 hover:bg-secondary/10 hover:text-secondary"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(station)
                    }}
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Session Popup */}
      {selectedStation && (
        <SessionPopup
          station={selectedStation}
          isOpen={showSessionPopup}
          onClose={() => setShowSessionPopup(false)}
          onAction={onStationAction}
          onDelete={() => onDelete(selectedStation)}
          userRole={currentUserRole}
        />
      )}
    </div>
  )
}

export default StationTableView