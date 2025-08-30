import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, Clock, DollarSign, AlertTriangle,
  Activity, Calendar, Target, Zap, Settings, Download
} from 'lucide-react';
import StatsCard from './StatsCard';
import AdminWebSocketService from '@/services/Websockets';

interface AnalyticsData {
  totalRevenue: number;
  totalSessions: number;
  avgSessionTime: number;
  activeStations: number;
  peakHours: Array<{ hour: string; usage: number }>;
  revenueChart: Array<{ date: string; revenue: number; sessions: number }>;
  stationUsage: Array<{ station: string; usage: number; revenue: number }>;
  gamePopularity: Array<{ game: string; sessions: number; revenue: number }>;
  maintenanceAlerts: Array<{ station: string; issue: string; priority: string }>;
  userBehavior: Array<{ metric: string; value: number; change: number }>;
}

const AnalyticsHub: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(true);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);

  // Sample data for demo - in real app, this would come from WebSocket/API
  const sampleData: AnalyticsData = {
    totalRevenue: 15840,
    totalSessions: 1247,
    avgSessionTime: 45,
    activeStations: 18,
    peakHours: [
      { hour: '10:00', usage: 12 },
      { hour: '14:00', usage: 18 },
      { hour: '16:00', usage: 25 },
      { hour: '18:00', usage: 32 },
      { hour: '20:00', usage: 28 },
      { hour: '22:00', usage: 15 },
    ],
    revenueChart: [
      { date: 'Mon', revenue: 2300, sessions: 180 },
      { date: 'Tue', revenue: 2100, sessions: 165 },
      { date: 'Wed', revenue: 2800, sessions: 220 },
      { date: 'Thu', revenue: 2400, sessions: 190 },
      { date: 'Fri', revenue: 3200, sessions: 250 },
      { date: 'Sat', revenue: 1900, sessions: 145 },
      { date: 'Sun', revenue: 1100, sessions: 97 },
    ],
    stationUsage: [
      { station: 'Station-01', usage: 95, revenue: 2400 },
      { station: 'Station-02', usage: 87, revenue: 2100 },
      { station: 'Station-03', usage: 92, revenue: 2300 },
      { station: 'Station-04', usage: 78, revenue: 1800 },
      { station: 'Station-05', usage: 85, revenue: 2000 },
    ],
    gamePopularity: [
      { game: 'Valorant', sessions: 340, revenue: 4200 },
      { game: 'CS2', sessions: 280, revenue: 3500 },
      { game: 'League of Legends', sessions: 220, revenue: 2800 },
      { game: 'Fortnite', sessions: 180, revenue: 2200 },
      { game: 'PUBG', sessions: 150, revenue: 1900 },
    ],
    maintenanceAlerts: [
      { station: 'Station-07', issue: 'GPU Temperature High', priority: 'high' },
      { station: 'Station-12', issue: 'Network Latency Issues', priority: 'medium' },
      { station: 'Station-03', issue: 'Scheduled Maintenance', priority: 'low' },
    ],
    userBehavior: [
      { metric: 'Average Session Length', value: 45, change: 12 },
      { metric: 'Peak Concurrent Users', value: 32, change: 8 },
      { metric: 'Customer Retention', value: 78, change: -3 },
      { metric: 'Revenue Per User', value: 12.7, change: 15 },
    ],
  };

  useEffect(() => {
    // Initialize WebSocket connection
    const wsService = AdminWebSocketService.getInstance();
    
    const handleMessage = (data: any) => {
      if (data.type === 'analytics_update') {
        setAnalyticsData(data.data);
      }
    };

    wsService.connect();
    wsService.onMessage = handleMessage;

    // Load initial data
    setTimeout(() => {
      setAnalyticsData(sampleData);
      setLoading(false);
    }, 1000);

    // Request analytics data
    wsService.send({
      type: 'request_analytics',
      timeRange: timeRange
    });

    return () => {
      wsService.disconnect();
    };
  }, [timeRange]);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--warning))', 'hsl(var(--error))'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-primary font-gaming font-semibold tracking-wider">
            LOADING ANALYTICS DATA...
          </p>
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  return (
    <div className="min-h-screen bg-gradient-hero p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-gaming font-bold text-foreground mb-2">
              Analytics Hub
            </h1>
            <p className="text-muted-foreground text-lg">
              Comprehensive insights and performance metrics
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40 bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24hours">Last 24 Hours</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 3 Months</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => setRealTimeUpdates(!realTimeUpdates)}
              className={realTimeUpdates ? "border-success text-success" : ""}
            >
              <Activity className="w-4 h-4 mr-2" />
              {realTimeUpdates ? "Live Updates" : "Static View"}
            </Button>
            
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Revenue"
            value={`$${analyticsData.totalRevenue.toLocaleString()}`}
            icon={<DollarSign className="w-6 h-6" />}
            gradient="bg-gradient-primary"
            change="+12.5% from last week"
            trend="up"
          />
          <StatsCard
            title="Total Sessions"
            value={analyticsData.totalSessions.toLocaleString()}
            icon={<Users className="w-6 h-6" />}
            gradient="bg-gradient-secondary"
            change="+8.3% from last week"
            trend="up"
          />
          <StatsCard
            title="Avg Session Time"
            value={`${analyticsData.avgSessionTime}min`}
            icon={<Clock className="w-6 h-6" />}
            gradient="bg-gradient-gaming"
            change="+5.2min from last week"
            trend="up"
          />
          <StatsCard
            title="Active Stations"
            value={`${analyticsData.activeStations}/20`}
            icon={<Activity className="w-6 h-6" />}
            gradient="bg-accent"
            change="90% operational"
            trend="up"
          />
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 bg-card">
            <TabsTrigger value="overview" className="font-gaming">Overview</TabsTrigger>
            <TabsTrigger value="revenue" className="font-gaming">Revenue</TabsTrigger>
            <TabsTrigger value="stations" className="font-gaming">Stations</TabsTrigger>
            <TabsTrigger value="games" className="font-gaming">Games</TabsTrigger>
            <TabsTrigger value="insights" className="font-gaming">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Peak Hours Chart */}
              <Card className="card-gaming">
                <CardHeader>
                  <CardTitle className="font-gaming text-primary">Peak Usage Hours</CardTitle>
                  <CardDescription>Station usage throughout the day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analyticsData.peakHours}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="usage" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary) / 0.3)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Maintenance Alerts */}
              <Card className="card-gaming">
                <CardHeader>
                  <CardTitle className="font-gaming text-warning flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Maintenance Alerts
                  </CardTitle>
                  <CardDescription>Current system alerts and issues</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analyticsData.maintenanceAlerts.map((alert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-semibold text-foreground">{alert.station}</p>
                        <p className="text-sm text-muted-foreground">{alert.issue}</p>
                      </div>
                      <Badge 
                        variant={alert.priority === 'high' ? 'destructive' : 
                               alert.priority === 'medium' ? 'default' : 'secondary'}
                      >
                        {alert.priority}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card className="card-gaming lg:col-span-2">
                <CardHeader>
                  <CardTitle className="font-gaming text-primary">Revenue & Sessions Trend</CardTitle>
                  <CardDescription>Daily revenue and session count over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={analyticsData.revenueChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                      <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="sessions" 
                        stroke="hsl(var(--secondary))" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stations" className="space-y-6">
            <Card className="card-gaming">
              <CardHeader>
                <CardTitle className="font-gaming text-primary">Station Performance</CardTitle>
                <CardDescription>Usage percentage and revenue by station</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analyticsData.stationUsage}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="station" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="usage" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="games" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Game Popularity Pie Chart */}
              <Card className="card-gaming">
                <CardHeader>
                  <CardTitle className="font-gaming text-primary">Game Popularity</CardTitle>
                  <CardDescription>Most played games by session count</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.gamePopularity}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="sessions"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {analyticsData.gamePopularity.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Game Revenue */}
              <Card className="card-gaming">
                <CardHeader>
                  <CardTitle className="font-gaming text-primary">Game Revenue</CardTitle>
                  <CardDescription>Revenue generated by each game</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.gamePopularity.map((game, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-semibold">{game.game}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">${game.revenue}</p>
                          <p className="text-sm text-muted-foreground">{game.sessions} sessions</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Behavior Metrics */}
              <Card className="card-gaming">
                <CardHeader>
                  <CardTitle className="font-gaming text-primary">Key Performance Indicators</CardTitle>
                  <CardDescription>Important metrics and their trends</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analyticsData.userBehavior.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <p className="font-semibold text-foreground">{metric.metric}</p>
                        <p className="text-2xl font-bold text-primary">{metric.value}%</p>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        {metric.change > 0 ? (
                          <TrendingUp className="w-4 h-4 text-success" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-error" />
                        )}
                        <span className={metric.change > 0 ? "text-success" : "text-error"}>
                          {metric.change > 0 ? '+' : ''}{metric.change}%
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card className="card-gaming">
                <CardHeader>
                  <CardTitle className="font-gaming text-accent flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    AI Recommendations
                  </CardTitle>
                  <CardDescription>Smart insights to optimize your cafe</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <h4 className="font-semibold text-primary mb-2">Peak Hour Optimization</h4>
                    <p className="text-sm text-muted-foreground">
                      Consider implementing dynamic pricing during 6-8 PM peak hours to maximize revenue.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                    <h4 className="font-semibold text-warning mb-2">Maintenance Schedule</h4>
                    <p className="text-sm text-muted-foreground">
                      Station-07 needs immediate attention. Schedule maintenance to prevent downtime.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                    <h4 className="font-semibold text-accent mb-2">Game Library</h4>
                    <p className="text-sm text-muted-foreground">
                      Consider adding battle royale games - they're trending and could boost revenue by 15%.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AnalyticsHub;