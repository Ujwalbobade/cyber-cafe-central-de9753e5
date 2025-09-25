import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Activity, BarChart3, Monitor, TrendingUp, Cog, User, Users, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  systemConfig: any;
  currentUser: any;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  activeTab: 'dashboard' | 'stations' | 'userManagement'|'credits';
  setActiveTab: (tab: 'dashboard' | 'stations' | 'userManagement'|'credits') => void;
  onLogout: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  systemConfig,
  currentUser,
  connectionStatus,
  activeTab,
  setActiveTab,
  onLogout
}) => {
  const navigate = useNavigate();
  const cafeName = systemConfig?.cafeName || localStorage.getItem('cafe-name') || 'CYBER LOUNGE';

  return (
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

          <div className="flex items-center space-x-1 md:space-x-3">
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

                <DropdownMenuContent align="end" className="min-w-[12rem] sm:w-56 card-gaming p-2">
                  <DropdownMenuLabel className="font-gaming">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground truncate">{currentUser?.email}</span>
                      <span className="text-xs text-muted-foreground capitalize">{currentUser?.role}</span>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="text-accent font-gaming cursor-pointer"
                    onClick={() => setActiveTab('userManagement')}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Edit Profile
                  </DropdownMenuItem>

                  {currentUser?.role === "admin" && (
                    <DropdownMenuItem
                      className="text-primary font-gaming cursor-pointer"
                      onClick={() => setActiveTab('userManagement')}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Manage Users
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="text-warning font-gaming cursor-pointer"
                    onClick={onLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;