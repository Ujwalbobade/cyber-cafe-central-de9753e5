import React, { useState } from 'react';
import { Plus, List, Grid3X3, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import StationCard from '@/components/Station/views/StationCardView';
import StationGridView from '@/components/Station/views/StationGridView';
import StationTableView from '@/components/Station/views/StationTableView';
import SessionPopup from "@/components/Station/StationPopup";
import { Station } from "@/components/Station/Types/Stations";

interface User {
  id?: string;
  username: string;
  email: string;
  role: string;
  loginTime?: string;
  [key: string]: unknown;
}

interface StationsManagementProps {
  stations: Station[];
  currentUser: User | null;
  onStationAction: (stationId: string, action: string, data?: Record<string, unknown>) => void;
  onDeleteStation: (station: Station) => void;
  setShowAddStation: (show: boolean) => void;
}

const StationsManagement: React.FC<StationsManagementProps> = ({
  stations,
  currentUser,
  onStationAction,
  onDeleteStation,
  setShowAddStation
}) => {
  const [stationFilter, setStationFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [stationView, setStationView] = useState<'list' | 'grid' | 'table'>('list');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [showStationPopup, setShowStationPopup] = useState(false);
  const [showSessionPopup, setShowSessionPopup] = useState(false);

  const stats = {
    totalStations: stations.length,
    occupiedStations: stations.filter(s => s.status === 'OCCUPIED').length,
    maintenanceStations: stations.filter(s => s.status === 'MAINTENANCE').length,
  };

  const filteredStations = stations.filter(station => {
    if (stationFilter === 'active') return station.status === 'OCCUPIED';
    if (stationFilter === 'inactive') return station.status !== 'OCCUPIED';
    return true;
  });

  const handleStationClick = (station: Station) => {
    setSelectedStation(station);
    setShowStationPopup(true);
  };

  const handleCloseStationPopup = () => {
    setShowStationPopup(false);
    setSelectedStation(null);
  };

  const updateStationStatus = (stationId: string, status: Station["status"]) => {
    // This would typically be handled by the parent component
    console.log('Update station status:', stationId, status);
  };

  return (
    <div className="space-y-6 animate-slide-in-gaming">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-2xl md:text-3xl font-gaming font-bold text-foreground">
          STATION NETWORK
        </h2>
        <Button
          onClick={() => setShowAddStation(true)}
          className="btn-gaming font-gaming w-full md:w-auto"
        >
          <Plus className="w-5 h-5 mr-2" />
          DEPLOY NEW RIG
        </Button>
      </div>

      {/* Filter and View Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-3">
          <span className="text-sm font-gaming text-muted-foreground">FILTER:</span>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={stationFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStationFilter('all')}
              className={`font-gaming text-xs ${stationFilter === 'all' ? 'btn-gaming' : 'hover:bg-primary/10'}`}
            >
              ALL ({stations.length})
            </Button>
            <Button
              variant={stationFilter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStationFilter('active')}
              className={`font-gaming text-xs ${stationFilter === 'active' ? 'btn-gaming' : 'hover:bg-accent/10'}`}
            >
              ACTIVE ({stats.occupiedStations})
            </Button>
            <Button
              variant={stationFilter === 'inactive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStationFilter('inactive')}
              className={`font-gaming text-xs ${stationFilter === 'inactive' ? 'btn-gaming' : 'hover:bg-secondary/10'}`}
            >
              INACTIVE ({stations.length - stats.occupiedStations})
            </Button>
            {stats.maintenanceStations > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="font-gaming text-xs hover:bg-warning/10 bg-warning/5 border-warning/30 text-warning"
                disabled
              >
                MAINTENANCE ({stats.maintenanceStations})
              </Button>
            )}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-gaming text-muted-foreground">VIEW:</span>
          <div className="flex gap-1">
            <Button
              variant={stationView === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStationView('list')}
              className={`font-gaming text-xs px-3 ${stationView === 'list' ? 'btn-gaming' : 'hover:bg-primary/10'}`}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={stationView === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStationView('grid')}
              className={`font-gaming text-xs px-3 ${stationView === 'grid' ? 'btn-gaming' : 'hover:bg-primary/10'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={stationView === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStationView('table')}
              className={`font-gaming text-xs px-3 ${stationView === 'table' ? 'btn-gaming' : 'hover:bg-primary/10'}`}
            >
              <Table className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Station Display */}
      {stationView === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStations.map((station, index) => (
            <div
              key={station.id}
              className="animate-slide-in-gaming"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <StationCard
                station={station}
                onAction={onStationAction}
                onDelete={() => onDeleteStation(station)}
                updateStationStatus={updateStationStatus}
                currentUserRole={currentUser && currentUser.role ? (currentUser.role as "admin" | "moderator") : "moderator"}
              />
            </div>
          ))}
        </div>
      ) : stationView === 'grid' ? (
        <Card className="card-gaming">
          <StationGridView
            stations={filteredStations}
            onStationClick={handleStationClick}
            onStationAction={onStationAction}
            updateStationStatus={updateStationStatus}
            currentUserRole={currentUser && currentUser.role ? (currentUser.role as "admin" | "moderator") : "moderator"}
          />

          {selectedStation && (
            <SessionPopup
              station={selectedStation}
              isOpen={showSessionPopup}
              onClose={() => setShowSessionPopup(false)}
              onAction={onStationAction}
              onDelete={() => console.log("Delete clicked")}
              userRole={currentUser && currentUser.role ? (currentUser.role as "admin" | "moderator") : "moderator"}
            />
          )}
        </Card>
      ) : (
        <Card className="card-gaming p-6">
          <StationTableView
            stations={filteredStations}
            onStationClick={handleStationClick}
            onStationAction={onStationAction}
            onDelete={onDeleteStation}
            updateStationStatus={updateStationStatus}
            currentUserRole={currentUser && currentUser.role ? (currentUser.role as "admin" | "moderator") : "moderator"}
          />
        </Card>
      )}
    </div>
  );
};

export default StationsManagement;