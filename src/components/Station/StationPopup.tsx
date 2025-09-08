import React, { useState, useEffect, useCallback } from "react";
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
  Settings,
  CreditCard,
  UserPlus,
  Hand,
  Power,
  RotateCcw,
  Wrench,
  Wifi,
  Package,
  Plus,
  Keyboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSystemConfig } from "@/services/apis/api";

interface Station {
  id: string;
  name: string;
  type: "PC" | "PS5" | "PS4";
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "OFFLINE";
  hourlyRate: number;
  specifications: string;
  isLocked: boolean;
  lockedFor?: string;
  handRaised?: boolean;
  currentSession?: {
    id: string;
    customerName: string;
    startTime: string;
    timeRemaining: number;
  };
}

interface StationPopupProps {
  station: Station | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (stationId: string, action: string, data?: any) => void;
  onDelete: () => void;
}

// ---------- Helpers ----------
const quickTimePacks = [
  { label: "15m", minutes: 15, price: 37.5, hotkey: "1" },
  { label: "30m", minutes: 30, price: 75, hotkey: "2" },
  { label: "1h", minutes: 60, price: 150, hotkey: "3" },
  { label: "2h", minutes: 120, price: 300, hotkey: "4" },
  { label: "4h", minutes: 240, price: 600, hotkey: "5" },
];

const getTypeIcon = (type: Station["type"]) => {
  switch (type) {
    case "PC":
      return <Monitor className="w-8 h-8 text-primary" />;
    case "PS5":
    case "PS4":
      return <Gamepad2 className="w-8 h-8 text-secondary" />;
    default:
      return <Monitor className="w-8 h-8 text-primary" />;
  }
};

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, "0")}`;
};

const StationPopup: React.FC<StationPopupProps> = ({
  station,
  isOpen,
  onClose,
  onAction,
  onDelete,
}) => {
  const [allowedTimes, setAllowedTimes] = useState<number[]>([
    15, 30, 60, 120, 180,
  ]);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showLockForm, setShowLockForm] = useState(false);

  const [sessionData, setSessionData] = useState({
    customerName: "",
    timeMinutes: 60,
    prepaidAmount: 0,
  });
  const [lockData, setLockData] = useState({
    assignedUser: "",
    prepaidAmount: 0,
    notes: "",
  });

  useEffect(() => {
    getSystemConfig()
      .then((data) => {
        if (data.allowedTimes && Array.isArray(data.allowedTimes)) {
          setAllowedTimes(data.allowedTimes);
        }
      })
      .catch((err) => console.error("Failed to fetch config:", err));
  }, []);

  if (!station) return null;

  // Status Display
  const statusMap = {
    AVAILABLE: { text: "Available", badge: "bg-green-100 text-green-800" },
    OCCUPIED: { text: "In Session", badge: "bg-red-100 text-red-800" },
    MAINTENANCE: { text: "Maintenance", badge: "bg-yellow-100 text-yellow-800" },
    OFFLINE: { text: "Offline", badge: "bg-gray-200 text-gray-500" },
  };

  // Handlers
  const handleStartSession = () => {
    if (sessionData.customerName.trim()) {
      onAction(station.id, "start-session", sessionData);
      setShowSessionForm(false);
      setSessionData({ customerName: "", timeMinutes: 60, prepaidAmount: 0 });
      onClose();
    }
  };

  const handleLockStation = () => {
    if (lockData.assignedUser.trim()) {
      onAction(station.id, "lock", lockData);
      setShowLockForm(false);
      setLockData({ assignedUser: "", prepaidAmount: 0, notes: "" });
      onClose();
    }
  };

  const handleQuickSession = useCallback(
    (pack: typeof quickTimePacks[0]) => {
      if (station.status === "AVAILABLE" && !station.isLocked) {
        setSessionData({
          customerName: `Quick ${pack.label}`,
          timeMinutes: pack.minutes,
          prepaidAmount: pack.price,
        });
        setShowSessionForm(true);
      }
    },
    [station]
  );

  const handleAddQuickTime = (minutes: number) => {
    if (station?.currentSession) {
      onAction(station.id, "add-time", {
        sessionId: station.currentSession.id,
        minutes,
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md mx-auto p-0 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getTypeIcon(station.type)}
              <div>
                <DialogTitle className="font-bold text-lg">
                  {station.name}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {station.type} • ₹{station.hourlyRate}/hr
                </p>
              </div>
            </div>
            <Badge className={statusMap[station.status].badge}>
              {statusMap[station.status].text}
            </Badge>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Specs */}
          <div className="text-sm text-muted-foreground">
            <strong>Specs:</strong> {station.specifications}
          </div>

          {/* Lock Info */}
          {station.isLocked && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
              <Lock className="w-4 h-4 inline mr-2 text-yellow-600" />
              Locked for: {station.lockedFor}
            </div>
          )}

          {/* Session Info */}
          {station.currentSession && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex justify-between">
                <span>
                  <User className="w-4 h-4 inline mr-1" />
                  {station.currentSession.customerName}
                </span>
                <span className="font-bold">
                  {formatTime(station.currentSession.timeRemaining)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Started:{" "}
                {new Date(
                  station.currentSession.startTime
                ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          )}

          {/* Quick Packs */}
          {station.status === "AVAILABLE" && !station.isLocked && !showSessionForm && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Quick Packs</h4>
              <div className="grid grid-cols-5 gap-1">
                {quickTimePacks.map((pack) => (
                  <Button
                    key={pack.minutes}
                    onClick={() => handleQuickSession(pack)}
                    variant="outline"
                    size="sm"
                    className="flex-col h-12"
                  >
                    <div className="font-bold">{pack.label}</div>
                    <div className="text-xs">₹{pack.price}</div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Add Time */}
          {station.status === "OCCUPIED" && station.currentSession && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Add Time</h4>
              <div className="grid grid-cols-4 gap-1">
                {[15, 30, 60, 120].map((m) => (
                  <Button
                    key={m}
                    onClick={() => handleAddQuickTime(m)}
                    size="sm"
                    variant="outline"
                  >
                    +{m < 60 ? `${m}m` : `${m / 60}h`} (₹
                    {(station.hourlyRate * m) / 60})
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            {station.status === "AVAILABLE" && (
              <>
                <Button onClick={() => setShowSessionForm(true)}>
                  <Play className="w-4 h-4 mr-2" /> Start Session
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowLockForm(true)}
                >
                  <Lock className="w-4 h-4 mr-2" /> Assign Lock
                </Button>
              </>
            )}
            {station.status === "OCCUPIED" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() =>
                    onAction(station.id, "end-session", {
                      sessionId: station.currentSession?.id,
                    })
                  }
                >
                  <Square className="w-4 h-4 mr-2" /> End Session
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    onAction(station.id, "add-time", {
                      sessionId: station.currentSession?.id,
                      minutes: 30,
                    })
                  }
                >
                  +30 Min
                </Button>
              </>
            )}
          </div>

          {/* Forms */}
          {showSessionForm && (
            <div className="space-y-2 p-3 border rounded bg-primary/10">
              <h4 className="font-semibold">Start New Session</h4>
              <Input
                placeholder="Player name"
                value={sessionData.customerName}
                onChange={(e) =>
                  setSessionData({
                    ...sessionData,
                    customerName: e.target.value,
                  })
                }
              />
              <select
                value={sessionData.timeMinutes}
                onChange={(e) =>
                  setSessionData({
                    ...sessionData,
                    timeMinutes: parseInt(e.target.value),
                  })
                }
              >
                {allowedTimes.map((m) => (
                  <option key={m} value={m}>
                    {m < 60 ? `${m} min` : `${m / 60} hr`}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                placeholder="Prepaid Amount"
                value={sessionData.prepaidAmount}
                onChange={(e) =>
                  setSessionData({
                    ...sessionData,
                    prepaidAmount: parseFloat(e.target.value),
                  })
                }
              />
              <div className="flex gap-2">
                <Button onClick={handleStartSession}>
                  <Zap className="w-4 h-4 mr-2" /> Launch
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowSessionForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {showLockForm && (
            <div className="space-y-2 p-3 border rounded bg-yellow-50">
              <h4 className="font-semibold">Assign Lock</h4>
              <Input
                placeholder="Assign to user"
                value={lockData.assignedUser}
                onChange={(e) =>
                  setLockData({ ...lockData, assignedUser: e.target.value })
                }
              />
              <Input
                type="number"
                placeholder="Prepaid Amount"
                value={lockData.prepaidAmount}
                onChange={(e) =>
                  setLockData({
                    ...lockData,
                    prepaidAmount: parseFloat(e.target.value),
                  })
                }
              />
              <Input
                placeholder="Notes"
                value={lockData.notes}
                onChange={(e) =>
                  setLockData({ ...lockData, notes: e.target.value })
                }
              />
              <div className="flex gap-2">
                <Button onClick={handleLockStation}>
                  <Lock className="w-4 h-4 mr-2" /> Lock
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowLockForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Power & Maintenance */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction(station.id, "power-off")}
              disabled={station.status === "OCCUPIED"}
            >
              <Power className="w-4 h-4 mr-2" /> Power Off
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction(station.id, "restart")}
              disabled={station.status === "OCCUPIED"}
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Restart
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onAction(station.id, "toggle-maintenance", {
                  status:
                    station.status === "MAINTENANCE"
                      ? "AVAILABLE"
                      : "MAINTENANCE",
                })
              }
              disabled={station.status === "OCCUPIED"}
            >
              {station.status === "MAINTENANCE" ? (
                <>
                  <Wifi className="w-4 h-4 mr-2" /> Enable
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4 mr-2" /> Maintenance
                </>
              )}
            </Button>
          </div>

          {/* Delete */}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onDelete();
              onClose();
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Delete Station
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StationPopup;