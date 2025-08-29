import React, { useState, useEffect } from 'react';
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
  AlertTriangle,
  Settings,
  Hand
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminWebSocketService from '../../services/Websockets';

export interface Station {
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

interface StationCardProps {
  station: Station;
  onAction: (stationId: string, action: string, data?: any) => void;
  onDelete: () => void;
  updateStationStatus?: (stationId: string, status: Station["status"]) => void;
}

const StationCard: React.FC<StationCardProps> = ({ station, onAction, onDelete, updateStationStatus }) => {
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionData, setSessionData] = useState({
    customerName: '',
    timeMinutes: 60,
    prepaidAmount: 0
  });
  const [showLockForm, setShowLockForm] = useState(false);
  const [lockUser, setLockUser] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  const wsService = AdminWebSocketService.getInstance();

  useEffect(() => {
    wsService.connect();
    
    wsService.onMessage = (data) => {
      if (data.type === "STATION_STATUS" && data.stationId === station.id) {
        setIsOnline(data.online);
        if (updateStationStatus) {
          updateStationStatus(data.stationId, data.status);
        }
      }
      if (data.type === "STATION_UPDATE" && data.station && data.station.id === station.id) {
        if (updateStationStatus) {
          updateStationStatus(data.station.id, data.station.status);
        }
      }
    };

    wsService.onConnectionChange = (state) => {
      console.log("Station card WS connection:", state);
    };

    return () => {
      // Don't disconnect here as other components might be using it
    };
  }, [station.id, wsService, updateStationStatus]);

  const getStatusConfig = (status: Station['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          badge: 'status-available',
          text: 'ONLINE',
          glow: 'shadow-glow-accent',
          border: 'border-accent/30'
        };
      case 'OCCUPIED':
        return {
          badge: 'status-occupied',
          text: 'IN SESSION',
          glow: 'shadow-glow-secondary',
          border: 'border-error/30'
        };
      case 'MAINTENANCE':
        return {
          badge: 'status-maintenance',
          text: 'MAINTENANCE',
          glow: 'shadow-glow-secondary',
          border: 'border-warning/30'
        };
      default:
        return {
          badge: 'bg-muted text-muted-foreground',
          text: 'UNKNOWN',
          glow: '',
          border: 'border-muted/30'
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
        return <Monitor className="w-6 h-6 text-primary" />;
      case 'PS5':
      case 'PS4':
        return <Gamepad2 className="w-6 h-6 text-secondary" />;
      default:
        return <Monitor className="w-6 h-6 text-primary" />;
    }
  };

  const handleStartSession = () => {
    if (sessionData.customerName.trim()) {
      onAction(station.id, 'start-session', sessionData);
      setShowSessionForm(false);
      setSessionData({ customerName: '', timeMinutes: 60, prepaidAmount: 0 });
    }
  };

  return (
    <Card className={`card-gaming ${statusConfig.border} ${statusConfig.glow} group relative overflow-hidden h-fit`}>
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-card opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="p-4 relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              {getTypeIcon(station.type)}
            </div>
            <div>
              <h3 className="font-gaming font-semibold text-sm text-foreground">
                {station.name}
              </h3>
              <p className="text-xs text-muted-foreground font-gaming">
                {station.type}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Badge className={`${statusConfig.badge} font-gaming text-xs px-2 py-0.5`}>
              {statusConfig.text}
            </Badge>
            {station.handRaised && (
              <div className="p-0.5 bg-error/20 rounded border border-error/30 animate-pulse">
                <Hand className="w-3 h-3 text-error" />
              </div>
            )}
            {!isOnline && (
              <div className="p-0.5 bg-muted/20 rounded border border-muted/30">
                <AlertTriangle className="w-3 h-3 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Station Info - Compact */}
        <div className="space-y-2 mb-3">
          {station.ipAddress && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-gaming">IP:</span>
              <span className="text-foreground font-mono">
                {station.ipAddress}
              </span>
            </div>
          )}
          
          <div className="text-xs">
            <span className="text-muted-foreground font-gaming">SPECS: </span>
            <span className="text-foreground">
              {station.specifications.length > 35 
                ? `${station.specifications.substring(0, 35)}...` 
                : station.specifications
              }
            </span>
          </div>
        </div>

        {/* Active Session Info - Compact */}
        {station.currentSession && (
          <div className="mb-3 p-3 bg-error/10 border border-error/30 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3 text-error" />
                <span className="font-gaming font-semibold text-error text-xs">
                  {station.currentSession.customerName}
                </span>
              </div>
              <span className="text-accent font-gaming font-bold text-xs">
                {formatTime(station.currentSession.timeRemaining)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Started: {new Date(station.currentSession.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
        )}

        {/* Action Buttons - Compact Layout */}
        <div className="space-y-2">
          {/* Primary Action */}
          {station.status === 'AVAILABLE' && !showSessionForm && (
            <Button 
              onClick={() => setShowSessionForm(true)}
              className="w-full btn-gaming font-gaming text-sm h-8"
              disabled={station.isLocked}
            >
              <Play className="w-3 h-3 mr-1" />
              INITIATE
            </Button>
          )}
          
          {station.status === 'OCCUPIED' && (
            <div className="flex gap-1">
              <Button 
                onClick={() => onAction(station.id, 'end-session', { sessionId: station.currentSession?.id })}
                variant="destructive"
                className="flex-1 font-gaming text-xs h-8"
              >
                <Square className="w-3 h-3 mr-1" />
                END
              </Button>
              <Button 
                onClick={() => onAction(station.id, 'add-time', { 
                  sessionId: station.currentSession?.id, 
                  minutes: 30 
                })}
                variant="secondary"
                className="font-gaming text-xs h-8 px-2"
              >
                +30M
              </Button>
            </div>
          )}

          {station.status === 'MAINTENANCE' && (
            <Button 
              variant="secondary"
              className="w-full font-gaming text-xs h-8"
              disabled
            >
              <Settings className="w-3 h-3 mr-1" />
              MAINTENANCE
            </Button>
          )}

          {/* Secondary Actions - Horizontal */}
          <div className="flex gap-1">
            <Button 
              onClick={() => {
                if (station.isLocked) {
                  onAction(station.id, 'unlock');
                } else {
                  setShowLockForm(true);
                }
              }}
              variant="outline"
              size="sm"
              className="font-gaming text-xs h-7 px-2"
            >
              {station.isLocked ? (
                <Unlock className="w-3 h-3" />
              ) : (
                <Lock className="w-3 h-3" />
              )}
            </Button>
            
            <Button 
              onClick={() => onAction(station.id, 'raise-hand')}
              variant="outline"
              size="sm"
              className={`font-gaming text-xs h-7 px-2 ${
                station.handRaised 
                  ? 'bg-error/20 text-error border-error/30' 
                  : 'hover:bg-warning/10 hover:border-warning'
              }`}
            >
              <Hand className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Session Start Form - Compact */}
        {showSessionForm && (
          <div className="mt-3 p-3 bg-input/20 border border-primary/30 rounded-lg animate-slide-in-gaming">
            <h4 className="font-gaming font-semibold text-primary mb-2 text-sm">
              NEW SESSION
            </h4>
            <div className="space-y-2">
              <Input
                placeholder="Player name"
                value={sessionData.customerName}
                onChange={(e) => setSessionData({...sessionData, customerName: e.target.value})}
                className="bg-input/50 border-primary/30 font-gaming h-8 text-sm"
              />
              
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={sessionData.timeMinutes}
                  onChange={(e) => setSessionData({...sessionData, timeMinutes: parseInt(e.target.value)})}
                  className="bg-input/50 border border-primary/30 font-gaming h-8 text-sm rounded-md px-2 text-foreground"
                >
                  {[10, 15, 30, 60, 120, 180].map(minutes => (
                    <option key={minutes} value={minutes}>
                      {minutes < 60 ? `${minutes} min` : `${minutes/60} hour${minutes > 60 ? 's' : ''}`}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  step="0.50"
                  placeholder={`Prepaid ₹ (${(150 * sessionData.timeMinutes / 60).toFixed(0)} calc.)`}
                  value={sessionData.prepaidAmount}
                  onChange={(e) => setSessionData({...sessionData, prepaidAmount: parseFloat(e.target.value)})}
                  className="bg-input/50 border-primary/30 font-gaming h-8 text-sm"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleStartSession}
                  className="flex-1 btn-gaming font-gaming text-sm h-8"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  LAUNCH
                </Button>
                <Button 
                  onClick={() => setShowSessionForm(false)}
                  variant="secondary"
                  className="flex-1 font-gaming text-sm h-8"
                >
                  CANCEL
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Lock Assignment Form */}
        {showLockForm && (
          <div className="mt-3 p-3 bg-warning/10 border border-warning/30 rounded-lg animate-slide-in-gaming">
            <h4 className="font-gaming font-semibold text-warning mb-2 text-sm">
              ASSIGN STATION LOCK
            </h4>
            <div className="space-y-2">
              <Input
                placeholder="Assign to user (optional)"
                value={lockUser}
                onChange={(e) => setLockUser(e.target.value)}
                className="bg-input/50 border-warning/30 font-gaming h-8 text-sm"
              />
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    onAction(station.id, 'lock', { assignedUser: lockUser.trim() || undefined });
                    setShowLockForm(false);
                    setLockUser('');
                  }}
                  className="flex-1 bg-warning hover:bg-warning/80 text-warning-foreground font-gaming text-sm h-8"
                >
                  <Lock className="w-3 h-3 mr-1" />
                  LOCK
                </Button>
                <Button 
                  onClick={() => {
                    setShowLockForm(false);
                    setLockUser('');
                  }}
                  variant="secondary"
                  className="flex-1 font-gaming text-sm h-8"
                >
                  CANCEL
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Button - moved outside forms */}
        {!showSessionForm && !showLockForm && (
          <div className="mt-2">
            <Button 
              onClick={onDelete}
              variant="outline"
              size="sm"
              className="text-error hover:bg-error/10 hover:border-error font-gaming text-xs h-7 px-2"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default StationCard;