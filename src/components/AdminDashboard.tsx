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
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import StationCard from './StationCard';
import StatsCard from './StatsCard';
import AddStationModal from './AddStationModal';

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
  currentSession?: {
    id: string;
    customerName: string;
    startTime: string;
    timeRemaining: number;
  };
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [stations, setStations] = useState<Station[]>([
    {
      id: '1',
      name: 'GAMING-RIG-01',
      type: 'PC',
      status: 'AVAILABLE',
      hourlyRate: 5.0,
      ipAddress: '192.168.1.101',
      specifications: 'RTX 4080, i7-13700K, 32GB DDR5',
      isLocked: false,
    },
    {
      id: '2',
      name: 'GAMING-RIG-02',
      type: 'PC',
      status: 'OCCUPIED',
      hourlyRate: 5.0,
      ipAddress: '192.168.1.102',
      specifications: 'RTX 4070, i5-13600K, 16GB DDR5',
      isLocked: false,
      currentSession: {
        id: 'session1',
        customerName: 'Alex Morgan',
        startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        timeRemaining: 90,
      },
    },
    {
      id: '3',
      name: 'CONSOLE-PS5-01',
      type: 'PS5',
      status: 'AVAILABLE',
      hourlyRate: 4.0,
      specifications: 'PlayStation 5, 4K Gaming',
      isLocked: false,
    },
    {
      id: '4',
      name: 'GAMING-RIG-03',
      type: 'PC',
      status: 'MAINTENANCE',
      hourlyRate: 5.0,
      specifications: 'RTX 4060, i5-12400F, 16GB DDR4',
      isLocked: true,
    },
  ]);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddStation, setShowAddStation] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('connected');
  const { toast } = useToast();

  useEffect(() => {
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
  }, []);

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

  const handleAddStation = (stationData: Omit<Station, 'id' | 'isLocked' | 'currentSession'>) => {
    const newStation: Station = {
      ...stationData,
      id: `station-${Date.now()}`,
      isLocked: false,
      status: 'AVAILABLE',
    };
    setStations(prev => [...prev, newStation]);
    setShowAddStation(false);
    toast({
      title: "Station Added",
      description: `${newStation.name} has been successfully added to the network.`,
    });
  };

  const handleDeleteStation = (stationId: string) => {
    setStations(prev => prev.filter(s => s.id !== stationId));
    toast({
      title: "Station Removed",
      description: "Station has been permanently removed from the system.",
    });
  };

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
                  <h1 className="text-2xl font-gaming font-bold bg-gradient-gaming bg-clip-text text-transparent">
                    GAMING CAFE ADMIN
                  </h1>
                </div>
              </div>
              
              <Badge 
                className={`font-gaming text-xs ${
                  connectionStatus === 'connected' 
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
            
            <div className="flex items-center space-x-3">
              <Button
                variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('dashboard')}
                className={activeTab === 'dashboard' ? 'btn-gaming' : 'hover:bg-primary/10'}
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Control Center
              </Button>
              <Button
                variant={activeTab === 'stations' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('stations')}
                className={activeTab === 'stations' ? 'btn-gaming' : 'hover:bg-primary/10'}
              >
                <Monitor className="w-5 h-5 mr-2" />
                Station Network
              </Button>
              <Button
                variant="ghost"
                onClick={onLogout}
                className="hover:bg-error/10 hover:text-error"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-slide-in-gaming">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-gaming font-bold text-foreground">
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
                value={`$${stats.totalRevenue.toFixed(2)}`}
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
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-gaming font-bold text-foreground">
                STATION NETWORK
              </h2>
              <Button 
                onClick={() => setShowAddStation(true)}
                className="btn-gaming font-gaming"
              >
                <Plus className="w-5 h-5 mr-2" />
                DEPLOY NEW RIG
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stations.map((station, index) => (
                <div
                  key={station.id}
                  className="animate-slide-in-gaming"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <StationCard 
                    station={station}
                    onAction={handleStationAction}
                    onDelete={() => handleDeleteStation(station.id)}
                  />
                </div>
              ))}
            </div>
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
    </div>
  );
};

export default AdminDashboard;