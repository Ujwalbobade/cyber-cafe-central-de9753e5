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

export interface SystemConfiguration {
  hourlyRates: { [stationType: string]: number };
  timeOptions: number[];
  nightPass: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    rate: number;
    fixedPrice?: number;
  };
  happyHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    rate: number;             // <-- Instead of discountPercent
    days: string[];           // <-- Days of week
  }[];
   customPacks: {
    id: string;
    name: string;
    duration: number;
    price: number;
    description: string;
    validStationTypes: string[]; // 🔥 now dynamic
  }[];
}

const defaultConfig: SystemConfiguration = {
  hourlyRates: { PC: 100, PS5: 150, PS4: 120 },
  timeOptions: [10, 15, 30, 60, 120, 180],
  nightPass: { enabled: false, startTime: '22:00', endTime: '06:00', rate: 80 },
  happyHours: [],
  customPacks: [],
};

const SystemSettings: React.FC = () => {
  const navigate = useNavigate();

  const [config, setConfig] = useState<SystemConfiguration>(defaultConfig);
  const [cafeName, setCafeName] = useState(() => localStorage.getItem('cafe-name') || 'CYBER LOUNGE');
  const [currentTheme, setCurrentTheme] = useState<'cyber-blue' | 'neon-purple'>(
    (localStorage.getItem('gaming-cafe-theme') as 'cyber-blue' | 'neon-purple') || 'cyber-blue'
  );


  const [newTimeOption, setNewTimeOption] = useState('');
 const [newCustomPack, setNewCustomPack] = useState({
  name: '',
  duration: 60,
  price: 100,
  description: '',
  validStationTypes: [] as string[], // 🔥 start empty
});
  const [newHappyHour, setNewHappyHour] = useState({
    startTime: '14:00',
    endTime: '18:00',
    rate: 80,
    days: [] as string[],
  });

  const weekDays = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];
  const [newCustomStation, setNewCustomStation] = useState({ type: '', rate: 100 });



  const [currentThemeColor, setCurrentThemeColor] = useState<{ r: number; g: number; b: number }>({
    r: 0,
    g: 122,
    b: 255,
  });

  const handleSave = () => {
    localStorage.setItem('systemConfig', JSON.stringify(config));
    localStorage.setItem('cafe-name', cafeName);
    localStorage.setItem('gaming-cafe-theme', JSON.stringify(currentThemeColor));
    document.documentElement.style.setProperty(
      '--primary',
      `rgb(${currentThemeColor.r}, ${currentThemeColor.g}, ${currentThemeColor.b})`
    );
    toast.success('System configuration saved successfully!');
  };

  const addTimeOption = () => {
    const minutes = parseInt(newTimeOption);
    if (minutes > 0 && !config.timeOptions.includes(minutes)) {
      setConfig((prev) => ({ ...prev, timeOptions: [...prev.timeOptions, minutes].sort((a, b) => a - b) }));
      setNewTimeOption('');
    }
  };

  const removeTimeOption = (minutes: number) => {
    setConfig((prev) => ({ ...prev, timeOptions: prev.timeOptions.filter((t) => t !== minutes) }));
  };

  const addCustomPack = () => {
    if (newCustomPack.name.trim()) {
      setConfig((prev) => ({
        ...prev,
        customPacks: [...prev.customPacks, { ...newCustomPack, id: `pack-${Date.now()}` }],
      }));
      setNewCustomPack({ name: '', duration: 60, price: 100, description: '', validStationTypes: ['PC', 'PS5', 'PS4'] });
    }
  };

  const removeCustomPack = (packId: string) => {
    setConfig((prev) => ({ ...prev, customPacks: prev.customPacks.filter((p) => p.id !== packId) }));
  };

  const addHappyHour = () => {
    setConfig((prev) => ({ ...prev, happyHours: [...prev.happyHours, { ...newHappyHour, enabled: true }] }));
  };

  const removeHappyHour = (index: number) => {
    setConfig((prev) => ({ ...prev, happyHours: prev.happyHours.filter((_, i) => i !== index) }));
  };

  const addCustomStation = () => {
    if (newCustomStation.type.trim() && newCustomStation.rate > 0) {
      setConfig((prev) => ({
        ...prev,
        hourlyRates: { ...prev.hourlyRates, [newCustomStation.type]: newCustomStation.rate },
      }));
      setNewCustomStation({ type: '', rate: 100 });
    }
  };

  const removeStationType = (stationType: string) => {
    if (['PC', 'PS5', 'PS4'].includes(stationType)) return;
    setConfig((prev) => {
      const { [stationType]: removed, ...rest } = prev.hourlyRates;
      return { ...prev, hourlyRates: rest };
    });
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
                System Configurationc
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

      {/* Main Content */}
     <div className="container mx-auto px-6 py-8">
  <Tabs defaultValue="rates" className="space-y-6">
    {/* Tabs Header */}
    <TabsList className="grid w-full grid-cols-4 bg-muted rounded-lg">
      <TabsTrigger
        value="rates"
        className="flex items-center justify-center data-[state=active]:bg-background"
      >
        <DollarSign className="w-4 h-4 mr-2" />
        Rates / Station
      </TabsTrigger>

      <TabsTrigger
        value="happy"
        className="flex items-center justify-center data-[state=active]:bg-background"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Happy Hours
      </TabsTrigger>

      <TabsTrigger
        value="packs"
        className="flex items-center justify-center data-[state=active]:bg-background"
      >
        <Package className="w-4 h-4 mr-2" />
        Packs
      </TabsTrigger>

      <TabsTrigger
        value="theme"
        className="flex items-center justify-center data-[state=active]:bg-background"
      >
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
                  <div key={type} className="p-4 border border-border rounded-lg bg-muted/50 flex justify-between items-center">
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-foreground">{type} Station</Label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                        <Input
                          type="number"
                          value={rate}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              hourlyRates: { ...prev.hourlyRates, [type]: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="pl-8"
                        />
                      </div>
                    </div>
                    {!['PC', 'PS5', 'PS4'].includes(type) && (
                      <Button onClick={() => removeStationType(type)} variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <div className="border-t border-border pt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    value={newCustomStation.type}
                    onChange={(e) => setNewCustomStation((prev) => ({ ...prev, type: e.target.value }))}
                    placeholder="Station Type (e.g., VR, XBOX)"
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      value={newCustomStation.rate}
                      onChange={(e) => setNewCustomStation((prev) => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                      className="pl-8"
                    />
                  </div>
                  <Button onClick={addCustomStation} className="w-full col-span-2 mt-2">
                    <Plus className="w-4 h-4 mr-2" /> Add New Station Type
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
                  <Input type="number" value={newTimeOption} onChange={(e) => setNewTimeOption(e.target.value)} placeholder="Minutes" className="flex-1" />
                  <Button onClick={addTimeOption} size="sm"><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.timeOptions.map((minutes) => (
                    <Badge key={minutes} variant="secondary" className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground" onClick={() => removeTimeOption(minutes)}>
                      {minutes}m <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>
          {/* Happy Hours */}
          <TabsContent value="happy" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Happy Hours</h3>

              <div className="space-y-4">
                {/* Existing Happy Hours */}
                {config.happyHours.map((hh, idx) => (
                  <div key={idx} className="p-4 border border-border rounded-lg bg-muted/50 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-foreground">
                        {hh.startTime} - {hh.endTime} | ₹{hh.rate}/hr
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {hh.days.length > 0 ? hh.days.join(', ') : 'No days selected'}
                      </p>
                    </div>
                    <Button
                      onClick={() => removeHappyHour(idx)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {/* New Happy Hour Form */}
                <div className="border-t border-border pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={newHappyHour.startTime}
                        onChange={(e) =>
                          setNewHappyHour((prev) => ({ ...prev, startTime: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={newHappyHour.endTime}
                        onChange={(e) =>
                          setNewHappyHour((prev) => ({ ...prev, endTime: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Happy Hour Rate (₹/hr)</Label>
                    <Input
                      type="number"
                      value={newHappyHour.rate}
                      onChange={(e) =>
                        setNewHappyHour((prev) => ({
                          ...prev,
                          rate: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label>Applicable Days</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {weekDays.map((day) => (
                        <Badge
                          key={day}
                          variant={
                            newHappyHour.days.includes(day) ? 'default' : 'secondary'
                          }
                          className="cursor-pointer capitalize"
                          onClick={() =>
                            setNewHappyHour((prev) => ({
                              ...prev,
                              days: prev.days.includes(day)
                                ? prev.days.filter((d) => d !== day)
                                : [...prev.days, day],
                            }))
                          }
                        >
                          {day.slice(0, 3)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setConfig((prev) => ({
                        ...prev,
                        happyHours: [...prev.happyHours, { ...newHappyHour, enabled: true }],
                      }));
                      setNewHappyHour({
                        startTime: '14:00',
                        endTime: '18:00',
                        rate: 80,
                        days: [],
                      });
                    }}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Happy Hour
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
         {/* Custom Packs */}
<TabsContent value="packs" className="space-y-6">
  <Card className="p-6">
    <h3 className="text-lg font-semibold mb-4 text-foreground">Custom Packs</h3>
    <div className="space-y-4">
      {config.customPacks.map((pack) => (
        <div
          key={pack.id}
          className="p-4 border border-border rounded-lg bg-muted/50 flex justify-between items-center"
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
            onClick={() => removeCustomPack(pack.id)}
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}

      {/* Add New Pack */}
      <div className="border-t border-border pt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Pack Name</Label>
            <Input
              value={newCustomPack.name}
              onChange={(e) =>
                setNewCustomPack((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter pack name"
            />
          </div>

          <div>
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              value={newCustomPack.duration}
              onChange={(e) =>
                setNewCustomPack((prev) => ({
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
              onChange={(e) =>
                setNewCustomPack((prev) => ({
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
              onChange={(e) =>
                setNewCustomPack((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Optional description"
            />
          </div>
        </div>

        {/* Station Type Checkboxes */}
        <div>
          <Label>Valid Stations</Label>
          <div className="flex flex-wrap gap-4 mt-2">
            {Object.keys(config.hourlyRates).map((station) => (
              <label key={station} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newCustomPack.validStationTypes.includes(station)}
                  onChange={(e) => {
                    setNewCustomPack((prev) => ({
                      ...prev,
                      validStationTypes: e.target.checked
                        ? [...prev.validStationTypes, station]
                        : prev.validStationTypes.filter((s) => s !== station),
                    }));
                  }}
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
    </div>
  </Card>
</TabsContent>

          {/* Theme Configuration */}
          <TabsContent value="theme" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Theme & Branding</h3>

              <div className="space-y-6">
                {/* Cafe Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Cafe Name</Label>
                  <Input
                    value={cafeName}
                    onChange={(e) => setCafeName(e.target.value)}
                    placeholder="Enter cafe name"
                  />
                  <p className="text-xs text-muted-foreground">
                    Display name for your gaming center
                  </p>
                </div>

                {/* Theme Color */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">Theme Color</Label>
                  <ColorPicker
                    color={currentThemeColor} // keep as object {r, g, b}
                    onColorChange={setCurrentThemeColor} // update object directly
                  />
                  <p className="text-xs text-muted-foreground">
                    Pick a custom color or use presets (applied on Save)
                  </p>
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