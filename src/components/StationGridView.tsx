import React from 'react';
import { Monitor, Gamepad2 } from 'lucide-react';

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
  currentSession?: {
    id: string;
    customerName: string;
    startTime: string;
    timeRemaining: number;
  };
}

interface StationGridViewProps {
  stations: Station[];
  onStationClick: (station: Station) => void;
}

const StationGridView: React.FC<StationGridViewProps> = ({ stations, onStationClick }) => {
  const getStationColor = (station: Station) => {
    if (station.isLocked) return 'bg-warning/20 border-warning shadow-glow-warning';
    switch (station.status) {
      case 'AVAILABLE':
        return 'bg-accent/20 border-accent shadow-glow-accent hover:shadow-glow-accent/80';
      case 'OCCUPIED':
        return 'bg-error/20 border-error shadow-glow-error';
      case 'MAINTENANCE':
        return 'bg-secondary/20 border-secondary shadow-glow-secondary';
      default:
        return 'bg-muted/20 border-muted';
    }
  };

  const getStationNumber = (stationName: string) => {
    const match = stationName.match(/(\d+)/);
    return match ? match[1] : stationName.charAt(stationName.length - 1);
  };

  const getTypeIcon = (type: Station['type']) => {
    switch (type) {
      case 'PC':
        return <Monitor className="w-4 h-4 text-primary" />;
      case 'PS5':
      case 'PS4':
        return <Gamepad2 className="w-4 h-4 text-secondary" />;
      default:
        return <Monitor className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-4 p-6">
      {stations.map((station, index) => (
        <div
          key={station.id}
          onClick={() => onStationClick(station)}
          className={`
            relative w-16 h-16 rounded-full border-2 cursor-pointer
            flex flex-col items-center justify-center
            transition-all duration-300 hover:scale-110
            ${getStationColor(station)}
            animate-fade-in
          `}
          style={{ animationDelay: `${index * 0.05}s` }}
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
            {station.status === 'AVAILABLE' ? 'FREE' :
             station.status === 'OCCUPIED' ? 'BUSY' : 'MAINT'}
          </div>

          {/* Lock Indicator */}
          {station.isLocked && (
            <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-warning rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-warning-foreground rounded-full" />
            </div>
          )}

          {/* Active Session Pulse */}
          {station.status === 'OCCUPIED' && (
            <div className="absolute inset-0 rounded-full border-2 border-error animate-pulse opacity-50" />
          )}
        </div>
      ))}
    </div>
  );
};

export default StationGridView;