import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Gamepad2, 
  AlertTriangle,
  Hand,
  User,
  Clock,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    endTime?: number; 
  };
}

interface StationCardProps {
  station: Station;
  onAction: (stationId: string, action: string, data?: any) => Promise<void>;
  onDelete: () => void;
  updateStationStatus: (stationId: string, status: Station["status"]) => void;
}

const StationCard: React.FC<StationCardProps> = ({ station, onAction, onDelete, updateStationStatus }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [localTimeRemaining, setLocalTimeRemaining] = useState(station.currentSession?.timeRemaining || 0);

  const wsService = AdminWebSocketService.getInstance();

  useEffect(() => {
    setLocalTimeRemaining(station.currentSession?.timeRemaining || 0);
  }, [station.currentSession?.timeRemaining]);

  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        await wsService.connect();
        console.log("✅ WebSocket connected for station:", station.id);
      } catch (error) {
        console.error("❌ WebSocket connection failed for station:", station.id, error);
        // Retry connection after 5 seconds
        setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    wsService.onMessage = (data) => {
      if (data.type === "STATION_STATUS" && data.stationId === station.id) {
        setIsOnline(data.online);
        updateStationStatus?.(data.stationId, data.status);
      }

      if (data.type === "STATION_UPDATE" && data.station && data.station.id === station.id) {
        updateStationStatus?.(data.station.id, data.station.status);
      }

      if (data.type === "SESSION_UPDATE" && data.sessionId && data.stationId === station.id) {
        const { status, endTime, sessionId, userId } = data;
        console.log(`🎮 Session update for ${station.name}:`, { status, endTime, sessionId });

        if (status === "STARTED" || status === "TIME_UPDATED") {
          // Calculate time remaining from backend's endTime (epoch millis)
          const timeRemaining = Math.max(0, Math.floor((endTime - Date.now()) / 60000));
          setLocalTimeRemaining(timeRemaining);
          console.log(`⏰ Updated time remaining for ${station.name}: ${timeRemaining} minutes`);
          
          // Update station status if session started
          if (status === "STARTED") {
            updateStationStatus?.(station.id, "OCCUPIED");
          }
        }

        if (status === "COMPLETED") {
          setLocalTimeRemaining(0);
          updateStationStatus?.(station.id, "AVAILABLE");
          console.log(`✅ Session completed for ${station.name}`);
        }
      }
    };

    wsService.onConnectionChange = (state) => {
      console.log("Station card WS connection:", state, "for station:", station.id);
      if (state === "error" || state === "disconnected") {
        // Retry connection after 3 seconds
        setTimeout(connectWebSocket, 3000);
      }
    };
  }, [station.id, wsService, updateStationStatus]);

  useEffect(() => {
    if (station.currentSession && localTimeRemaining > 0) {
      const timer = setInterval(() => {
        setLocalTimeRemaining(prev => {
          const newTime = Math.max(0, prev - 1);
          console.log(`⏰ Timer update for ${station.name}: ${newTime} minutes remaining`);
          return newTime;
        });
      }, 60000); // Update every minute
      
      return () => clearInterval(timer);
    }
  }, [station.currentSession, station.name]);

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

  return (
    <Card 
      className={`card-gaming ${statusConfig.border} ${statusConfig.glow} group relative overflow-hidden h-fit cursor-pointer hover:scale-[1.02] transition-all duration-200`}
      onClick={() => onAction(station.id, "show-popup", station)}
    >
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
                {formatTime(localTimeRemaining)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Started: {new Date(station.currentSession.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
        )}

        {/* Quick Actions Button */}
        <div className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground font-gaming">
            Click for actions
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onAction(station.id, "show-popup", station);
            }}
          >
            <MoreVertical className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default StationCard;