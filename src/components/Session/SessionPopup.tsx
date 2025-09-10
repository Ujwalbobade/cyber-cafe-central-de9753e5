import React, { useState, useEffect, useCallback } from "react";
import {
  Monitor,
  Gamepad2,
  Play,
  Square,
  Lock,
  User,
  Zap,
  Power,
  RotateCcw,
  Wrench,
  Wifi,
  Trash2,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog";
import { getSystemConfig } from "@/services/apis/api";
import StationModal from "@/components/Station/StationModal";
import { Station } from "@/components/Types/Stations";

interface SessionPopupProps {
  station: Station | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (stationId: string, action: string, data?: any) => void;
  onDelete: (stationId: string) => void;
  userRole: "admin" | "moderator" | "viewer";
}

// ---------- Permissions ----------
const permissions = {
  admin: {
    canEdit: true,
    canDelete: true,
    canLock: true,
    canStartSession: true,
    canPower: true,
    canMaintenance: true,
  },
  moderator: {
    canEdit: false,
    canDelete: false,
    canLock: true,
    canStartSession: true,
    canPower: true,
    canMaintenance: true,
  },
  viewer: {
    canEdit: false,
    canDelete: false,
    canLock: false,
    canStartSession: false,
    canPower: false,
    canMaintenance: false,
  },
};

// ---------- Helpers ----------
const quickTimePacks = [
  { label: "15m", minutes: 15, price: 37.5 },
  { label: "30m", minutes: 30, price: 75 },
  { label: "1h", minutes: 60, price: 150 },
  { label: "2h", minutes: 120, price: 300 },
  { label: "4h", minutes: 240, price: 600 },
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

// ---------- Component ----------
const SessionPopup: React.FC<SessionPopupProps> = ({
  station,
  isOpen,
  onClose,
  onAction,
  onDelete,
  userRole,
}) => {
  const [allowedTimes, setAllowedTimes] = useState<number[]>([15, 30, 60, 120]);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showLockForm, setShowLockForm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

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

  const statusMap = {
    AVAILABLE: { text: "Available", badge: "bg-green-100 text-green-800" },
    OCCUPIED: { text: "In Session", badge: "bg-red-100 text-red-800" },
    MAINTENANCE: { text: "Maintenance", badge: "bg-yellow-100 text-yellow-800" },
    OFFLINE: { text: "Offline", badge: "bg-gray-100 text-gray-800" },
  };

  const rolePerms = permissions[userRole];

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
      if (
        station.status === "AVAILABLE" &&
        !station.isLocked &&
        rolePerms.canStartSession
      ) {
        setSessionData({
          customerName: `Quick ${pack.label}`,
          timeMinutes: pack.minutes,
          prepaidAmount: pack.price,
        });
        setShowSessionForm(true);
      }
    },
    [station, rolePerms]
  );

  const handleAddQuickTime = (minutes: number) => {
    if (station?.currentSession && rolePerms.canStartSession) {
      onAction(station.id, "add-time", {
        sessionId: station.currentSession.id,
        minutes,
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <DialogContent className="w-full max-w-md bg-background dark:bg-background-dark rounded-xl shadow-2xl border border-border p-6 animate-fade-in">
          {/* Header */}
          <DialogHeader className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getTypeIcon(station.type)}
                <div>
                  <DialogTitle className="font-bold text-lg text-foreground">
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

          {/* Locked Info */}
          {station.isLocked && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded mb-3">
              <Lock className="w-4 h-4 inline mr-2 text-yellow-600" />
              Locked for: {station.lockedFor}
            </div>
          )}

          {/* Current Session */}
          {station.currentSession && (
            <div className="p-3 bg-card border border-red-600 rounded mb-3">
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
          {station.status === "AVAILABLE" &&
            !station.isLocked &&
            !showSessionForm &&
            rolePerms.canStartSession && (
              <div className="mb-3">
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
          {station.status === "OCCUPIED" &&
            station.currentSession &&
            rolePerms.canStartSession && (
              <div className="mb-3">
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
          <div className="grid grid-cols-3 gap-2 mb-3">
            {station.status === "AVAILABLE" && (
              <>
                {rolePerms.canStartSession && (
                  <Button onClick={() => setShowSessionForm(true)}>
                    <Play className="w-4 h-4 mr-2" /> Start Session
                  </Button>
                )}
                {rolePerms.canLock && (
                  <Button
                    variant="outline"
                    onClick={() => setShowLockForm(true)}
                  >
                    <Lock className="w-4 h-4 mr-2" /> Assign Lock
                  </Button>
                )}
                {rolePerms.canEdit && (
                  <Button
                    variant="outline"
                    onClick={() => setShowEditDialog(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </Button>
                )}
              </>
            )}

            {station.status === "OCCUPIED" && rolePerms.canStartSession && (
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

            {rolePerms.canDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(station.id)}
                className="flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            )}
          </div>

          {/* Session Form */}
          {showSessionForm && rolePerms.canStartSession && (
            <div className="space-y-2 p-3 border rounded bg-card dark:bg-card-dark mb-3">
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
                className="w-full h-9 border rounded-md text-sm px-2 bg-background dark:bg-background-dark"
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

          {/* Edit Dialog */}
          {showEditDialog && station && rolePerms.canEdit && (
            <StationModal
              station={station}
              onClose={() => setShowEditDialog(false)}
              onSave={(updated) => {
                console.log("Edited Station:", updated);
                onAction(updated.id, "edit", updated);
                setShowEditDialog(false);
              }}
            />
          )}

          {/* Lock Form */}
          {showLockForm && rolePerms.canLock && (
            <div className="space-y-2 p-3 border rounded bg-card dark:bg-card-dark mb-3">
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
          {(rolePerms.canPower || rolePerms.canMaintenance) && (
            <div className="flex gap-2">
              {rolePerms.canPower && (
                <>
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
                </>
              )}
              {rolePerms.canMaintenance && (
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
              )}
            </div>
          )}
        </DialogContent>
      </DialogOverlay>
    </Dialog>
  );
};

export default SessionPopup;