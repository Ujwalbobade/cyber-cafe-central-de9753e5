import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Gamepad2,
  Users,
  DollarSign,
  BarChart3,
  LogOut,
  Settings,
  Zap,
  Shield,
  Cpu,
  Activity,
  Plus,
  Palette,
  Edit3,
  Grid3X3,
  List,
  Cog
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import StationCard from './StationCard';
import StatsCard from './StatsCard';
import AddStationModal from './AddStationModal';
import StationGridView from './StationGridView';
import StationPopup from './StationPopup';
import SystemConfig, { SystemConfiguration } from './SystemConfig';
import {
  getStations,
  createStation,
  deleteStation,
  lockStation,
  unlockStation,
  startSession,
  endSession,
  addTime,
} from "../services/apis/api";

interface AdminDashboardProps {
  onLogout: () => void;
}

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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const data = await getStations();
        setStations(data); // API returns array of stations
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load stations',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  /*const [stations, setStations] = useState<Station[]>([
    {
      id: '1',
      name: 'GAMING-RIG-01',
      type: 'PC',
      status: 'AVAILABLE',
      hourlyRate: 150,
      ipAddress: '192.168.1.101',
      specifications: 'RTX 4080, i7-13700K, 32GB DDR5',
      isLocked: false,
    },

  ]);*/

  const [activeTab, setActiveTab] = useState<'dashboard' | 'stations'>('dashboard');
  const [stationFilter, setStationFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [stationView, setStationView] = useState<'list' | 'grid'>('list');
  const [showAddStation, setShowAddStation] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [showStationPopup, setShowStationPopup] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [showSystemConfig, setShowSystemConfig] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'cyber-blue' | 'neon-purple'>(() => {
    return localStorage.getItem('gaming-cafe-theme') as 'cyber-blue' | 'neon-purple' || 'cyber-blue';
  });
  const [cafeName, setCafeName] = useState(() => {
    return localStorage.getItem('cafe-name') || 'CYBER LOUNGE';
  });
  const [systemConfig, setSystemConfig] = useState<SystemConfiguration>(() => {
    const saved = localStorage.getItem('system-config');
    return saved ? JSON.parse(saved) : {
      hourlyRates: { PC: 150, PS5: 120, PS4: 100 },
      timeOptions: [10, 15, 30, 60, 120, 180],
      nightPass: {
        enabled: false,
        startTime: '22:00',
        endTime: '06:00',
        rate: 80,
        fixedPrice: 500
      },
      happyHours: [],
      customPacks: []
    };
  });
  const { toast } = useToast();

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', currentTheme);

    // Simulate WebSocket connection
    const interval = setInterval(() => {
      setStations(prev => prev.map(station => {
        if (station.currentSession && station.status === 'OCCUPIED') {
          const timeRemaining = station.currentSession.timeRemaining - 1;
          return {
            ...station,
            currentSession: {
              ...station.currentSession,
              timeRemaining: Math.max(0, timeRemaining)
            }
          };
        }
        return station;
      }));
    }, 60000); // Update every minute


    return () => clearInterval(interval);
  }, [currentTheme]);

  // Calculate dashboard statistics
  const stats = {
    totalStations: stations.length,
    availableStations: stations.filter(s => s.status === 'AVAILABLE').length,
    occupiedStations: stations.filter(s => s.status === 'OCCUPIED').length,
    maintenanceStations: stations.filter(s => s.status === 'MAINTENANCE').length,
    totalRevenue: stations
      .filter(s => s.currentSession)
      .reduce((sum, station) => sum + (station.hourlyRate * 0.5), 0)
  };
  const handleAddStation = async (
    stationData: Omit<Station, 'id' | 'isLocked' | 'currentSession'>
  ) => {
    try {
      // Call backend API
      const createdStation = await createStation({
        ...stationData,
        isLocked: false,
        status: 'AVAILABLE'
      });

      // Update state with the station returned by API
      setStations(prev => [...prev, createdStation]);
      setShowAddStation(false);
      toast({
        title: "Station Added",
        description: `${createStation.name} has been successfully added to the network.`,
      });

      console.log('Station created:', createdStation);
    } catch (error) {
      console.error('Error creating station:', error);
      alert('Failed to create station');
    }
  };

  const handleDeleteStation = async (stationId: string) => {
    try {
      // Call backend API
      await deleteStation(stationId);

      // Update UI state after successful deletion
      setStations(prev => prev.filter(s => s.id !== stationId));

      toast({
        title: "Station Removed",
        description: "Station has been permanently removed from the system.",
      });
    } catch (error) {
      console.error("Error deleting station:", error);

      toast({
        title: "Error",
        description: "Failed to remove the station. Please try again.",
        variant: "destructive",
      });
    }
  };
  /*
    const handleStationAction = (stationId: string, action: string, data?: any) => {
      setStations(prev => prev.map(station => {
        if (station.id === stationId) {
          switch (action) {
            case 'lock':
              return { ...station, isLocked: true };
            case 'unlock':
              return { ...station, isLocked: false };
            case 'start-session':
              return {
                ...station,
                status: 'OCCUPIED' as const,
                currentSession: {
                  id: `session-${Date.now()}`,
                  customerName: data.customerName,
                  startTime: new Date().toISOString(),
                  timeRemaining: data.timeMinutes,
                }
              };
            case 'end-session':
              return {
                ...station,
                status: 'AVAILABLE' as const,
                currentSession: undefined,
              };
            case 'add-time':
              return station.currentSession ? {
                ...station,
                currentSession: {
                  ...station.currentSession,
                  timeRemaining: station.currentSession.timeRemaining + data.minutes,
                }
              } : station;
            default:
              return station;
          }
        }
        return station;
      }));
  
      if (action === 'start-session') {
        toast({
          title: "Session Started",
          description: `Gaming session initiated for ${data.customerName}`,
        });
      } else if (action === 'end-session') {
        toast({
          title: "Session Ended",
          description: "Gaming session has been terminated successfully.",
        });
      }
    };*/

  const handleStationAction = async (
    stationId: string,
    action: string,
    data?: any
  ) => {
    try {
      switch (action) {
        case "lock":
          await lockStation(stationId);
          setStations(prev =>
            prev.map(station =>
              station.id === stationId ? { 
                ...station, 
                isLocked: true,
                lockedFor: data?.assignedUser || undefined
              } : station
            )
          );
          toast({ 
            title: "Station Locked", 
            description: data?.assignedUser 
              ? `Station assigned to ${data.assignedUser}`
              : "The station has been locked." 
          });
          break;

        case "unlock":
          await unlockStation(stationId);
          setStations(prev =>
            prev.map(station =>
              station.id === stationId ? { 
                ...station, 
                isLocked: false,
                lockedFor: undefined
              } : station
            )
          );
          toast({ title: "Station Unlocked", description: "The station is now available." });
          break;
        /*case "start-session":
          const session = await startSession(stationId, data);
          const endTime = new Date(session.startTime).getTime() + session.timeRemaining * 60000;

          setStations(prev =>
            prev.map(station =>
              station.id === stationId
                ? {
                  ...station,
                  status: "OCCUPIED",
                  currentSession: {
                    id: session.id,
                    customerName: session.customerName,
                    startTime: session.startTime,
                    endTime,
                    timeRemaining: session.timeRemaining,
                  },
                }
                : station
            )
          );
          break;*/
        case "start-session":
          const session = await startSession(stationId, data); // backend creates session
          setStations(prev =>
            prev.map(station =>
              station.id === stationId
                ? {
                  ...station,
                  status: "OCCUPIED",
                  currentSession: {
                    id: session.id,
                    customerName: session.customerName,
                    startTime: session.startTime,
                    timeRemaining: session.timeRemaining,
                  },
                }
                : station
            )
          );
          toast({ title: "Session Started", description: `Session started for ${data.customerName}.` });
          break;

        case "end-session":
          if (!data?.sessionId) throw new Error("Session ID required to end session");
          await endSession(data.sessionId);

          setStations(prev =>
            prev.map(station =>
              station.currentSession?.id === data.sessionId
                ? { ...station, status: "AVAILABLE", currentSession: undefined }
                : station
            )
          );

          toast({
            title: "Session Ended",
            description: `Session ${data.sessionId} has been ended.`,
          });
          break;
        case "add-time":
          if (!data?.sessionId || !data?.minutes) throw new Error("Session ID and minutes required");
          const updatedSession = await addTime(data.sessionId, data.minutes);
          setStations(prev =>
            prev.map(station =>
              station.id === stationId && station.currentSession
                ? {
                  ...station,
                  currentSession: {
                    ...station.currentSession,
                    timeRemaining: updatedSession.timeRemaining,
                  },
                }
                : station
            )
          );
          toast({ title: "Time Added", description: `${data.minutes} minutes added.` });
          break;

        default:
          console.warn(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error(`Error handling action ${action}:`, error);
      toast({
        title: "Error",
        description: `Failed to perform action: ${action}`,
        variant: "destructive",
      });
    }
  };

  const handleStationClick = (station: Station) => {
    setSelectedStation(station);
    setShowStationPopup(true);
  };

  const handleCloseStationPopup = () => {
    setShowStationPopup(false);
    setSelectedStation(null);
  };

  const handleSystemConfigSave = (config: SystemConfiguration) => {
    setSystemConfig(config);
    localStorage.setItem('system-config', JSON.stringify(config));
    toast({
      title: "Configuration Saved",
      description: "System configuration has been updated successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-primary/20 bg-card/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow-primary">
                  <Shield className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-gaming font-bold bg-gradient-gaming bg-clip-text text-transparent">
                    {cafeName}
                  </h1>
                </div>
              </div>

              <Badge
                className={`font-gaming text-xs ${connectionStatus === 'connected'
                  ? 'bg-success/20 text-success border-success/30 shadow-glow-accent'
                  : connectionStatus === 'disconnected'
                    ? 'bg-error/20 text-error border-error/30'
                    : 'bg-warning/20 text-warning border-warning/30'
                  }`}
              >
                <Activity className="w-3 h-3 mr-1" />
                {connectionStatus === 'connected' ? 'NEURAL LINK ACTIVE' :
                  connectionStatus === 'disconnected' ? 'LINK SEVERED' : 'SIGNAL ERROR'}
              </Badge>
            </div>

            <div className="flex items-center space-x-1 md:space-x-3">
              <Button
                variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('dashboard')}
                className={`${activeTab === 'dashboard' ? 'btn-gaming' : 'hover:bg-primary/10'} px-2 md:px-4`}
                size="sm"
              >
                <BarChart3 className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
                <span className="hidden md:inline">Control Center</span>
              </Button>
              <Button
                variant={activeTab === 'stations' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('stations')}
                className={`${activeTab === 'stations' ? 'btn-gaming' : 'hover:bg-primary/10'} px-2 md:px-4`}
                size="sm"
              >
                <Monitor className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
                <span className="hidden md:inline">Stations</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowSettings(true)}
                className="hover:bg-primary/10 px-2 md:px-4"
                size="sm"
              >
                <Palette className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
                <span className="hidden md:inline">Theme</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowSystemConfig(true)}
                className="hover:bg-primary/10 px-2 md:px-4"
                size="sm"
              >
                <Cog className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
                <span className="hidden md:inline">Config</span>
              </Button>
              <Button
                variant="ghost"
                onClick={onLogout}
                className="hover:bg-error/10 hover:text-error px-2 md:px-4"
                size="sm"
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-slide-in-gaming">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl md:text-3xl font-gaming font-bold text-foreground">
                CONTROL CENTER OVERVIEW
              </h2>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground font-gaming">
                <Cpu className="w-4 h-4" />
                <span>SYSTEM STATUS: OPTIMAL</span>
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="TOTAL RIGS"
                value={stats.totalStations}
                icon={<Monitor className="w-8 h-8" />}
                gradient="bg-gradient-primary"
                change="+2 this week"
              />
              <StatsCard
                title="AVAILABLE"
                value={stats.availableStations}
                icon={<Zap className="w-8 h-8" />}
                gradient="bg-gradient-to-r from-accent to-accent/80"
                change="Ready for action"
              />
              <StatsCard
                title="ACTIVE SESSIONS"
                value={stats.occupiedStations}
                icon={<Users className="w-8 h-8" />}
                gradient="bg-gradient-secondary"
                change={`${((stats.occupiedStations / stats.totalStations) * 100).toFixed(0)}% utilization`}
              />
              <StatsCard
                title="CREDITS EARNED"
                value={`₹${stats.totalRevenue.toFixed(0)}`}
                icon={<DollarSign className="w-8 h-8" />}
                gradient="bg-gradient-gaming"
                change="+15% vs yesterday"
              />
            </div>

            {/* Quick Actions */}
            <Card className="card-gaming p-6">
              <h3 className="text-xl font-gaming font-semibold text-foreground mb-6">
                QUICK OPERATIONS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Button
                  onClick={() => setShowAddStation(true)}
                  className="h-20 bg-gradient-card border-dashed border-2 border-primary/30 hover:border-primary hover:shadow-glow-primary transition-all duration-300"
                  variant="ghost"
                >
                  <div className="text-center">
                    <Plus className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="font-gaming font-semibold">ADD NEW RIG</p>
                  </div>
                </Button>

                <Button
                  className="h-20 bg-gradient-card border-dashed border-2 border-accent/30 hover:border-accent hover:shadow-glow-accent transition-all duration-300"
                  variant="ghost"
                >
                  <div className="text-center">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 text-accent" />
                    <p className="font-gaming font-semibold">ANALYTICS HUB</p>
                  </div>
                </Button>

                <Button
                  className="h-20 bg-gradient-card border-dashed border-2 border-secondary/30 hover:border-secondary hover:shadow-glow-secondary transition-all duration-300"
                  variant="ghost"
                >
                  <div className="text-center">
                    <Settings className="w-8 h-8 mx-auto mb-2 text-secondary" />
                    <p className="font-gaming font-semibold">SYSTEM CONFIG</p>
                  </div>
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Stations Tab */}
        {activeTab === 'stations' && (
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
                    ACTIVE ({stations.filter(s => s.status === 'OCCUPIED').length})
                  </Button>
                  <Button
                    variant={stationFilter === 'inactive' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStationFilter('inactive')}
                    className={`font-gaming text-xs ${stationFilter === 'inactive' ? 'btn-gaming' : 'hover:bg-secondary/10'}`}
                  >
                    INACTIVE ({stations.filter(s => s.status !== 'OCCUPIED').length})
                  </Button>
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
                </div>
              </div>
            </div>

            {/* Station Display */}
            {stationView === 'list' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {stations
                  .filter(station => {
                    if (stationFilter === 'active') return station.status === 'OCCUPIED';
                    if (stationFilter === 'inactive') return station.status !== 'OCCUPIED';
                    return true;
                  })
                  .map((station, index) => (
                    <div
                      key={station.id}
                      className="animate-slide-in-gaming"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <StationCard
                        station={station}
                        onAction={handleStationAction}
                        onDelete={() => handleDeleteStation(station.id)}
                        systemConfig={systemConfig}
                      />
                    </div>
                  ))}
              </div>
            ) : (
              <Card className="card-gaming">
                <StationGridView 
                  stations={stations.filter(station => {
                    if (stationFilter === 'active') return station.status === 'OCCUPIED';
                    if (stationFilter === 'inactive') return station.status !== 'OCCUPIED';
                    return true;
                  })}
                  onStationClick={handleStationClick}
                />
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {showAddStation && (
        <AddStationModal
          onClose={() => setShowAddStation(false)}
          onAdd={handleAddStation}
        />
      )}

      {/* Station Popup */}
      <StationPopup
        station={selectedStation}
        isOpen={showStationPopup}
        onClose={handleCloseStationPopup}
        onAction={handleStationAction}
        onDelete={() => selectedStation && handleDeleteStation(selectedStation.id)}
        systemConfig={systemConfig}
      />

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="card-gaming max-w-md w-full p-6">
            <h2 className="text-xl font-gaming font-bold text-foreground mb-4">
              CAFE SETTINGS
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-gaming text-muted-foreground mb-2">
                  CAFE NAME
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cafeName}
                    onChange={(e) => setCafeName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-input/50 border border-primary/30 rounded-lg text-foreground font-gaming text-sm"
                    placeholder="Enter cafe name"
                  />
                  <Button
                    onClick={() => setCafeName(cafeName)}
                    variant="outline"
                    size="sm"
                    className="font-gaming"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-gaming text-muted-foreground mb-2">
                  COLOR THEME
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={currentTheme === 'cyber-blue' ? 'default' : 'outline'}
                    onClick={() => setCurrentTheme('cyber-blue')}
                    className={`font-gaming ${currentTheme === 'cyber-blue' ? 'btn-gaming' : ''}`}
                  >
                    Cyber Blue
                  </Button>
                  <Button
                    variant={currentTheme === 'neon-purple' ? 'default' : 'outline'}
                    onClick={() => setCurrentTheme('neon-purple')}
                    className={`font-gaming ${currentTheme === 'neon-purple' ? 'btn-gaming' : ''}`}
                  >
                    Neon Purple
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => {
                  localStorage.setItem('cafe-name', cafeName);
                  localStorage.setItem('gaming-cafe-theme', currentTheme);
                  setShowSettings(false);
                }}
                className="flex-1 btn-gaming font-gaming"
              >
                SAVE SETTINGS
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* System Configuration Modal */}
      <SystemConfig
        isOpen={showSystemConfig}
        onClose={() => setShowSystemConfig(false)}
        onSave={handleSystemConfigSave}
        currentConfig={systemConfig}
      />
    </div>
  );
};

export default AdminDashboard;