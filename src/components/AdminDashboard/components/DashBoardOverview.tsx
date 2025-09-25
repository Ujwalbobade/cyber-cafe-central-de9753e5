import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, Zap, Users, DollarSign, Cpu, Plus, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import StatsCard from '../../StatsCard';
import { Station } from "@/components/Station/Types/Stations";

interface DashboardOverviewProps {
  stations: Station[];
  setActiveTab: (tab: 'dashboard' | 'stations' | 'userManagement' | 'credits') => void;
  setShowAddStation: (show: boolean) => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stations,
  setActiveTab,
  setShowAddStation
}) => {
  const navigate = useNavigate();

  const stats = {
    totalStations: stations.length,
    availableStations: stations.filter(s => s.status === 'AVAILABLE').length,
    occupiedStations: stations.filter(s => s.status === 'OCCUPIED').length,
    maintenanceStations: stations.filter(s => s.status === 'MAINTENANCE').length,
    offlineStations: stations.filter(s => s.status === 'OFFLINE').length,
    totalRevenue: stations
      .filter(s => s.currentSession)
      .reduce((sum, station) => sum + (station.hourlyRate * 0.5), 0)
  };

  const dailyCredits: { [key: string]: number } = {};
  stations.flatMap(s =>
    (s.pastSessions || []).map(session => {
      const durationHours =
        (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) /
        (1000 * 60 * 60);
      const amount = durationHours * s.hourlyRate;
      const date = new Date(session.endTime).toLocaleDateString();
      dailyCredits[date] = (dailyCredits[date] || 0) + amount;
      return amount;
    })
  );

  const today = new Date().toLocaleDateString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString();

  const todayRevenue = dailyCredits[today] || 0;
  const yesterdayRevenue = dailyCredits[yesterday] || 0;

  let changeText = "N/A";
  if (yesterdayRevenue > 0) {
    const changePercent = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
    changeText = `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(1)}% vs yesterday`;
  }

  return (
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
        <div
          onClick={() => {
            setActiveTab("stations");
          }}
          className="cursor-pointer"
        >
          <StatsCard
            title="TOTAL RIGS"
            value={stats.totalStations}
            icon={<Monitor className="w-8 h-8" />}
            gradient="bg-gradient-primary"
            change="+2 this week"
          />
        </div>

        <div
          onClick={() => {
            setActiveTab("stations");
          }}
          className="cursor-pointer"
        >
          <StatsCard
            title="AVAILABLE"
            value={stats.availableStations}
            icon={<Zap className="w-8 h-8" />}
            gradient="bg-gradient-to-r from-accent to-accent/80"
            change="Ready for action"
          />
        </div>

        <div
          onClick={() => {
            setActiveTab("stations");
          }}
          className="cursor-pointer"
        >
          <StatsCard
            title="ACTIVE SESSIONS"
            value={stats.occupiedStations}
            icon={<Users className="w-8 h-8" />}
            gradient="bg-gradient-secondary"
            change={`${((stats.occupiedStations / stats.totalStations) * 100).toFixed(0)}% utilization`}
          />
        </div>
        <div
          onClick={() => { setActiveTab("credits"); }}
          className="cursor-pointer"
        >
          <StatsCard
            title="CREDITS EARNED"
            value={`₹${stats.totalRevenue.toFixed(0)}`}
            icon={<DollarSign className="w-8 h-8" />}
            gradient="bg-gradient-gaming"
            change={changeText}
          />
        </div>
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
  );
};

export default DashboardOverview;