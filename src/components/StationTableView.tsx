import React from 'react';
import { Monitor, Gamepad2, Lock, Unlock, Play, Pause, Clock, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

interface StationTableViewProps {
  stations: Station[];
  onStationClick: (station: Station) => void;
  onStationAction: (stationId: string, action: string, data?: any) => void;
  onDelete: (stationId: string) => void;
}

const StationTableView: React.FC<StationTableViewProps> = ({ 
  stations, 
  onStationClick, 
  onStationAction, 
  onDelete 
}) => {
  const getStatusBadge = (station: Station) => {
    if (station.isLocked) {
      return (
        <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">
          <Lock className="w-3 h-3 mr-1" />
          LOCKED
        </Badge>
      );
    }

    switch (station.status) {
      case 'AVAILABLE':
        return (
          <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30">
            AVAILABLE
          </Badge>
        );
      case 'OCCUPIED':
        return (
          <Badge variant="outline" className="bg-error/20 text-error border-error/30">
            <Play className="w-3 h-3 mr-1" />
            OCCUPIED
          </Badge>
        );
      case 'MAINTENANCE':
        return (
          <Badge variant="outline" className="bg-secondary/20 text-secondary border-secondary/30">
            MAINTENANCE
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-muted/20 text-muted-foreground border-muted/30">
            UNKNOWN
          </Badge>
        );
    }
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

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

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
            <TableHead className="font-gaming text-foreground">IP Address</TableHead>
            <TableHead className="font-gaming text-foreground text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stations.map((station) => (
            <TableRow 
              key={station.id} 
              className="hover:bg-muted/30 cursor-pointer transition-colors"
              onClick={() => onStationClick(station)}
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
              <TableCell>
                {getStatusBadge(station)}
              </TableCell>
              <TableCell>
                <span className="font-gaming text-sm">₹{station.hourlyRate}/hr</span>
              </TableCell>
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
              <TableCell>
                <span className="text-sm font-mono text-muted-foreground">
                  {station.ipAddress || '-'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-1">
                  {station.isLocked ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStationAction(station.id, 'unlock');
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
                        e.stopPropagation();
                        onStationAction(station.id, 'lock');
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
                      e.stopPropagation();
                      onStationClick(station);
                    }}
                    className="h-8 w-8 p-0 hover:bg-secondary/10 hover:text-secondary"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(station.id);
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
    </div>
  );
};

export default StationTableView;