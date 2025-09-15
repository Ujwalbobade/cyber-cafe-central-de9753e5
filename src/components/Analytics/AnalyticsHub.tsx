import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, Clock, DollarSign, AlertTriangle,
  Activity, Calendar, Target, Zap, Settings, Download
} from 'lucide-react';
import StatsCard from '../StatsCard';
import { getAnalytics, getRealTimeAnalytics } from '@/services/apis/api';

// Types
export type ConnectionState = "connected" | "disconnected" | "error";

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
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const navigate = useNavigate();

  const wsRef = React.useRef<WebSocket | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    setLoading(true);
    setAnalyticsData(null);

    // 1. Fetch initial analytics data
    const loadAnalytics = async () => {
      try {
        const data = await getAnalytics(timeRange);
        if (isMounted && data) {
          setAnalyticsData(data);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load analytics:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAnalytics();

    // 2. Open WebSocket for real-time updates
    if (realTimeUpdates) {
      const connectAnalyticsWebSocket = async () => {
        // Get token for WebSocket authentication
        let token = localStorage.getItem("adminToken") || localStorage.getItem("token-dummy");
        
        if (!token) {
          try {
            const res = await fetch("http://localhost:8087/api/auth/dummy-admin-token");
            const data = await res.json();
            if (data.token) {
              token = data.token;
              localStorage.setItem("token-dummy", token);
            }
          } catch (err) {
            console.error("Failed to fetch token for WebSocket:", err);
          }
        }

        const wsUrl = token 
          ? `ws://localhost:8087/ws/admin?token=${encodeURIComponent(token)}`
          : `ws://localhost:8087/ws/admin`;
        
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("✅ Connected to analytics WS");
          setConnectionState("connected");
          // Request analytics for the selected time range
          ws.send(JSON.stringify({ type: "request_analytics", timeRange }));
          
          setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ action: "heartbeat" }));
            }
          }, 30000);
        };

        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          
          switch (msg.type) {
            case "analytics_update":
              if (isMounted) {
                setAnalyticsData(msg.data);
              }
              break;
            default:
              console.log("Unhandled analytics WS message:", msg);
          }
        };

        ws.onclose = () => {
          console.log("❌ Analytics WebSocket disconnected");
          setConnectionState("disconnected");
        };

        ws.onerror = (error) => {
          console.error("Analytics WebSocket error:", error);
          setConnectionState("error");
        };
      };

      connectAnalyticsWebSocket();
    }

    return () => {
      isMounted = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [timeRange, realTimeUpdates]);

  // Handle export report
  const handleExportReport = async () => {
    try {
      const data = await getAnalytics(timeRange);
      const csvContent = `data:text/csv;charset=utf-8,${generateCSV(data)}`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `analytics-report-${timeRange}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to export report:", error);
    }
  };

  const generateCSV = (data: AnalyticsData) => {
    const headers = "Metric,Value\n";
    const rows = [
      `Total Revenue,$${data.totalRevenue}`,
      `Total Sessions,${data.totalSessions}`,
      `Average Session Time,${data.avgSessionTime} minutes`,
      `Active Stations,${data.activeStations}`,
    ].join("\n");
    return headers + rows;
  };

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

// Instead of returning, show skeleton state inside the page
if (!analyticsData) {
  return (
    <div className="min-h-screen bg-gradient-hero p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Back Button */}
        <div>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Header + Controls */}
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
            {/* Time Range Selector */}
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40 bg-card border-border">
                <SelectValue placeholder="Select Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24hours">Last 24 Hours</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 3 Months</SelectItem>
              </SelectContent>
            </Select>

            {/* Live/Static toggle */}
            <Button
              variant="outline"
              onClick={() => setRealTimeUpdates(!realTimeUpdates)}
              className={realTimeUpdates ? "border-success text-success" : ""}
            >
              <Activity className="w-4 h-4 mr-2" />
              {realTimeUpdates ? "Live Updates" : "Static View"}
            </Button>
          </div>
        </div>

        {/* Tabs remain visible */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 bg-card">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="stations">Stations</TabsTrigger>
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="w-10 h-10 text-warning mb-3" />
              <p className="text-muted-foreground text-lg">
                ⚠️ No analytics data available.  
              </p>
              <p className="text-sm text-muted-foreground">
                You can still browse tabs and adjust controls.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="revenue">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <DollarSign className="w-10 h-10 text-muted mb-3" />
              <p className="text-muted-foreground text-lg">
                No revenue data available for this range.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="stations">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="w-10 h-10 text-muted mb-3" />
              <p className="text-muted-foreground text-lg">
                No station performance data available.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="games">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Zap className="w-10 h-10 text-muted mb-3" />
              <p className="text-muted-foreground text-lg">
                No game popularity data available.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="insights">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="w-10 h-10 text-muted mb-3" />
              <p className="text-muted-foreground text-lg">
                No insights available at the moment.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
  return (
    <div className="min-h-screen bg-gradient-hero p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Back Button */}
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)} // go back one step
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
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

            <Button variant="outline" onClick={handleExportReport}>
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