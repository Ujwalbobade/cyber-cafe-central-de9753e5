import React, { useState, useEffect } from 'react';
import {
  Activity,
  BarChart3,
  Clock,
  Cog,
  Cpu,
  DollarSign,
  Grid3X3,
  List,
  LogOut,
  Monitor,
  Palette,
  Plus,
  Settings,
  Shield,
  Table,
  TrendingUp,
  User,
  Users,
  Zap,
  Hand
} from 'lucide-react';
import ColorPicker from '@/components/ui/color-picker';
import { generateThemeColors, applyThemeColors } from '@/utils/themeGenerator';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmationDialog from '@/components/ui/delete-confirmation-dialog';
import UserInfoCard from '@/components/ui/user-info-card';
import StationCard from './Station/StationCard';
import StatsCard from './StatsCard';
import AddStationModal from './Station/AddStationModal';
import StationGridView from './Station/StationGridView';
import StationTableView from './Station/StationTableView';
import StationPopup from './Station/StationPopup';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Types
export type ConnectionState = "connected" | "disconnected" | "error";
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

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  loginTime?: string;
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
  handRaised?: boolean;
  currentSession?: {
    id: string;
    customerName: string;
    startTime: string;
    timeRemaining: number;
  };
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const wsRef = React.useRef<WebSocket | null>(null);

  useEffect(() => {
    // 1. Fetch initial state via API
    const fetchInitialStations = async () => {
      try {
        const data = await getStations();
        const normalized = (data || []).map((s: any) => {
          if (s.currentSession && typeof s.currentSession.timeRemaining === 'number') {
            let tr = Number(s.currentSession.timeRemaining) || 0;
            if (tr > 1000) tr = Math.ceil(tr / 60);
            return { ...s, currentSession: { ...s.currentSession, timeRemaining: tr } };
          }
          return s;
        });
        setStations(normalized);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch initial stations:', error);
        setLoading(false);
      }
    };

    fetchInitialStations();

    // 2. Open WebSocket for updates
    const ws = new WebSocket("ws://localhost:8087/ws/admin");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ Connected to admin WS");
      setConnectionStatus("connected");
      setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: "heartbeat" }));
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case "SESSION_UPDATE":
          setStations((prev) =>
            prev.map((station) =>
              station.id === msg.stationId
                ? { 
                    ...station, 
                    status: msg.status === "COMPLETED" ? "AVAILABLE" : "OCCUPIED",
                    currentSession: msg.status === "COMPLETED" ? undefined : {
                      id: msg.sessionId,
                      customerName: station.currentSession?.customerName || "Customer",
                      startTime: new Date(msg.currentTime).toISOString(),
                      timeRemaining: Math.max(0, Math.floor((msg.endTime - Date.now()) / 60000))
                    }
                  }
                : station
            )
          );
          break;
        case "analytics_update":
          // Handle analytics updates if needed
          break;
        default:
          console.log("Unhandled WS message:", msg);
      }
    };

    ws.onclose = () => {
      console.log("❌ WebSocket disconnected");
      setConnectionStatus("disconnected");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("error");
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);


  // Load current user info
  useEffect(() => {
    const loadUser = () => {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setCurrentUser({
            ...user,
            loginTime: new Date().toISOString() // Set current time as login time
          });
        } catch (error) {
          console.error('Failed to parse user data:', error);
        }
      }
    };

    loadUser();
  }, []);


  const [activeTab, setActiveTab] = useState<'dashboard' | 'stations'>('dashboard');
  const [stationFilter, setStationFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [stationView, setStationView] = useState<'list' | 'grid' | 'table'>('list');
  const [showAddStation, setShowAddStation] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [showStationPopup, setShowStationPopup] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [stationToDelete, setStationToDelete] = useState<Station | null>(null);

  const [cafeName, setCafeName] = useState(() => {
    return localStorage.getItem('cafe-name') || 'CYBER LOUNGE';
  });

  // Handle theme color changes
  const handleColorChange = (color: { r: number; g: number; b: number }) => {
    const themeColors = generateThemeColors(color);
    applyThemeColors(themeColors);
  };

  // Initialize theme on component mount
  useEffect(() => {
    const savedColor = localStorage.getItem('theme-color');
    if (savedColor) {
      try {
        const color = JSON.parse(savedColor);
        handleColorChange(color);
      } catch (error) {
        console.error('Failed to load saved theme color:', error);
      }
    }
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
      setStationToDelete(null);

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

  const showDeleteConfirmation = (station: Station) => {
    setStationToDelete(station);
  };

  const updateStationStatus = (stationId: string, status: Station["status"]) => {
    setStations(prev =>
      prev.map(station =>
        station.id === stationId ? { ...station, status } : station
      )
    );
  };

  const handleRaiseHand = (stationId: string) => {
    setStations(prev =>
      prev.map(station =>
        station.id === stationId ? { ...station, handRaised: !station.handRaised } : station
      )
    );

    const station = stations.find(s => s.id === stationId);
    if (station) {
      toast({
        title: station.handRaised ? "Hand Lowered" : "Hand Raised",
        description: `${station.name} ${station.handRaised ? 'no longer needs' : 'needs'} assistance`,
        variant: station.handRaised ? "default" : "destructive"
      });
    }
  };

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

        case "start-session":
          const session = await startSession(stationId, data); // backend creates session
          // Normalize timeRemaining: backend may return seconds — convert to minutes when necessary
          let tr = Number(session.timeRemaining) || 0;
          if (tr > 1000) tr = Math.ceil(tr / 60); // assume seconds
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
                    timeRemaining: tr,
                  },
                }
                : station
            )
          );
          console.log("📢 Session started:", session);
          toast({ title: "Session Started", description: `Session started for ${data.customerName}.` });
          break;
        case "end-session":
          if (!data?.sessionId) {
            console.error("❌ Session ID missing in end-session event:", data);
            throw new Error("Session ID required to end session");
          }

          console.log("📢 Ending session with ID:", data.sessionId);

          try {
            await endSession(data.sessionId);
            console.log("✅ Backend confirmed session end:", data.sessionId);

            setStations(prev =>
              prev.map(station =>
                String(station.currentSession?.id) === String(data.sessionId)
                  ? { ...station, status: "AVAILABLE", currentSession: undefined }
                  : station
              )
            );

            // If the popup was open for this station, clear it so UI updates
            setSelectedStation(prev => (prev && String(prev.currentSession?.id) === String(data.sessionId) ? { ...prev, status: 'AVAILABLE', currentSession: undefined } : prev));

            toast({
              title: "Session Ended",
              description: `Session ${data.sessionId} has been ended.`,
            });
          } catch (err) {
            console.error("🔥 Error ending session:", err);
            toast({
              title: "Error",
              description: "Failed to end session. Check logs.",
              variant: "destructive",
            });
          }
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

        case "raise-hand":
          handleRaiseHand(stationId);
          break;

        case "show-popup":
          const station = stations.find(s => s.id === stationId) || data;
          if (station) {
            setSelectedStation(station);
            setShowStationPopup(true);
          }
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

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-32 w-96 h-96 bg-gradient-to-tr from-primary/30 via-transparent to-transparent rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-40 -right-32 w-96 h-96 bg-gradient-to-bl from-accent/25 via-transparent to-transparent rounded-full blur-3xl opacity-50" />
      </div>
      {/* Mobile Navbar with collapsible menu */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
        <Collapsible open={mobileNavOpen} onOpenChange={(open) => setMobileNavOpen(open)}>
          <div className="flex justify-end">
            <CollapsibleTrigger asChild>
              <Button variant="default" size="icon" className="rounded-full shadow-lg w-14 h-14 flex items-center justify-center ring-2 ring-primary/20 bg-card/80 backdrop-blur-md">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <div className="mt-3 bg-card/90 backdrop-blur-md rounded-lg p-2 shadow-lg flex justify-around">
              <Button
                variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => { setActiveTab('dashboard'); setMobileNavOpen(false); }}
                aria-label="Dashboard"
                title="Dashboard"
                className={`flex-1 mx-1 ${activeTab === 'dashboard' ? 'btn-gaming' : 'hover:bg-primary/10'} font-gaming`}
                size="sm"
              >
                <BarChart3 className="w-6 h-6 mx-auto" />
              </Button>
              <Button
                variant={activeTab === 'stations' ? 'default' : 'ghost'}
                onClick={() => { setActiveTab('stations'); setMobileNavOpen(false); }}
                aria-label="Stations"
                title="Stations"
                className={`flex-1 mx-1 ${activeTab === 'stations' ? 'btn-gaming' : 'hover:bg-primary/10'} font-gaming`}
                size="sm"
              >
                <Monitor className="w-6 h-6 mx-auto" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setShowSettings(true); setMobileNavOpen(false); }}
                aria-label="Theme"
                title="Theme"
                className="flex-1 mx-1 hover:bg-primary/10 font-gaming"
                size="sm"
              >
                <Palette className="w-6 h-6 mx-auto" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => { navigate('/settings'); setMobileNavOpen(false); }}
                aria-label="Settings"
                title="Settings"
                className="flex-1 mx-1 hover:bg-primary/10 font-gaming"
                size="sm"
              >
                <Cog className="w-6 h-6 mx-auto" />
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
      {/* Header */}
      <header className="border-b border-primary/20 bg-card/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow-primary ring-2 ring-primary/20 animate-pulse">
                  <Shield className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-gaming font-bold bg-gradient-gaming bg-clip-text text-transparent">
                    {cafeName}
                  </h1>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5 tracking-wider font-semibold">
                    Cyber Lounge Control • Manage rigs, sessions & settings
                  </p>
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
              {/* User Info Card */}
              {/* Other header actions: hidden on small screens, visible from md and up */}
              <div className="hidden md:flex items-center space-x-1 md:space-x-3">
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
                  onClick={() => navigate('/analytics')}
                  className="hover:bg-accent/10 hover:text-accent px-2 md:px-4"
                  size="sm"
                >
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
                  <span className="hidden md:inline">Analytics</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/settings')}
                  className="hover:bg-primary/10 px-2 md:px-4"
                  size="sm"
                >
                  <Cog className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
                  <span className="hidden md:inline">Settings</span>
                </Button>

                {/* Color Picker */}
                <ColorPicker onColorChange={handleColorChange} />

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 px-2 md:px-3 py-2 md:py-2"
                    >
                      <Avatar className="w-8 h-8 md:w-9 md:h-9">
                        <AvatarImage src="/avatar.png" alt={currentUser?.username} />
                        <AvatarFallback>{currentUser?.username?.[0] ?? "U"}</AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline font-gaming text-sm md:text-base">
                        {currentUser?.username ?? "Admin"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="min-w-[12rem] sm:w-56 card-gaming p-2"
                  >
                    <DropdownMenuLabel className="font-gaming">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground truncate">{currentUser?.email}</span>
                        <span className="text-xs text-muted-foreground capitalize">{currentUser?.role}</span>
                      </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      className="text-warning font-gaming cursor-pointer"
                      onClick={() => setShowLogoutDialog(true)}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Logout stays visible on all screen sizes - now handled by UserInfoCard */}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
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
                  className="h-20 bg-gradient-card border-dashed border-2 border-primary/30 hover:border-primary hover:shadow-glow-primary transform transition-transform duration-300 hover:scale-105"
                  variant="ghost"
                  aria-label="Add new rig"
                >
                  <div className="text-center">
                    <Plus className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="font-gaming font-semibold">ADD NEW RIG</p>
                  </div>
                </Button>

                <Button
                  onClick={() => navigate('/analytics')}
                  className="h-20 bg-gradient-card border-dashed border-2 border-accent/30 hover:border-accent hover:shadow-glow-accent transform transition-transform duration-300 hover:scale-105"
                  variant="ghost"
                  aria-label="Open analytics hub"
                >
                  <div className="text-center">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 text-accent" />
                    <p className="font-gaming font-semibold">ANALYTICS HUB</p>
                  </div>
                </Button>

                <Button
                  onClick={() => navigate('/settings')}
                  className="h-20 bg-gradient-card border-dashed border-2 border-secondary/30 hover:border-secondary hover:shadow-glow-secondary transform transition-transform duration-300 hover:scale-105"
                  variant="ghost"
                  aria-label="Open system configuration"
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
                        onDelete={() => showDeleteConfirmation(station)}
                        updateStationStatus={updateStationStatus}
                      />
                    </div>
                  ))}
              </div>
            ) : stationView === 'grid' ? (
              <Card className="card-gaming">
                <StationGridView
                  stations={stations.filter(station => {
                    if (stationFilter === 'active') return station.status === 'OCCUPIED';
                    if (stationFilter === 'inactive') return station.status !== 'OCCUPIED';
                    return true;
                  })}
                  onStationClick={handleStationClick}
                  onStationAction={handleStationAction}
                  updateStationStatus={updateStationStatus}
                />
              </Card>
            ) : (
              <Card className="card-gaming p-6">
                <StationTableView
                  stations={stations.filter(station => {
                    if (stationFilter === 'active') return station.status === 'OCCUPIED';
                    if (stationFilter === 'inactive') return station.status !== 'OCCUPIED';
                    return true;
                  })}
                  onStationClick={handleStationClick}
                  onStationAction={handleStationAction}
                  onDelete={showDeleteConfirmation}
                  updateStationStatus={updateStationStatus}
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
        onDelete={() => selectedStation && showDeleteConfirmation(selectedStation)}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={stationToDelete !== null}
        onClose={() => setStationToDelete(null)}
        onConfirm={() => stationToDelete && handleDeleteStation(stationToDelete.id)}
        title="Delete Station"
        itemName={stationToDelete?.name}
      />

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="card-gaming">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-gaming text-warning">Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription className="font-gaming">
              Are you sure you want to logout? You will need to login again to access the admin dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-gaming">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-warning text-warning-foreground hover:bg-warning/90 font-gaming"
              onClick={() => {
                setShowLogoutDialog(false);
                onLogout();
              }}
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AdminDashboard;