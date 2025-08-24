import React, { useState, useEffect } from "react";
import {
  Settings,
  Clock,
  DollarSign,
  Plus,
  X,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSystemConfig, saveSystemConfig } from "@/services/apis/api"; // 👈 add API functions

export interface SystemConfigurationData {
  hourlyRates: {
    PC: number;
    PS5: number;
    PS4: number;
  };
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
    discountPercent: number;
    days: string[];
  }[];
  customPacks: {
    id: string;
    name: string;
    duration: number;
    price: number;
    description: string;
    validStationTypes: ("PC" | "PS5" | "PS4")[];
  }[];
  theme: string;
  cafeName: string;
}

const SystemConfiguration: React.FC = () => {
  const [config, setConfig] = useState<SystemConfigurationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTimeOption, setNewTimeOption] = useState("");

  // Load config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await getSystemConfig();
        setConfig(data);
      } catch (err: any) {
        setError("Failed to load configuration");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await saveSystemConfig(config);
      alert("✅ Configuration saved!");
    } catch (err) {
      alert("❌ Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  // Save a specific section (still sends full config to API)
  const handleSaveSection = async (sectionName?: string) => {
    if (!config) return;
    setSaving(true);
    try {
      await saveSystemConfig(config);
      if (sectionName) {
        alert(`✅ ${sectionName.toUpperCase()} saved!`);
      } else {
        alert("✅ Configuration saved!");
      }
    } catch (err) {
      alert("❌ Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const addTimeOption = () => {
    if (!config) return;
    const minutes = parseInt(newTimeOption);
    if (minutes > 0 && !config.timeOptions.includes(minutes)) {
      setConfig((prev) =>
        prev
          ? {
              ...prev,
              timeOptions: [...prev.timeOptions, minutes].sort((a, b) => a - b),
            }
          : prev
      );
      setNewTimeOption("");
    }
  };

  const removeTimeOption = (minutes: number) => {
    if (!config) return;
    setConfig((prev) =>
      prev
        ? { ...prev, timeOptions: prev.timeOptions.filter((t) => t !== minutes) }
        : prev
    );
  };

  if (loading) return <p className="text-center">⏳ Loading config...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!config) return null;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center mb-4">
        <Settings className="w-6 h-6 mr-2 text-primary" />
        <h1 className="text-2xl font-gaming text-primary">
          SYSTEM CONFIGURATION
        </h1>
      </div>

      {/* Cafe Name + Theme */}
      <Card className="card-gaming p-4">
        <Label className="font-gaming text-primary mb-2 block">
          CAFE NAME
        </Label>
        <Input
          type="text"
          value={config.cafeName}
          onChange={(e) =>
            setConfig({ ...config, cafeName: e.target.value })
          }
          className="font-gaming mb-4"
        />

        <Label className="font-gaming text-primary mb-2 block">THEME</Label>
        <Input
          type="text"
          value={config.theme}
          onChange={(e) => setConfig({ ...config, theme: e.target.value })}
          className="font-gaming"
        />
      </Card>

      <Tabs defaultValue="rates" className="space-y-4">
        <div className="md:flex md:items-start md:space-x-6">
          <TabsList className="mb-6 md:mb-0 md:w-56 md:flex md:flex-col grid grid-cols-5 gap-2">
            <TabsTrigger value="rates" className="font-gaming text-xs text-center md:text-left py-2">
              RATES
            </TabsTrigger>
            <TabsTrigger value="time" className="font-gaming text-xs text-center md:text-left py-2">
              TIME
            </TabsTrigger>
            <TabsTrigger value="night" className="font-gaming text-xs text-center md:text-left py-2">
              NIGHT
            </TabsTrigger>
            <TabsTrigger value="happy" className="font-gaming text-xs text-center md:text-left py-2">
              HAPPY HR
            </TabsTrigger>
            <TabsTrigger value="packs" className="font-gaming text-xs text-center md:text-left py-2">
              PACKS
            </TabsTrigger>
          </TabsList>

          <div className="md:flex-1">

            {/* Hourly Rates */}
            <TabsContent value="rates" className="space-y-4">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-gaming font-semibold">Hourly Rates</h3>
                <Button onClick={() => handleSaveSection('rates')} disabled={saving} className="btn-gaming">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'SAVING...' : 'SAVE RATES'}
                </Button>
              </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(config.hourlyRates).map(([type, rate]) => (
              <Card key={type} className="card-gaming p-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="font-gaming text-primary">
                    {type} HOURLY RATE
                  </Label>
                  <DollarSign className="w-4 h-4 text-accent" />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    type="number"
                    value={rate}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        hourlyRates: {
                          ...config.hourlyRates,
                          [type]: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="pl-8 font-gaming"
                    placeholder="0.00"
                  />
                </div>
              </Card>
            ))}
          </div>
          <div className="flex justify-end mt-2">
            <Button onClick={() => handleSaveSection('rates')} disabled={saving} className="btn-gaming">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'SAVING...' : 'SAVE RATES'}
            </Button>
          </div>
        </TabsContent>

  {/* Night Pass */}
        <TabsContent value="night" className="space-y-4">
          <Card className="card-gaming p-4">
            <div className="flex items-center justify-between mb-4">
              <Label className="font-gaming text-primary">NIGHT PASS</Label>
              <Clock className="w-4 h-4 text-accent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-gaming">ENABLED</Label>
                <div className="mt-2">
                  <Badge className={config.nightPass.enabled ? 'bg-success/20 text-success' : 'bg-muted'}>
                    {config.nightPass.enabled ? 'ENABLED' : 'DISABLED'}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-gaming">RATE / FIXED PRICE</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="number"
                    value={config.nightPass.rate}
                    onChange={(e) => setConfig({ ...config, nightPass: { ...config.nightPass, rate: parseFloat(e.target.value) || 0 } })}
                    className="font-gaming"
                  />
                  <Input
                    type="number"
                    value={config.nightPass.fixedPrice || 0}
                    onChange={(e) => setConfig({ ...config, nightPass: { ...config.nightPass, fixedPrice: parseFloat(e.target.value) || 0 } })}
                    className="font-gaming"
                  />
                </div>
              </div>
            </div>
          </Card>
          <div className="flex justify-end mt-2">
            <Button onClick={() => handleSaveSection('night pass')} disabled={saving} className="btn-gaming">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'SAVING...' : 'SAVE NIGHT'}
            </Button>
          </div>
        </TabsContent>

  {/* Happy Hours */}
        <TabsContent value="happy" className="space-y-4">
          <Card className="card-gaming p-4">
            <div className="flex items-center justify-between mb-4">
              <Label className="font-gaming text-primary">HAPPY HOURS</Label>
              <Clock className="w-4 h-4 text-accent" />
            </div>
            <div className="space-y-2">
              {config.happyHours.length === 0 && <p className="text-sm text-muted-foreground">No happy hour rules configured.</p>}
              {config.happyHours.map((hh, idx) => (
                <Card key={idx} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-gaming font-semibold">{hh.startTime} — {hh.endTime}</div>
                      <div className="text-xs text-muted-foreground">{hh.days.join(', ')}</div>
                    </div>
                    <Badge className="font-gaming">{hh.discountPercent}%</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
          <div className="flex justify-end mt-2">
            <Button onClick={() => handleSaveSection('happy hours')} disabled={saving} className="btn-gaming">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'SAVING...' : 'SAVE HAPPY HR'}
            </Button>
          </div>
        </TabsContent>

  {/* Packs */}
        <TabsContent value="packs" className="space-y-4">
          <Card className="card-gaming p-4">
            <div className="flex items-center justify-between mb-4">
              <Label className="font-gaming text-primary">CUSTOM PACKS</Label>
              <Plus className="w-4 h-4 text-accent" />
            </div>
            <div className="space-y-3">
              {config.customPacks.length === 0 && <p className="text-sm text-muted-foreground">No custom packs defined.</p>}
              {config.customPacks.map((pack) => (
                <Card key={pack.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-gaming font-semibold">{pack.name}</div>
                      <div className="text-xs text-muted-foreground">{pack.description}</div>
                    </div>
                    <div className="text-sm font-gaming">₹{pack.price} • {pack.duration}m</div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
          <div className="flex justify-end mt-2">
            <Button onClick={() => handleSaveSection('packs')} disabled={saving} className="btn-gaming">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'SAVING...' : 'SAVE PACKS'}
            </Button>
          </div>
        </TabsContent>

  {/* Time Options */}
        <TabsContent value="time" className="space-y-4">
          <Card className="card-gaming p-4">
            <div className="flex items-center justify-between mb-4">
              <Label className="font-gaming text-primary">
                TIME OPTIONS (MINUTES)
              </Label>
              <Clock className="w-4 h-4 text-accent" />
            </div>

            <div className="flex gap-2 mb-4">
              <Input
                type="number"
                value={newTimeOption}
                onChange={(e) => setNewTimeOption(e.target.value)}
                placeholder="Minutes (e.g., 15)"
                className="font-gaming"
              />
              <Button onClick={addTimeOption} className="btn-gaming px-3">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {config.timeOptions.map((minutes) => (
                <Badge
                  key={minutes}
                  className="bg-primary/20 text-primary border border-primary/30 font-gaming cursor-pointer hover:bg-error/20 hover:text-error hover:border-error/30 transition-colors"
                  onClick={() => removeTimeOption(minutes)}
                >
                  {minutes}m
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          </Card>
          <div className="flex justify-end mt-2">
            <Button onClick={() => handleSaveSection('time options')} disabled={saving} className="btn-gaming">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'SAVING...' : 'SAVE TIME'}
            </Button>
          </div>
        </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default SystemConfiguration;