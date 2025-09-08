import React, { useState } from 'react';
import {
  Settings,
  Clock,
  DollarSign,
  Moon,
  Sparkles,
  Package,
  Plus,
  Trash2,
  Save,
  X,
  ArrowLeft,
  Palette,
  Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export interface SystemConfiguration {
  hourlyRates: {
    [stationType: string]: number;
  };
  timeOptions: number[]; // in minutes: [10, 15, 30, 60, 120, 180]
  nightPass: {
    enabled: boolean;
    startTime: string; // "22:00"
    endTime: string; // "06:00"
    rate: number; // per hour
    fixedPrice?: number; // optional fixed price for whole night
  };
  happyHours: {
    enabled: boolean;
    startTime: string; // "14:00"
    endTime: string; // "18:00"
    discountPercent: number; // 20 = 20% off
    days: string[]; // ["monday", "tuesday", etc]
  }[];
  customPacks: {
    id: string;
    name: string;
    duration: number; // in minutes
    price: number;
    description: string;
    validStationTypes: ('PC' | 'PS5' | 'PS4')[];
  }[];
}

const defaultConfig: SystemConfiguration = {
  hourlyRates: { PC: 100, PS5: 150, PS4: 120 },
  timeOptions: [10, 15, 30, 60, 120, 180],
  nightPass: {
    enabled: false,
    startTime: '22:00',
    endTime: '06:00',
    rate: 80
  },
  happyHours: [],
  customPacks: []
};

const SystemSettings: React.FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<SystemConfiguration>(defaultConfig);
  const [currentTheme, setCurrentTheme] = useState<'cyber-blue' | 'neon-purple'>(() => {
    return localStorage.getItem('gaming-cafe-theme') as 'cyber-blue' | 'neon-purple' || 'cyber-blue';
  });
  const [cafeName, setCafeName] = useState(() => {
    return localStorage.getItem('cafe-name') || 'CYBER LOUNGE';
  });
  const [newTimeOption, setNewTimeOption] = useState('');
  const [newCustomPack, setNewCustomPack] = useState({
    name: '',
    duration: 60,
    price: 100,
    description: '',
    validStationTypes: ['PC', 'PS5', 'PS4'] as ('PC' | 'PS5' | 'PS4')[]
  });
  const [newHappyHour, setNewHappyHour] = useState({
    startTime: '14:00',
    endTime: '18:00',
    discountPercent: 20,
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  });
  const [newCustomStation, setNewCustomStation] = useState({
    type: '',
    rate: 100
  });

  const handleSave = () => {
    // Save configuration logic here
    localStorage.setItem('systemConfig', JSON.stringify(config));
    localStorage.setItem('cafe-name', cafeName);
    localStorage.setItem('gaming-cafe-theme', currentTheme);
    
    // Apply theme changes
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    toast.success('System configuration saved successfully!');
  };

  const addTimeOption = () => {
    const minutes = parseInt(newTimeOption);
    if (minutes > 0 && !config.timeOptions.includes(minutes)) {
      setConfig(prev => ({
        ...prev,
        timeOptions: [...prev.timeOptions, minutes].sort((a, b) => a - b)
      }));
      setNewTimeOption('');
    }
  };

  const removeTimeOption = (minutes: number) => {
    setConfig(prev => ({
      ...prev,
      timeOptions: prev.timeOptions.filter(t => t !== minutes)
    }));
  };

  const addCustomPack = () => {
    if (newCustomPack.name.trim()) {
      setConfig(prev => ({
        ...prev,
        customPacks: [...prev.customPacks, {
          ...newCustomPack,
          id: `pack-${Date.now()}`
        }]
      }));
      setNewCustomPack({
        name: '',
        duration: 60,
        price: 100,
        description: '',
        validStationTypes: ['PC', 'PS5', 'PS4']
      });
    }
  };

  const removeCustomPack = (packId: string) => {
    setConfig(prev => ({
      ...prev,
      customPacks: prev.customPacks.filter(p => p.id !== packId)
    }));
  };

  const addHappyHour = () => {
    setConfig(prev => ({
      ...prev,
      happyHours: [...prev.happyHours, {
        ...newHappyHour,
        enabled: true
      }]
    }));
  };

  const removeHappyHour = (index: number) => {
    setConfig(prev => ({
      ...prev,
      happyHours: prev.happyHours.filter((_, i) => i !== index)
    }));
  };

  const addCustomStation = () => {
    if (newCustomStation.type.trim() && newCustomStation.rate > 0) {
      setConfig(prev => ({
        ...prev,
        hourlyRates: {
          ...prev.hourlyRates,
          [newCustomStation.type]: newCustomStation.rate
        }
      }));
      setNewCustomStation({ type: '', rate: 100 });
    }
  };

  const removeStationType = (stationType: string) => {
    // Don't allow removing default station types
    if (['PC', 'PS5', 'PS4'].includes(stationType)) return;
    
    setConfig(prev => {
      const { [stationType]: removed, ...rest } = prev.hourlyRates;
      return {
        ...prev,
        hourlyRates: rest
      };
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center">
                  <Settings className="w-6 h-6 mr-3 text-primary" />
                  System Configuration
                </h1>
                <p className="text-sm text-muted-foreground">Configure gaming center settings and pricing</p>
              </div>
            </div>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
              <Save className="w-4 h-4 mr-2" />
              Save 
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="rates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-muted">
            <TabsTrigger value="rates" className="data-[state=active]:bg-background">
              <DollarSign className="w-4 h-4 mr-2" />
              Rates
            </TabsTrigger>
            <TabsTrigger value="time" className="data-[state=active]:bg-background">
              <Clock className="w-4 h-4 mr-2" />
              Time
            </TabsTrigger>
            <TabsTrigger value="night" className="data-[state=active]:bg-background">
              <Moon className="w-4 h-4 mr-2" />
              Night Pass
            </TabsTrigger>
            <TabsTrigger value="happy" className="data-[state=active]:bg-background">
              <Sparkles className="w-4 h-4 mr-2" />
              Happy Hours
            </TabsTrigger>
            <TabsTrigger value="packs" className="data-[state=active]:bg-background">
              <Package className="w-4 h-4 mr-2" />
              Packs
            </TabsTrigger>
            <TabsTrigger value="theme" className="data-[state=active]:bg-background">
              <Palette className="w-4 h-4 mr-2" />
              Theme
            </TabsTrigger>
          </TabsList>

          {/* Hourly Rates */}
          <TabsContent value="rates" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Station Hourly Rates</h3>
              
              <div className="space-y-4">
                {Object.entries(config.hourlyRates).map(([type, rate]) => (
                  <div key={type} className="p-4 border border-border rounded-lg bg-muted/50">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="space-y-2 flex-1">
                            <Label className="text-sm font-medium text-foreground">{type} Station</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                              <Input
                                type="number"
                                value={rate}
                                onChange={(e) => setConfig(prev => ({
                                  ...prev,
                                  hourlyRates: {
                                    ...prev.hourlyRates,
                                    [type]: parseFloat(e.target.value) || 0
                                  }
                                }))}
                                className="pl-8"
                                placeholder="0.00"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">Rate per hour</p>
                          </div>
                        </div>
                      </div>
                      {!['PC', 'PS5', 'PS4'].includes(type) && (
                        <Button
                          onClick={() => removeStationType(type)}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="border-t border-border pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                    <Input
                      value={newCustomStation.type}
                      onChange={(e) => setNewCustomStation(prev => ({ ...prev, type: e.target.value }))}
                      placeholder="Station Type (e.g., VR, XBOX)"
                      className="flex-1"
                    />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        value={newCustomStation.rate}
                        onChange={(e) => setNewCustomStation(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                        className="pl-8"
                        placeholder="Rate per hour"
                      />
                    </div>
                  </div>
                  <Button onClick={addCustomStation} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Station Type
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Time Options */}
          <TabsContent value="time" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Available Time Options</h3>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={newTimeOption}
                    onChange={(e) => setNewTimeOption(e.target.value)}
                    placeholder="Minutes (e.g., 15)"
                    className="flex-1"
                  />
                  <Button onClick={addTimeOption} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {config.timeOptions.map(minutes => (
                    <Badge
                      key={minutes}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => removeTimeOption(minutes)}
                    >
                      {minutes}m
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Night Pass */}
          <TabsContent value="night" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Night Pass Configuration</h3>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.nightPass.enabled}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      nightPass: { ...prev.nightPass, enabled: e.target.checked }
                    }))}
                    className="rounded border-input"
                  />
                  <Label className="text-sm font-medium">Enable Night Pass</Label>
                </div>

                {config.nightPass.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Start Time</Label>
                      <Input
                        type="time"
                        value={config.nightPass.startTime}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          nightPass: { ...prev.nightPass, startTime: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">End Time</Label>
                      <Input
                        type="time"
                        value={config.nightPass.endTime}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          nightPass: { ...prev.nightPass, endTime: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Hourly Rate (₹)</Label>
                      <Input
                        type="number"
                        value={config.nightPass.rate}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          nightPass: { ...prev.nightPass, rate: parseFloat(e.target.value) || 0 }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Fixed Price (₹) - Optional</Label>
                      <Input
                        type="number"
                        value={config.nightPass.fixedPrice || ''}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          nightPass: { 
                            ...prev.nightPass, 
                            fixedPrice: e.target.value ? parseFloat(e.target.value) : undefined 
                          }
                        }))}
                        placeholder="Leave empty for hourly rate"
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Happy Hours */}
          <TabsContent value="happy" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Happy Hours</h3>

              <div className="space-y-4">
                {config.happyHours.map((happyHour, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg bg-muted/50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-sm font-medium text-foreground">
                          {happyHour.startTime} - {happyHour.endTime}
                        </span>
                        <Badge variant="secondary" className="ml-2">
                          {happyHour.discountPercent}% OFF
                        </Badge>
                      </div>
                      <Button
                        onClick={() => removeHappyHour(index)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Days: {happyHour.days.join(', ')}
                    </div>
                  </div>
                ))}

                <div className="border-t border-border pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                    <Input
                      type="time"
                      value={newHappyHour.startTime}
                      onChange={(e) => setNewHappyHour(prev => ({ ...prev, startTime: e.target.value }))}
                      placeholder="Start time"
                    />
                    <Input
                      type="time"
                      value={newHappyHour.endTime}
                      onChange={(e) => setNewHappyHour(prev => ({ ...prev, endTime: e.target.value }))}
                      placeholder="End time"
                    />
                    <Input
                      type="number"
                      value={newHappyHour.discountPercent}
                      onChange={(e) => setNewHappyHour(prev => ({ ...prev, discountPercent: parseInt(e.target.value) || 0 }))}
                      placeholder="Discount %"
                    />
                  </div>
                  <Button onClick={addHappyHour} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Happy Hour
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Custom Packs */}
          <TabsContent value="packs" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Custom Gaming Packs</h3>

              <div className="space-y-4">
                {config.customPacks.map(pack => (
                  <div key={pack.id} className="p-4 border border-border rounded-lg bg-muted/50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">{pack.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {pack.duration}min • ₹{pack.price} • {pack.validStationTypes.join(', ')}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{pack.description}</div>
                      </div>
                      <Button
                        onClick={() => removeCustomPack(pack.id)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="border-t border-border pt-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input
                      value={newCustomPack.name}
                      onChange={(e) => setNewCustomPack(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Pack Name"
                    />
                    <Input
                      type="number"
                      value={newCustomPack.duration}
                      onChange={(e) => setNewCustomPack(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                      placeholder="Duration (minutes)"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input
                      type="number"
                      value={newCustomPack.price}
                      onChange={(e) => setNewCustomPack(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                      placeholder="Price (₹)"
                    />
                    <Input
                      value={newCustomPack.description}
                      onChange={(e) => setNewCustomPack(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description"
                    />
                  </div>
                  <Button onClick={addCustomPack} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Custom Pack
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
          {/* Theme Configuration */}
          <TabsContent value="theme" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Theme & Branding</h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Cafe Name</Label>
                  <div className="flex gap-2">
                    <Input
                      value={cafeName}
                      onChange={(e) => setCafeName(e.target.value)}
                      placeholder="Enter cafe name"
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm">
                      <Monitor className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Display name for your gaming center</p>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">Color Theme</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant={currentTheme === 'cyber-blue' ? 'default' : 'outline'}
                      onClick={() => {
                        setCurrentTheme('cyber-blue');
                        document.documentElement.setAttribute('data-theme', 'cyber-blue');
                      }}
                      className={`h-16 flex flex-col items-center justify-center space-y-2 ${
                        currentTheme === 'cyber-blue' ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                      <span className="font-gaming text-sm">Cyber Blue</span>
                    </Button>
                    <Button
                      variant={currentTheme === 'neon-purple' ? 'default' : 'outline'}
                      onClick={() => {
                        setCurrentTheme('neon-purple');
                        document.documentElement.setAttribute('data-theme', 'neon-purple');
                      }}
                      className={`h-16 flex flex-col items-center justify-center space-y-2 ${
                        currentTheme === 'neon-purple' ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                      <span className="font-gaming text-sm">Neon Purple</span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Choose the color scheme for your admin interface</p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <h4 className="text-sm font-medium text-foreground mb-2">Theme Preview</h4>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <span>Primary: Gaming interface elements</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                    <div className="w-3 h-3 bg-accent rounded-full"></div>
                    <span>Accent: Available stations and success states</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                    <div className="w-3 h-3 bg-secondary rounded-full"></div>
                    <span>Secondary: Buttons and interactive elements</span>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default SystemSettings;