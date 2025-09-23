import React, { useState, useEffect } from 'react';
import {
  Settings,
  DollarSign,
  Sparkles,
  Package,
  Plus,
  Trash2,
  Save,
  X,
  ArrowLeft,
  Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ColorPicker from '@/components/ui/color-picker';
import { getSystemConfig, saveSystemConfig } from '@/services/apis/api';

export interface SystemConfiguration {
  hourlyRates: { [stationType: string]: number };
  timeOptions: number[];
  happyHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    rate: number;
    days: string[];
  }[];
  customPacks: {
    id?: string;
    name: string;
    duration: number;
    price: number;
    description: string;
    validStationTypes: string[];
    enabled: boolean;
  }[];
}

const defaultConfig: SystemConfiguration = {
  hourlyRates: { PC: 100, PS5: 150, PS4: 120 },
  timeOptions: [10, 15, 30, 60, 120, 180],
  happyHours: [],
  customPacks: [],
};

const SystemSettings: React.FC = () => {
  const navigate = useNavigate();

  const [config, setConfig] = useState<SystemConfiguration>(defaultConfig);
  const [cafeName, setCafeName] = useState(() => localStorage.getItem('cafe-name') || 'CYBER LOUNGE');
  const [currentThemeColor, setCurrentThemeColor] = useState<{ r: number; g: number; b: number }>({
    r: 0,
    g: 122,
    b: 255,
  });

  const [newTimeOption, setNewTimeOption] = useState('');
  const [newCustomPack, setNewCustomPack] = useState({
    name: '',
    duration: 60,
    price: 100,
    description: '',
    validStationTypes: [] as string[],
    enabled: true,
  });
  const [newHappyHour, setNewHappyHour] = useState({
    startTime: '14:00',
    endTime: '18:00',
    rate: 80,
    days: [] as string[],
  });
  const [newCustomStation, setNewCustomStation] = useState({ type: '', rate: 100 });
  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await getSystemConfig();
        setConfig({
          hourlyRates: data.rates || defaultConfig.hourlyRates,
          timeOptions: data.times || defaultConfig.timeOptions,
          happyHours: data.happyHours || [],
          customPacks: data.packs?.map((p: any) => ({ ...p, enabled: p.enabled ?? true })) || [],
        });
        if (data.cafeName) setCafeName(data.cafeName);
        if (data.theme) {
          try {
            setCurrentThemeColor(JSON.parse(data.theme));
          } catch {
            console.warn("Invalid theme JSON, using default color");
          }
        }
      } catch (err) {
        console.error("Error fetching system config", err);
        toast.error("Failed to load system configuration.");
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    try {
      const payload = {
        rates: config.hourlyRates,
        times: config.timeOptions,
        happyHours: config.happyHours.map(hh => ({ ...hh })),
        packs: config.customPacks.map(pack => ({
          name: pack.name,
          duration: pack.duration,
          price: pack.price,
          description: pack.description,
          validStationTypes: pack.validStationTypes,
          enabled: pack.enabled,
        })),
        cafeName,
        theme: JSON.stringify(currentThemeColor),
      };

      await saveSystemConfig(payload);
      toast.success("System configuration saved successfully!");
    } catch (err) {
      console.error('Save failed', err);
      toast.error("Failed to save system configuration.");
    }
  };

  // Hourly Rates
  const addCustomStation = () => {
    if (newCustomStation.type.trim() && newCustomStation.rate > 0) {
      setConfig((prev) => ({
        ...prev,
        hourlyRates: { ...prev.hourlyRates, [newCustomStation.type]: newCustomStation.rate },
      }));
      toast.success(`Station type "${newCustomStation.type}" added`);
      setNewCustomStation({ type: '', rate: 100 });
    } else {
      toast.error("Please enter a valid station type and rate");
    }
  };

  const removeStationType = (stationType: string) => {
    if (['PC', 'PS5', 'PS4'].includes(stationType)) return;
    setConfig((prev) => {
      const { [stationType]: removed, ...rest } = prev.hourlyRates;
      return { ...prev, hourlyRates: rest };
    });
  };

  // Time Options
  const addTimeOption = () => {
    const minutes = parseInt(newTimeOption);
    if (minutes > 0 && !config.timeOptions.includes(minutes)) {
      setConfig(prev => ({ ...prev, timeOptions: [...prev.timeOptions, minutes].sort((a, b) => a - b) }));
      setNewTimeOption('');
    }
  };

  const removeTimeOption = (minutes: number) => {
    setConfig(prev => ({ ...prev, timeOptions: prev.timeOptions.filter(t => t !== minutes) }));
  };

  // Happy Hours
  const addHappyHour = () => {
    if (!newHappyHour.startTime || !newHappyHour.endTime || !newHappyHour.rate) {
      toast.error("Please fill in all happy hour fields");
      return;
    }
    if (newHappyHour.days.length === 0) {
      toast.error("Please select at least one day for Happy Hour");
      return;
    }
    setConfig(prev => ({
      ...prev,
      happyHours: [...prev.happyHours, { ...newHappyHour, enabled: true }],
    }));
    toast.success(`Happy Hour ${newHappyHour.startTime} - ${newHappyHour.endTime} created`);
    setNewHappyHour({ startTime: "14:00", endTime: "18:00", rate: 80, days: [] });
  };

  const removeHappyHour = (index: number) => {
    setConfig(prev => ({ ...prev, happyHours: prev.happyHours.filter((_, i) => i !== index) }));
  };

  // Custom Packs
  const addCustomPack = () => {
    if (!newCustomPack.name.trim()) {
      toast.error("Pack name is required");
      return;
    }
    setConfig(prev => ({
      ...prev,
      customPacks: [...prev.customPacks, { ...newCustomPack, id: `pack-${Date.now()}` }],
    }));
    toast.success(`Custom Pack "${newCustomPack.name}" created`);
    setNewCustomPack({
      name: '',
      duration: 60,
      price: 100,
      description: '',
      validStationTypes: Object.keys(config.hourlyRates),
      enabled: true,
    });
  };

  const removeCustomPack = (id: string) => {
    setConfig(prev => ({
      ...prev,
      customPacks: prev.customPacks.filter(p => p.id !== id),
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
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

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="rates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-muted rounded-lg">
            <TabsTrigger value="rates" className="flex items-center justify-center data-[state=active]:bg-background">
              <DollarSign className="w-4 h-4 mr-2" /> Rates / Station
            </TabsTrigger>
            <TabsTrigger value="happy" className="flex items-center justify-center data-[state=active]:bg-background">
              <Sparkles className="w-4 h-4 mr-2" /> Happy Hours
            </TabsTrigger>
            <TabsTrigger value="packs" className="flex items-center justify-center data-[state=active]:bg-background">
              <Package className="w-4 h-4 mr-2" /> Packs
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex items-center justify-center data-[state=active]:bg-background">
              <Palette className="w-4 h-4 mr-2" /> Theme
            </TabsTrigger>
          </TabsList>

          {/* Rates Tab */}
          <TabsContent value="rates">
            <Card className="p-6 space-y-4">
              {Object.entries(config.hourlyRates).map(([type, rate]) => (
                <div key={type} className="flex justify-between items-center p-4 border border-border rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <Label>{type} Station</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        value={rate}
                        className="pl-8"
                        onChange={e =>
                          setConfig(prev => ({
                            ...prev,
                            hourlyRates: { ...prev.hourlyRates, [type]: parseFloat(e.target.value) || 0 },
                          }))
                        }
                      />
                    </div>
                  </div>
                  {!['PC', 'PS5', 'PS4'].includes(type) && (
                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => removeStationType(type)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border-t border-border pt-4">
                <Input
                  value={newCustomStation.type}
                  placeholder="Station Type (VR/XBOX)"
                  onChange={e => setNewCustomStation(prev => ({ ...prev, type: e.target.value }))}
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    value={newCustomStation.rate}
                    className="pl-8"
                    onChange={e => setNewCustomStation(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <Button className="col-span-2 mt-2" onClick={addCustomStation}>
                  <Plus className="w-4 h-4 mr-2" /> Add New Station
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Time Options Tab */}
          <TabsContent value="time">
            <Card className="p-6 space-y-4">
              <div className="flex gap-2">
                <Input type="number" value={newTimeOption} onChange={e => setNewTimeOption(e.target.value)} placeholder="Minutes" />
                <Button onClick={addTimeOption}><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {config.timeOptions.map(t => (
                  <Badge key={t} variant="secondary" className="cursor-pointer" onClick={() => removeTimeOption(t)}>
                    {t}m <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Happy Hours Tab */}
          <TabsContent value="happy">
            <Card className="p-6 space-y-4">
              {config.happyHours.map((hh, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 border border-border rounded-lg bg-muted/50">
                  <div>
                    <p>{hh.startTime} - {hh.endTime} | ₹{hh.rate}/hr</p>
                    <p className="text-xs text-muted-foreground capitalize">{hh.days.join(', ')}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => removeHappyHour(idx)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="border-t border-border pt-4 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={newHappyHour.startTime}
                      onChange={e => setNewHappyHour(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={newHappyHour.endTime}
                      onChange={e => setNewHappyHour(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Rate per Hour (₹)</Label>
                  <Input
                    type="number"
                    value={newHappyHour.rate}
                    onChange={(e) =>
                      setNewHappyHour(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))
                    }
                    placeholder="Rate per hour"
                  />
                </div>

                <div>
                  <Label>Applicable Days</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {weekDays.map(day => (
                      <Badge
                        key={day}
                        variant={newHappyHour.days.includes(day) ? 'default' : 'secondary'}
                        className="cursor-pointer capitalize"
                        onClick={() =>
                          setNewHappyHour(prev => ({
                            ...prev,
                            days: prev.days.includes(day)
                              ? prev.days.filter(d => d !== day)
                              : [...prev.days, day],
                          }))
                        }
                      >
                        {day.slice(0, 3)}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button onClick={addHappyHour} className="w-full mt-2">
                  <Plus className="w-4 h-4 mr-2" /> Add Happy Hour
                </Button>
              </div>
            </Card>
          </TabsContent>
          {/* Custom Packs Tab */}
          <TabsContent value="packs">
            <Card className="p-6 space-y-4">
              {config.customPacks.map(pack => (
                <div
                  key={pack.id}
                  className="flex justify-between items-center p-4 border border-border rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {pack.name} — {pack.duration} mins @ ₹{pack.price}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pack.description || 'No description'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Valid on: {pack.validStationTypes.join(', ')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => removeCustomPack(pack.id!)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {/* Add New Pack Form */}
              <div className="border-t border-border pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Pack Name</Label>
                    <Input
                      value={newCustomPack.name}
                      onChange={e =>
                        setNewCustomPack(prev => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Enter pack name"
                    />
                  </div>
                  <div>
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={newCustomPack.duration}
                      onChange={e =>
                        setNewCustomPack(prev => ({
                          ...prev,
                          duration: parseInt(e.target.value) || 0,
                        }))
                      }
                      placeholder="e.g., 60"
                    />
                  </div>
                  <div>
                    <Label>Price (₹)</Label>
                    <Input
                      type="number"
                      value={newCustomPack.price}
                      onChange={e =>
                        setNewCustomPack(prev => ({
                          ...prev,
                          price: parseInt(e.target.value) || 0,
                        }))
                      }
                      placeholder="e.g., 200"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={newCustomPack.description}
                      onChange={e =>
                        setNewCustomPack(prev => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Optional description"
                    />
                  </div>
                </div>

                <div>
                  <Label>Valid Stations</Label>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {Object.keys(config.hourlyRates).map(station => (
                      <label key={station} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={newCustomPack.validStationTypes.includes(station)}
                          onChange={e =>
                            setNewCustomPack(prev => ({
                              ...prev,
                              validStationTypes: e.target.checked
                                ? [...prev.validStationTypes, station]
                                : prev.validStationTypes.filter(s => s !== station),
                            }))
                          }
                        />
                        {station}
                      </label>
                    ))}
                  </div>
                </div>

                <Button onClick={addCustomPack} className="w-full">
                  <Plus className="w-4 h-4 mr-2" /> Add New Pack
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Theme Tab */}
          <TabsContent value="theme">
            <Card className="p-6 space-y-6">
              <div>
                <Label>Cafe Name</Label>
                <Input
                  value={cafeName}
                  onChange={e => setCafeName(e.target.value)}
                  placeholder="Enter cafe name"
                />
                <p className="text-xs text-muted-foreground">
                  Display name for your gaming center
                </p>
              </div>

              <div>
                <Label>Theme Color</Label>
                <ColorPicker
                  color={currentThemeColor}
                  onColorChange={setCurrentThemeColor}
                />
                <p className="text-xs text-muted-foreground">
                  Pick a custom color or use presets (applied on Save)
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SystemSettings;
