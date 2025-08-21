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
  AlertTriangle,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Station {
  id: string;
  name: string;
  type: 'PC' | 'PS5' | 'PS4';
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  hourlyRate: number;
  ipAddress?: string;
  specifications: string;
  isLocked: boolean;
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
}

const StationCard: React.FC<StationCardProps> = ({ station, onAction, onDelete }) => {
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionData, setSessionData] = useState({
    customerName: '',
    timeMinutes: 60,
    prepaidAmount: 0
  });

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
    <Card className={`card-gaming ${statusConfig.border} ${statusConfig.glow} group relative overflow-hidden`}>
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-card opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="p-6 relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {getTypeIcon(station.type)}
            </div>
            <div>
              <h3 className="font-gaming font-semibold text-lg text-foreground">
                {station.name}
              </h3>
              <p className="text-sm text-muted-foreground font-gaming">
                {station.type} TERMINAL
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={`${statusConfig.badge} font-gaming text-xs px-3 py-1`}>
              {statusConfig.text}
            </Badge>
            {station.isLocked && (
              <div className="p-1 bg-error/20 rounded border border-error/30">
                <Lock className="w-4 h-4 text-error" />
              </div>
            )}
          </div>
        </div>

        {/* Station Info */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-gaming">RATE:</span>
            <span className="text-primary font-gaming font-semibold">
              ${station.hourlyRate}/HR
            </span>
          </div>
          
          {station.ipAddress && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-gaming">IP:</span>
              <span className="text-foreground font-mono text-xs">
                {station.ipAddress}
              </span>
            </div>
          )}
          
          <div className="text-sm">
            <span className="text-muted-foreground font-gaming block mb-1">SPECS:</span>
            <span className="text-foreground text-xs">
              {station.specifications}
            </span>
          </div>
        </div>

        {/* Active Session Info */}
        {station.currentSession && (
          <div className="mb-4 p-4 bg-error/10 border border-error/30 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-4 h-4 text-error" />
              <span className="font-gaming font-semibold text-error text-sm">
                ACTIVE SESSION
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Player:</span>
                <span className="text-foreground font-semibold">
                  {station.currentSession.customerName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time Left:</span>
                <span className="text-accent font-gaming font-bold">
                  {formatTime(station.currentSession.timeRemaining)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Started:</span>
                <span className="text-foreground">
                  {new Date(station.currentSession.startTime).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Primary Actions */}
          <div className="flex gap-2">
            {station.status === 'AVAILABLE' && !showSessionForm && (
              <Button 
                onClick={() => setShowSessionForm(true)}
                className="flex-1 btn-gaming font-gaming"
                disabled={station.isLocked}
              >
                <Play className="w-4 h-4 mr-2" />
                INITIATE
              </Button>
            )}
            
            {station.status === 'OCCUPIED' && (
              <>
                <Button 
                  onClick={() => onAction(station.id, 'end-session')}
                  variant="destructive"
                  className="flex-1 font-gaming"
                >
                  <Square className="w-4 h-4 mr-2" />
                  TERMINATE
                </Button>
                <Button 
                  onClick={() => onAction(station.id, 'add-time', { minutes: 30 })}
                  variant="secondary"
                  className="font-gaming"
                >
                  +30M
                </Button>
              </>
            )}

            {station.status === 'MAINTENANCE' && (
              <Button 
                variant="secondary"
                className="flex-1 font-gaming"
                disabled
              >
                <Settings className="w-4 h-4 mr-2" />
                MAINTENANCE
              </Button>
            )}
          </div>

          {/* Secondary Actions */}
          <div className="flex gap-2">
            <Button 
              onClick={() => onAction(station.id, station.isLocked ? 'unlock' : 'lock')}
              variant="outline"
              size="sm"
              className="flex-1 font-gaming"
            >
              {station.isLocked ? (
                <><Unlock className="w-4 h-4 mr-1" /> UNLOCK</>
              ) : (
                <><Lock className="w-4 h-4 mr-1" /> LOCK</>
              )}
            </Button>
            
            <Button 
              onClick={onDelete}
              variant="outline"
              size="sm"
              className="text-error hover:bg-error/10 hover:border-error font-gaming"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Session Start Form */}
        {showSessionForm && (
          <div className="mt-4 p-4 bg-input/20 border border-primary/30 rounded-lg animate-slide-in-gaming">
            <h4 className="font-gaming font-semibold text-primary mb-3">
              INITIALIZE NEW SESSION
            </h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="font-gaming text-xs">PLAYER NAME</Label>
                <Input
                  placeholder="Enter player name"
                  value={sessionData.customerName}
                  onChange={(e) => setSessionData({...sessionData, customerName: e.target.value})}
                  className="bg-input/50 border-primary/30 font-gaming h-9"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-gaming text-xs">TIME (MIN)</Label>
                  <Input
                    type="number"
                    value={sessionData.timeMinutes}
                    onChange={(e) => setSessionData({...sessionData, timeMinutes: parseInt(e.target.value)})}
                    className="bg-input/50 border-primary/30 font-gaming h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="font-gaming text-xs">PREPAID ($)</Label>
                  <Input
                    type="number"
                    step="0.50"
                    value={sessionData.prepaidAmount}
                    onChange={(e) => setSessionData({...sessionData, prepaidAmount: parseFloat(e.target.value)})}
                    className="bg-input/50 border-primary/30 font-gaming h-9"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={handleStartSession}
                  className="flex-1 btn-gaming font-gaming"
                >
                  <Zap className="w-4 h-4 mr-1" />
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
        )}
      </div>
    </Card>
  );
};

export default StationCard;