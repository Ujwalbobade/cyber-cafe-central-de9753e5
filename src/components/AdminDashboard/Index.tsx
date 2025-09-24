// File: AdminDashboard/index.tsx
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getSystemConfig, getStations } from '../../services/apis/api';
import AdminWebSocketService from "@/services/Websockets";
import { Station } from "@/components/Station/Types/Stations";

// Import sub-components
import DashboardHeader from './components/DashboardHeader';
import MobileNavigation from './components/MobileNavidations';
import DashboardOverview from './components/DashBoardOverview';
import StationsManagement from './components/StationsManagement';
import UserManagement from '../userInfo/UserManagement';
import StationModal from '../Station/StationModal';
import DeleteConfirmationDialog from '@/components/ui/delete-confirmation-dialog';
import LogoutDialog from './components/LogoutDailog';

// Import hooks
import { useStationActions } from './hooks/useStationAction';
import { useWebSocket } from './hooks/seWebSocket';

interface AdminDashboardProps {
  onLogout: () => void;
  currentUser: {
    username: string;
    email: string;
    role: string;
    loginTime?: string;
  } | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, currentUser }) => {
  // Core state
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stations' | 'userManagement'>('dashboard');
  
  // UI state
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showAddStation, setShowAddStation] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [stationToDelete, setStationToDelete] = useState<Station | null>(null);
  
  const { toast } = useToast();

  // Custom hooks
  const { connectionStatus } = useWebSocket(setStations);
  const { 
    handleAddStation, 
    handleDeleteStation, 
    handleStationAction,
    showDeleteConfirmation 
  } = useStationActions(stations, setStations, toast);

  // Load initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [stationsData, configData] = await Promise.all([
          getStations(),
          getSystemConfig()
        ]);

        const normalized = (stationsData || []).map((s: any) => {
          if (s.currentSession && typeof s.currentSession.timeRemaining === 'number') {
            let tr = Number(s.currentSession.timeRemaining) || 0;
            if (tr > 1000) tr = Math.ceil(tr / 60);
            return { ...s, currentSession: { ...s.currentSession, timeRemaining: tr } };
          }
          return s;
        });
        
        setStations(normalized);
        setSystemConfig(configData);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleLogout = () => {
    setShowLogoutDialog(false);
    onLogout();
  };

  if (loading) {
    return <div className="min-h-screen bg-gradient-hero flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-32 w-96 h-96 bg-gradient-to-tr from-primary/30 via-transparent to-transparent rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-40 -right-32 w-96 h-96 bg-gradient-to-bl from-accent/25 via-transparent to-transparent rounded-full blur-3xl opacity-50" />
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileNavOpen={mobileNavOpen}
        setMobileNavOpen={setMobileNavOpen}
      />

      {/* Header */}
      <DashboardHeader
        systemConfig={systemConfig}
        currentUser={currentUser}
        connectionStatus={connectionStatus}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={() => setShowLogoutDialog(true)}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
        {activeTab === 'dashboard' && (
          <DashboardOverview 
            stations={stations}
            setActiveTab={setActiveTab}
            setShowAddStation={setShowAddStation}
          />
        )}

        {activeTab === 'userManagement' && (
          <div className="space-y-6 animate-slide-in-gaming">
            <h2 className="text-2xl md:text-3xl font-gaming font-bold text-foreground mb-4">
              USER MANAGEMENT
            </h2>
            <UserManagement loggedInUser={currentUser} />
          </div>
        )}

        {activeTab === 'stations' && (
          <StationsManagement
            stations={stations}
            currentUser={currentUser}
            onStationAction={handleStationAction}
            onDeleteStation={showDeleteConfirmation}
            setShowAddStation={setShowAddStation}
          />
        )}
      </main>

      {/* Modals */}
      {showAddStation && (
        <StationModal
          onClose={() => setShowAddStation(false)}
          onSave={handleAddStation}
        />
      )}

      <DeleteConfirmationDialog
        isOpen={stationToDelete !== null}
        onClose={() => setStationToDelete(null)}
        onConfirm={() => stationToDelete && handleDeleteStation(stationToDelete.id)}
        title="Delete Station"
        itemName={stationToDelete?.name}
      />

      <LogoutDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
};

export default AdminDashboard;