import React, { useState, useEffect } from "react";
import {
  Monitor,
  Gamepad2,
  Play,
  Square,
  Lock,
  Unlock,
  Trash2,
  User,
  Zap,
  AlertTriangle,
  Settings,
  Hand,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AdminWebSocketService from "../../services/Websockets";
import SessionPopup from "../Session/SessionPopup";

//
// -------------------- Interfaces --------------------
export type StationType = "PC" | "PS5" | "PS4";
export type StationStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";

export interface Session {
  id: string;
  customerName: string;
  startTime: string;
  timeRemaining: number;
  endTime?: number;
}

export interface Station {
  id: string;
  name: string;
  type: StationType;
  status: StationStatus;
  hourlyRate: number;
  ipAddress?: string;
  specifications: string;
  isLocked: boolean;
  lockedFor?: string;
  handRaised?: boolean;
  currentSession?: Session;
}

export interface StationCardProps {
  station: Station;
  onAction: (stationId: string, action: string, data?: any) => void;
  onDelete: () => void;
  updateStationStatus?: (stationId: string, status: StationStatus) => void;
}

//
// -------------------- Component --------------------
const StationCard: React.FC<StationCardProps> = ({
  station,
  onAction,
  onDelete,
  updateStationStatus,
}) => {
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showLockForm, setShowLockForm] = useState(false);
  const [lockUser, setLockUser] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  const [showSessionPopup, setShowSessionPopup] = useState(false);

  const [sessionData, setSessionData] = useState({
    customerName: "",
    timeMinutes: 60,
    prepaidAmount: 0,
  });

  const wsService = AdminWebSocketService.getInstance();

  //
  // -------------------- Effects --------------------
  useEffect(() => {
    wsService.connect();

    wsService.onMessage = (data: any) => {
      if (data.type === "STATION_STATUS" && data.stationId === station.id) {
        setIsOnline(data.online);
        updateStationStatus?.(data.stationId, data.status);
      }

      if (data.type === "STATION_UPDATE" && data.station?.id === station.id) {
        updateStationStatus?.(data.station.id, data.station.status);
      }

      if (data.type === "SESSION_UPDATE" && data.stationId === station.id) {
        const { status, endTime } = data;

        if (status === "STARTED") {
          station.currentSession = {
            id: data.sessionId,
            customerName: data.userId || "Unknown",
            startTime: new Date().toISOString(),
            timeRemaining: Math.max(
              0,
              Math.floor((endTime - Date.now()) / 60000)
            ),
          };
        }

        if (status === "TIME_UPDATED" && station.currentSession) {
          station.currentSession.timeRemaining = Math.max(
            0,
            Math.floor((endTime - Date.now()) / 60000)
          );
        }

        if (status === "COMPLETED") {
          station.currentSession = undefined;
        }
      }
    };

    wsService.onConnectionChange = (state) => {
      console.log("Station card WS connection:", state);
    };
  }, [station.id, wsService, updateStationStatus]);

  useEffect(() => {
    if (station.currentSession) {
      const timer = setInterval(() => {
        if (station.currentSession) {
          station.currentSession.timeRemaining = Math.max(
            0,
            station.currentSession.timeRemaining - 1
          );
        }
      }, 60000);
      return () => clearInterval(timer);
    }
  }, [station.currentSession]);

  //
  // -------------------- Helpers --------------------
  const getStatusConfig = (status: StationStatus) => {
    switch (status) {
      case "AVAILABLE":
        return {
          badge: "status-available",
          text: "ONLINE",
          glow: "shadow-glow-accent",
          border: "border-accent/30",
        };
      case "OCCUPIED":
        return {
          badge: "status-occupied",
          text: "IN SESSION",
          glow: "shadow-glow-secondary",
          border: "border-error/30",
        };
      case "MAINTENANCE":
        return {
          badge: "status-maintenance",
          text: "MAINTENANCE",
          glow: "shadow-glow-secondary",
          border: "border-warning/30",
        };
      default:
        return {
          badge: "bg-muted text-muted-foreground",
          text: "UNKNOWN",
          glow: "",
          border: "border-muted/30",
        };
    }
  };

  const statusConfig = getStatusConfig(station.status);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, "0")}`;
  };

  const getTypeIcon = (type: StationType) => {
    switch (type) {
      case "PC":
        return <Monitor className="w-6 h-6 text-primary" />;
      case "PS5":
      case "PS4":
        return <Gamepad2 className="w-6 h-6 text-secondary" />;
      default:
        return <Monitor className="w-6 h-6 text-primary" />;
    }
  };

  const handleStartSession = () => {
    if (sessionData.customerName.trim()) {
      onAction(station.id, "start-session", sessionData);
      setShowSessionForm(false);
      setSessionData({ customerName: "", timeMinutes: 60, prepaidAmount: 0 });
    }
  };

  //
  // -------------------- JSX --------------------
  //
  return (
    <Card
      className={`card-gaming ${statusConfig.border} ${statusConfig.glow} group relative overflow-hidden h-fit`}
    >
      {/* Header */}
      <div className="p-4 relative z-10">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              {getTypeIcon(station.type)}
            </div>
            <div>
              <h3 className="font-gaming font-semibold text-sm">
                {station.name}
              </h3>
              <p className="text-xs text-muted-foreground">{station.type}</p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <Badge
              className={`${statusConfig.badge} font-gaming text-xs px-2 py-0.5`}
            >
              {statusConfig.text}
            </Badge>
            {station.handRaised && (
              <Hand className="w-3 h-3 text-error animate-pulse" />
            )}
            {!isOnline && (
              <AlertTriangle className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Current Session */}
        {station.currentSession && (
          <div className="mb-3 p-3 bg-error/10 border border-error/30 rounded-lg">
            <div className="flex justify-between text-xs">
              <span className="font-semibold">
                {station.currentSession.customerName}
              </span>
              <span>{formatTime(station.currentSession.timeRemaining)}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        {!showSessionForm && !showLockForm && (
          <div className="space-y-2">
            {station.status === "AVAILABLE" && (
              <Button
                onClick={() => setShowSessionPopup(true)}
                className="w-full h-8 text-sm"
                disabled={station.isLocked}
              >
                <Play className="w-3 h-3 mr-1" /> INITIATE
              </Button>
            )}
            {station.status === "OCCUPIED" && (
              <div className="flex gap-1">
                <Button
                  onClick={() =>
                    onAction(station.id, "end-session", {
                      sessionId: station.currentSession?.id,
                    })
                  }
                  variant="destructive"
                  className="flex-1 h-8 text-xs"
                >
                  <Square className="w-3 h-3 mr-1" /> END
                </Button>
                <Button
                  onClick={() =>
                    onAction(station.id, "add-time", {
                      sessionId: station.currentSession?.id,
                      minutes: 30,
                    })
                  }
                  variant="secondary"
                  className="flex-1 h-8 text-xs"
                >
                  +30M
                </Button>
              </div>
            )}
            {station.status === "MAINTENANCE" && (
              <Button disabled className="w-full h-8 text-xs">
                <Settings className="w-3 h-3 mr-1" /> MAINTENANCE
              </Button>
            )}

            <div className="flex gap-1">
              <Button
                onClick={() =>
                  station.isLocked
                    ? onAction(station.id, "unlock")
                    : setShowLockForm(true)
                }
                variant="outline"
                size="sm"
                className="h-7 text-xs"
              >
                {station.isLocked ? (
                  <Unlock className="w-3 h-3" />
                ) : (
                  <Lock className="w-3 h-3" />
                )}
              </Button>
              <Button
                onClick={() => onAction(station.id, "raise-hand")}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
              >
                <Hand className="w-3 h-3" />
              </Button>
            </div>

            <Button
              onClick={onDelete}
              variant="outline"
              size="sm"
              className="h-7 text-xs text-error"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Session Form */}
        {showSessionForm && (
          <div className="mt-3 space-y-2 border p-3 rounded-md">
            <Input
              placeholder="Player name"
              value={sessionData.customerName}
              onChange={(e) =>
                setSessionData({
                  ...sessionData,
                  customerName: e.target.value,
                })
              }
              className="h-8 text-sm"
            />
            <select
              value={sessionData.timeMinutes}
              onChange={(e) =>
                setSessionData({
                  ...sessionData,
                  timeMinutes: parseInt(e.target.value),
                })
              }
              className="h-8 text-sm"
            >
              {[10, 15, 30, 60, 120, 180].map((m) => (
                <option key={m} value={m}>
                  {m < 60 ? `${m} min` : `${m / 60} hr`}
                </option>
              ))}
            </select>
            <Input
              type="number"
              value={sessionData.prepaidAmount}
              onChange={(e) =>
                setSessionData({
                  ...sessionData,
                  prepaidAmount: parseFloat(e.target.value),
                })
              }
              className="h-8 text-sm"
              placeholder="Prepaid ₹"
            />
            <div className="flex gap-2">
              <Button onClick={handleStartSession} className="flex-1 h-8 text-sm">
                <Zap className="w-3 h-3 mr-1" /> LAUNCH
              </Button>
              <Button
                onClick={() => setShowSessionForm(false)}
                variant="secondary"
                className="flex-1 h-8 text-sm"
              >
                CANCEL
              </Button>
            </div>
          </div>
        )}

        {/* Lock Form */}
        {showLockForm && (
          <div className="mt-3 space-y-2 border p-3 rounded-md">
            <Input
              placeholder="Assign to user (optional)"
              value={lockUser}
              onChange={(e) => setLockUser(e.target.value)}
              className="h-8 text-sm"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  onAction(station.id, "lock", {
                    assignedUser: lockUser || undefined,
                  });
                  setShowLockForm(false);
                  setLockUser("");
                }}
                className="flex-1 h-8 text-sm"
              >
                <Lock className="w-3 h-3 mr-1" /> LOCK
              </Button>
              <Button
                onClick={() => {
                  setShowLockForm(false);
                  setLockUser("");
                }}
                variant="secondary"
                className="flex-1 h-8 text-sm"
              >
                CANCEL
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Session Popup */}
      <SessionPopup
        station={station}
        isOpen={showSessionPopup}
        onClose={() => setShowSessionPopup(false)}
        onAction={onAction}
        onDelete={onDelete}
      />
    </Card>
  );
};

export default StationCard;