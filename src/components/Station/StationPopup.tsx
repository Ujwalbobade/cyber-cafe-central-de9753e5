import React, { useState } from 'react';
import {
  Monitor,
  Gamepad2,
  Play,
  Square,
  Lock,
  Unlock,
  Trash2,
  Clock,
  User,
  Zap,
  Settings,
  X,
  CreditCard,
  UserPlus,
  Hand
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Station {
  id: string;
  name: string;
  type: 'PC' | 'PS5' | 'PS4';
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  hourlyRate: number;
  ipAddress?: string;
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

const StationPopup: React.FC<StationPopupProps> = ({
  station,
  isOpen,
  onClose,
  onAction,
  onDelete
}) => {
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showLockForm, setShowLockForm] = useState(false);
  const [sessionData, setSessionData] = useState({
    customerName: '',
    timeMinutes: 60,
    prepaidAmount: 0
  });
  const [lockData, setLockData] = useState({
    assignedUser: '',
    prepaidAmount: 0,
    notes: ''
  });

  if (!station) return null;

  const getStatusConfig = (status: Station['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          badge: 'status-available',
          text: 'ONLINE',
          color: 'text-accent'
        };
      case 'OCCUPIED':
        return {
          badge: 'status-occupied',
          text: 'IN SESSION',
          color: 'text-error'
        };
      case 'MAINTENANCE':
        return {
          badge: 'status-maintenance',
          text: 'MAINTENANCE',
          color: 'text-warning'
        };
      default:
        return {
          badge: 'bg-muted text-muted-foreground',
          text: 'UNKNOWN',
          color: 'text-muted-foreground'
        };
    }
  };

  const statusConfig = getStatusConfig(station.status);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const getTypeIcon = (type: Station['type']) => {
    switch (type) {
      case 'PC':
        return <Monitor className="w-8 h-8 text-primary" />;
      case 'PS5':
      case 'PS4':
        return <Gamepad2 className="w-8 h-8 text-secondary" />;
      default:
        return <Monitor className="w-8 h-8 text-primary" />;
    }
  };

  const handleStartSession = () => {
    if (sessionData.customerName.trim()) {
      onAction(station.id, 'start-session', sessionData);
      setShowSessionForm(false);
      setSessionData({ customerName: '', timeMinutes: 60, prepaidAmount: 0 });
      onClose();
    }
  };

  const handleLockStation = () => {
    if (lockData.assignedUser.trim()) {
      onAction(station.id, 'lock', {
        assignedUser: lockData.assignedUser,
        prepaidAmount: lockData.prepaidAmount,
        notes: lockData.notes
      });
      setShowLockForm(false);
      setLockData({ assignedUser: '', prepaidAmount: 0, notes: '' });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="card-gaming w-full max-w-md mx-auto p-0 max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="relative">
          {/* Header */}
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  {getTypeIcon(station.type)}
                </div>
                <div>
                  <DialogTitle className="font-gaming font-bold text-xl text-foreground">
                    {station.name}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground font-gaming">
                    {station.type} • ₹{station.hourlyRate}/hour
                  </p>
                </div>
              </div>
              <Badge className={`${statusConfig.badge} font-gaming text-xs px-3 py-1`}>
                {statusConfig.text}
              </Badge>
            </div>
          </DialogHeader>

          {/* Station Details */}
          <div className="px-4 sm:px-6 pb-4 space-y-4">
            <div className="p-3 bg-input/20 rounded-lg">
              <span className="text-sm font-gaming text-muted-foreground block mb-1">SPECIFICATIONS:</span>
              <span className="text-sm text-foreground">{station.specifications}</span>
            </div>

            {station.handRaised && (
              <div className="p-3 bg-error/10 border border-error/30 rounded-lg animate-pulse">
                <div className="flex items-center space-x-2 mb-2">
                  <Hand className="w-4 h-4 text-error" />
                  <span className="font-gaming font-semibold text-error text-sm">ASSISTANCE NEEDED</span>
                </div>
                <p className="text-xs text-muted-foreground">User has raised their hand for help</p>
              </div>
            )}

            {station.isLocked && (
              <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Lock className="w-4 h-4 text-warning" />
                  <span className="font-gaming font-semibold text-warning text-sm">STATION LOCKED</span>
                </div>
                {station.lockedFor && (
                  <p className="text-xs text-muted-foreground">Assigned to: {station.lockedFor}</p>
                )}
              </div>
            )}

            {station.currentSession && (
              <div className="p-4 bg-error/10 border border-error/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-error" />
                    <span className="font-gaming font-semibold text-error text-sm">
                      {station.currentSession.customerName}
                    </span>
                  </div>
                  <span className="text-accent font-gaming font-bold text-sm">
                    {formatTime(station.currentSession.timeRemaining)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Started: {new Date(station.currentSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 sm:p-6 pt-0 space-y-3 min-h-[180px] transition-all duration-200 ease-in-out">
            {/* Primary Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* START SESSION */}
              <Button
                onClick={() => setShowSessionForm(true)}
                className={`btn-gaming font-gaming ${station.status === 'AVAILABLE' && !showSessionForm && !showLockForm ? '' : 'hidden'}`}
                disabled={station.isLocked}
              >
                <Play className="w-4 h-4 mr-2" />
                START SESSION
              </Button>

              {/* ASSIGN LOCK */}
              <Button
                onClick={() => setShowLockForm(true)}
                variant="outline"
                className={`font-gaming ${station.status === 'AVAILABLE' && !showSessionForm && !showLockForm ? '' : 'hidden'}`}
                disabled={station.isLocked}
              >
                <Lock className="w-4 h-4 mr-2" />
                ASSIGN LOCK
              </Button>

              {/* END SESSION */}
              <Button
                onClick={() => {
                  onAction(station.id, 'end-session', { sessionId: station.currentSession?.id });
                  onClose();
                }}
                variant="destructive"
                className={`font-gaming ${station.status === 'OCCUPIED' ? '' : 'hidden'}`}
              >
                <Square className="w-4 h-4 mr-2" />
                END SESSION
              </Button>

              {/* +30 MIN */}
              <Button
                onClick={() => {
                  onAction(station.id, 'add-time', { sessionId: station.currentSession?.id, minutes: 30 });
                  onClose();
                }}
                variant="secondary"
                className={`font-gaming ${station.status === 'OCCUPIED' ? '' : 'hidden'}`}
              >
                +30 MIN
              </Button>

              {/* UNDER MAINTENANCE */}
              <Button
                variant="secondary"
                className={`w-full font-gaming col-span-2 ${station.status === 'MAINTENANCE' ? '' : 'hidden'}`}
                disabled
              >
                <Settings className="w-4 h-4 mr-2" />
                UNDER MAINTENANCE
              </Button>
            </div>

            {/* Secondary Actions */}
            <div className="flex gap-2">
              {station.isLocked && (
                <Button
                  onClick={() => {
                    onAction(station.id, 'unlock');
                    onClose();
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1 font-gaming text-xs"
                >
                  <Unlock className="w-3 h-3 mr-1" />
                  UNLOCK
                </Button>
              )}

              {station.status === 'OCCUPIED' && (
                <Button
                  onClick={() => {
                    onAction(station.id, 'raise-hand');
                    onClose();
                  }}
                  variant={station.handRaised ? "default" : "outline"}
                  size="sm"
                  className={`font-gaming text-xs ${station.handRaised ? 'bg-error text-error-foreground' : 'text-error hover:bg-error/10 hover:border-error'}`}
                >
                  <Hand className="w-3 h-3 mr-1" />
                  {station.handRaised ? 'LOWER' : 'RAISE'}
                </Button>
              )}

              <Button
                onClick={() => {
                  onDelete();
                  onClose();
                }}
                variant="outline"
                size="sm"
                className="text-error hover:bg-error/10 hover:border-error font-gaming text-xs px-3"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Session Start Form */}
          {showSessionForm && (
            <div className="px-4 sm:px-6 pb-6">
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg animate-slide-in-gaming">
                <h4 className="font-gaming font-semibold text-primary mb-3">
                  START NEW SESSION
                </h4>
                <div className="space-y-3">
                  <Input
                    placeholder="Player name"
                    value={sessionData.customerName}
                    onChange={(e) => setSessionData({ ...sessionData, customerName: e.target.value })}
                    className="bg-input/50 border-primary/30 font-gaming"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={sessionData.timeMinutes}
                      onChange={(e) => setSessionData({ ...sessionData, timeMinutes: parseInt(e.target.value) })}
                      className="bg-input/50 border border-primary/30 font-gaming h-9 text-sm rounded-md px-3 text-foreground"
                    >
                      {[10, 15, 30, 60, 120, 180].map(minutes => (
                        <option key={minutes} value={minutes}>
                          {minutes < 60 ? `${minutes} min` : `${minutes / 60} hour${minutes > 60 ? 's' : ''}`}
                        </option>
                      ))}
                    </select>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={`Prepaid ₹ (${(150 * sessionData.timeMinutes / 60).toFixed(0)} calc.)`}
                        value={sessionData.prepaidAmount}
                        onChange={(e) => setSessionData({ ...sessionData, prepaidAmount: parseFloat(e.target.value) })}
                        className="bg-input/50 border-primary/30 font-gaming pl-8"
                      />
                      <CreditCard className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleStartSession}
                      className="flex-1 btn-gaming font-gaming"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      LAUNCH
                    </Button>
                    <Button
                      onClick={() => setShowSessionForm(false)}
                      variant="secondary"
                      className="flex-1 font-gaming"
                    >
                      CANCEL
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lock Assignment Form */}
          {showLockForm && (
            <div className="px-4 sm:px-6 pb-6">
              <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg animate-slide-in-gaming">
                <h4 className="font-gaming font-semibold text-warning mb-3">
                  ASSIGN STATION LOCK
                </h4>
                <div className="space-y-3">
                  <div className="relative">
                    <Input
                      placeholder="Assign to user"
                      value={lockData.assignedUser}
                      onChange={(e) => setLockData({ ...lockData, assignedUser: e.target.value })}
                      className="bg-input/50 border-warning/30 font-gaming pl-8"
                    />
                    <UserPlus className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>

                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Prepaid amount ₹"
                      value={lockData.prepaidAmount}
                      onChange={(e) => setLockData({ ...lockData, prepaidAmount: parseFloat(e.target.value) })}
                      className="bg-input/50 border-warning/30 font-gaming pl-8"
                    />
                    <CreditCard className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>

                  <Input
                    placeholder="Notes (optional)"
                    value={lockData.notes}
                    onChange={(e) => setLockData({ ...lockData, notes: e.target.value })}
                    className="bg-input/50 border-warning/30 font-gaming"
                  />

                  <div className="flex gap-2">
                    <Button
                      onClick={handleLockStation}
                      className="flex-1 bg-warning text-warning-foreground hover:bg-warning/90 font-gaming"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      ASSIGN & LOCK
                    </Button>
                    <Button
                      onClick={() => setShowLockForm(false)}
                      variant="secondary"
                      className="flex-1 font-gaming"
                    >
                      CANCEL
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StationPopup;