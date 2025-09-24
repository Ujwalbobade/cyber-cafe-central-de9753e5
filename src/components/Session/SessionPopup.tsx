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
  Hand,
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
import { Station } from "@/components/Station/Types/Stations";
import { SystemConfiguration } from "@/components/SystemConfiguration/SystemConfig";
import { useSystemConfig } from "@/utils/SystemConfigContext";
// or wherever it's defined


interface SessionPopupProps {
  station: Station | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (stationId: string, action: string, data?: any) => void;
  onDelete: (stationId: string) => void;
  userRole: "admin" | "moderator" | "viewer";
}

type Pack = {
  label: string;
  minutes: number;
  price: number;
  category: "quick" | "custom";
};

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

const PackGrid: React.FC<{
  title: string;
  packs: Pack[];
  onSelect: (pack: Pack) => void;
}> = ({ title, packs, onSelect }) => {
  if (packs.length === 0) return null;
  return (
    <div className="mb-4">
      <h4 className="text-sm font-semibold mb-2">{title}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {packs.map((pack) => (
          <Button
            key={pack.label}
            onClick={() => onSelect(pack)}
            variant="outline"
            size="sm"
            className="flex flex-col h-14"
          >
            <div className="font-bold">{pack.label}</div>
            <div className="text-xs">₹{pack.price}</div>
          </Button>
        ))}
      </div>
    </div>
  );
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
  /*const [packs, setPacks] = useState<Pack[]>([
    { label: "15m", minutes: 15, price: 37.5, category: "quick" },
    { label: "30m", minutes: 30, price: 75, category: "quick" },
    { label: "1h", minutes: 60, price: 150, category: "quick" },
    { label: "2h", minutes: 120, price: 300, category: "quick" },
    { label: "4h", minutes: 240, price: 600, category: "quick" },
    { label: "Day Pass", minutes: 720, price: 1300, category: "custom" },
    { label: "Weekend Pass", minutes: 1440, price: 2500, category: "custom" },
  ]);*/
  const [packs, setPacks] = useState<Pack[]>([]);

  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showLockForm, setShowLockForm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { config } = useSystemConfig();
  const [activeHappyHour, setActiveHappyHour] = useState<any | null>(null);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);


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
    if (!station || !config) {
      console.log("⏭️ Skipping useEffect — station or config missing:", { station, config });
      return;
    }

    console.log("⚡ Running pack builder for station:", station);
    console.log("📦 System Config:", config);

    const times = config.timeOptions || [15, 30, 60, 120];
    setAllowedTimes(times);
    console.log("⏱️ Allowed Times:", times);

    const now = new Date();
    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    console.log("🕒 Current Day:", currentDay, "| Current Time:", currentTime);

    const foundHH = config.happyHours.find((hh) => {
      console.log("🔎 Checking Happy Hour:", {
        days: hh.days,
        enabled: hh.enabled,
        start: hh.startTime,
        end: hh.endTime,
      });

      if (!hh.enabled) {
        console.log("❌ Skipping: Not enabled");
        return false;
      }

      if (!hh.days.map(d => d.toLowerCase()).includes(currentDay)) {
        console.log("❌ Skipping: Day mismatch", currentDay, "not in", hh.days);
        return false;
      }

      const [sh, sm] = hh.startTime.split(":").map(Number);
      const [eh, em] = hh.endTime.split(":").map(Number);
      const start = sh * 60 + sm;
      const end = eh * 60 + em;

      console.log("⌛ Time Range:", start, "-", end, "| Current:", currentTime);

      const inTime = currentTime >= start && currentTime <= end;
      if (!inTime) console.log("❌ Skipping: Outside time window");

      return inTime;
    });

    console.log("🎉 Found Happy Hour:", foundHH);

    setActiveHappyHour(foundHH || null);

    const hourlyRate = foundHH ? foundHH.rate : station.hourlyRate || 100;
    console.log("💰 Effective Hourly Rate:", hourlyRate);

    const quickPacks: Pack[] = times.map((time) => {
      const price = (hourlyRate * time) / 60;
      console.log(`⚡ Quick Pack -> ${time} mins : ₹${price}`);
      return {
        label: time < 60 ? `${time}m` : `${time / 60}h`,
        minutes: time,
        price,
        category: "quick",
      };
    });


    const customPacks: Pack[] = (config.packs || [])
      .filter((p) => p.enabled)  // ✅ only use enabled packs
      .filter((p) => !p.validStationTypes.length || p.validStationTypes.includes(station.type))
      .map((pack) => {
        console.log(`🎨 Custom Pack -> ${pack.name} (${pack.duration}m): ₹${pack.price}, enabled=${pack.enabled}`);
        return {
          label: pack.name,
          minutes: pack.duration,
          price: pack.price,
          category: "custom",
        };
      });
    const allPacks = [...quickPacks, ...customPacks];
    console.log("✅ Final Packs:", allPacks);

    setPacks(allPacks);
  }, [station, config]);

  if (!station) return null;
  const rolePerms = permissions[userRole];

  // ---------- Handlers ----------
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
    (pack: Pack) => {
      if (
        station.status === "AVAILABLE" &&
        !station.isLocked &&
        rolePerms.canStartSession
      ) {
        // Set the pack as selected
        setSelectedPack(pack);

        // Fill session data with pack values
        setSessionData({
          customerName: `Quick ${pack.label}`, // or you can leave empty
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

  const handleClearHandRaise = () => {
    if (!station) return;
    onAction(station.id, "clearHandRaise");
    onClose();
  };

  // ---------- UI ----------
  const statusMap: Record<string, { text: string; badge: string }> = {
    AVAILABLE: { text: "Available", badge: "bg-green-100 text-green-800" },
    OCCUPIED: { text: "In Session", badge: "bg-red-100 text-red-800" },
    MAINTENANCE: { text: "Maintenance", badge: "bg-yellow-100 text-yellow-800" },
    OFFLINE: { text: "Offline", badge: "bg-gray-100 text-gray-800" },
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

          {/* Hand Raise Alert (moved to top for visibility) */}
          {station.handRaised && (
            <div role="status" className="p-3 bg-yellow-50 border border-yellow-200 rounded mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Hand className="w-5 h-5 text-yellow-700" />
                <div>
                  <div className="text-sm font-medium text-yellow-800">Hand Raised</div>
                  <div className="text-xs text-yellow-700/90">Player requested assistance</div>
                </div>
              </div>

              {(userRole === "admin" || userRole === "moderator") ? (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleClearHandRaise}
                    aria-label="Resolve hand raise"
                  >
                    Resolve
                  </Button>
                </div>
              ) : null}
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
                Started: {new Date(station.currentSession.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          )}
          {activeHappyHour && (
            <div className="p-3 mb-3 bg-purple-50 border border-purple-200 rounded flex items-center justify-between">
              <div>
                <p className="font-semibold text-purple-700">🎉 Happy Hour Active!</p>
                <p className="text-xs text-purple-600">
                  {activeHappyHour.startTime} - {activeHappyHour.endTime} | ₹{activeHappyHour.rate}/hr
                </p>
              </div>
              <Badge className="bg-purple-600 text-white">Happy Hour</Badge>
            </div>
          )}

          {/* Packs Section */}
          {station.status === "AVAILABLE" && !station.isLocked && !showSessionForm && rolePerms.canStartSession && (
            <>
              <PackGrid
                title="Quick Packs"
                packs={packs.filter((p) => p.category === "quick")}
                onSelect={handleQuickSession}
              />
              <PackGrid
                title="Custom Packs"
                packs={packs.filter((p) => p.category === "custom")}
                onSelect={handleQuickSession}
              />
            </>
          )}

          {/* Add Time */}
          {station.status === "OCCUPIED" && station.currentSession && rolePerms.canStartSession && (
            <div className="mb-3">
              <h4 className="text-sm font-semibold mb-2">Add Time</h4>
              <div className="grid grid-cols-4 gap-1">
                {allowedTimes.map((m) => (
                  <Button
                    key={m}
                    onClick={() => handleAddQuickTime(m)}
                    size="sm"
                    variant="outline"
                  >
                    +{m < 60 ? `${m}m` : `${m / 60}h`} (₹{(station.hourlyRate * m) / 60})
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Session Form */}
          {showSessionForm && rolePerms.canStartSession && (
            <div className="space-y-2 p-3 border rounded bg-card dark:bg-card-dark mb-3">
              <h4 className="font-semibold">Start New Session</h4>

              {/* If a pack is selected, show pack details only */}
              {selectedPack ? (
                <div className="p-3 mb-2 bg-blue-100 border border-blue-400 rounded flex flex-col gap-1">
                  <div className="font-semibold text-lg text-blue-800">{selectedPack.label}</div>
                  <div className="text-sm text-blue-700">Rates: ₹{selectedPack.price}</div>
                  <div className="text-sm text-blue-700">
                    Duration: {selectedPack.minutes < 60 ? `${selectedPack.minutes} min` : `${selectedPack.minutes / 60} hr`}
                  </div>
                </div>
              ) : (
                // Manual input form
                <div className="space-y-2">
                  <Input
                    placeholder="Player name"
                    value={sessionData.customerName}
                    onChange={(e) => setSessionData({ ...sessionData, customerName: e.target.value })}
                  />

                  <select
                    value={sessionData.timeMinutes}
                    onChange={(e) => setSessionData({ ...sessionData, timeMinutes: parseInt(e.target.value) })}
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
                    onChange={(e) => setSessionData({ ...sessionData, prepaidAmount: parseFloat(e.target.value) })}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleStartSession}>
                  <Zap className="w-4 h-4 mr-2" /> Launch
                </Button>
                <Button variant="secondary" onClick={() => {
                  setShowSessionForm(false);
                  setSelectedPack(null);
                  setSessionData({ customerName: "", timeMinutes: 60, prepaidAmount: 0 });
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {/* Lock Form */}
          {showLockForm && rolePerms.canLock && (
            <div className="space-y-2 p-3 border rounded bg-card dark:bg-card-dark mb-3">
              <h4 className="font-semibold">Assign Lock</h4>
              <Input
                placeholder="Assign to user"
                value={lockData.assignedUser}
                onChange={(e) => setLockData({ ...lockData, assignedUser: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Prepaid Amount"
                value={lockData.prepaidAmount}
                onChange={(e) => setLockData({ ...lockData, prepaidAmount: parseFloat(e.target.value) })}
              />
              <Input
                placeholder="Notes"
                value={lockData.notes}
                onChange={(e) => setLockData({ ...lockData, notes: e.target.value })}
              />
              <div className="flex gap-2">
                <Button onClick={handleLockStation}>
                  <Lock className="w-4 h-4 mr-2" /> Lock
                </Button>
                <Button variant="secondary" onClick={() => setShowLockForm(false)}>
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
                onAction(updated.id, "edit", updated);
                setShowEditDialog(false);
              }}
            />
          )}

          {/* ---------- Actions Section ---------- */}
          <div className="mt-4 border-t pt-3">
            <h4 className="text-sm font-semibold mb-2">Actions</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">

              {/* Start Session / Lock / Edit (when available) */}
              {station.status === "AVAILABLE" && (
                <>
                  {rolePerms.canLock && (
                    <Button variant="outline" onClick={() => setShowLockForm(true)}>
                      <Lock className="w-4 h-4 mr-2" /> Assign Lock
                    </Button>
                  )}
                  {rolePerms.canEdit && (
                    <Button variant="outline" onClick={() => setShowEditDialog(true)}>
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </Button>
                  )}
                </>
              )}

              {/* End Session / Add Time (when occupied) */}
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

              {/* Power & Maintenance */}
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
                      status: station.status === "MAINTENANCE" ? "AVAILABLE" : "MAINTENANCE",
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

              {/* Delete (admin only) */}
              {rolePerms.canDelete && (
                <Button variant="destructive" size="sm" onClick={() => onDelete(station.id)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </DialogOverlay>
    </Dialog>
  );
};

export default SessionPopup;
