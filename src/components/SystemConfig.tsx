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
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SystemConfigProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: SystemConfiguration) => void;
  currentConfig: SystemConfiguration;
}

export interface SystemConfiguration {
  hourlyRates: {
    PC: number;
    PS5: number;
    PS4: number;
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

const SystemConfig: React.FC<SystemConfigProps> = ({
  isOpen,
  onClose,
  onSave,
  currentConfig
}) => {
  const [config, setConfig] = useState<SystemConfiguration>(currentConfig);
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

  const handleSave = () => {
    onSave(config);
    onClose();
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="card-gaming max-w-4xl w-full max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4 border-b border-primary/20">
          <DialogTitle className="font-gaming text-xl text-primary flex items-center">
            <Settings className="w-6 h-6 mr-2" />
            SYSTEM CONFIGURATION
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <Tabs defaultValue="rates" className="p-6">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="rates" className="font-gaming text-xs">RATES</TabsTrigger>
              <TabsTrigger value="time" className="font-gaming text-xs">TIME</TabsTrigger>
              <TabsTrigger value="night" className="font-gaming text-xs">NIGHT</TabsTrigger>
              <TabsTrigger value="happy" className="font-gaming text-xs">HAPPY HR</TabsTrigger>
              <TabsTrigger value="packs" className="font-gaming text-xs">PACKS</TabsTrigger>
            </TabsList>

            {/* Hourly Rates */}
            <TabsContent value="rates" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(config.hourlyRates).map(([type, rate]) => (
                  <Card key={type} className="card-gaming p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-gaming text-primary">{type} HOURLY RATE</Label>
                      <DollarSign className="w-4 h-4 text-accent" />
                    </div>
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
                        className="pl-8 font-gaming"
                        placeholder="0.00"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Time Options */}
            <TabsContent value="time" className="space-y-4">
              <Card className="card-gaming p-4">
                <div className="flex items-center justify-between mb-4">
                  <Label className="font-gaming text-primary">TIME OPTIONS (MINUTES)</Label>
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
                  {config.timeOptions.map(minutes => (
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
            </TabsContent>

            {/* Night Pass */}
            <TabsContent value="night" className="space-y-4">
              <Card className="card-gaming p-4">
                <div className="flex items-center justify-between mb-4">
                  <Label className="font-gaming text-primary">NIGHT PASS CONFIGURATION</Label>
                  <Moon className="w-4 h-4 text-accent" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.nightPass.enabled}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        nightPass: { ...prev.nightPass, enabled: e.target.checked }
                      }))}
                      className="rounded border-primary/30"
                    />
                    <Label className="font-gaming text-sm">Enable Night Pass</Label>
                  </div>

                  {config.nightPass.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="font-gaming text-sm">Start Time</Label>
                        <Input
                          type="time"
                          value={config.nightPass.startTime}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            nightPass: { ...prev.nightPass, startTime: e.target.value }
                          }))}
                          className="font-gaming"
                        />
                      </div>
                      <div>
                        <Label className="font-gaming text-sm">End Time</Label>
                        <Input
                          type="time"
                          value={config.nightPass.endTime}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            nightPass: { ...prev.nightPass, endTime: e.target.value }
                          }))}
                          className="font-gaming"
                        />
                      </div>
                      <div>
                        <Label className="font-gaming text-sm">Hourly Rate (₹)</Label>
                        <Input
                          type="number"
                          value={config.nightPass.rate}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            nightPass: { ...prev.nightPass, rate: parseFloat(e.target.value) || 0 }
                          }))}
                          className="font-gaming"
                        />
                      </div>
                      <div>
                        <Label className="font-gaming text-sm">Fixed Price (₹) - Optional</Label>
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
                          className="font-gaming"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* Happy Hours */}
            <TabsContent value="happy" className="space-y-4">
              <Card className="card-gaming p-4">
                <div className="flex items-center justify-between mb-4">
                  <Label className="font-gaming text-primary">HAPPY HOURS</Label>
                  <Sparkles className="w-4 h-4 text-accent" />
                </div>

                <div className="space-y-4">
                  {config.happyHours.map((happyHour, index) => (
                    <div key={index} className="p-3 border border-primary/20 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-gaming text-sm text-primary">
                          {happyHour.startTime} - {happyHour.endTime} ({happyHour.discountPercent}% OFF)
                        </span>
                        <Button
                          onClick={() => removeHappyHour(index)}
                          variant="ghost"
                          size="sm"
                          className="text-error hover:bg-error/10 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground font-gaming">
                        Days: {happyHour.days.join(', ')}
                      </div>
                    </div>
                  ))}

                  <div className="border-t border-primary/20 pt-4">
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <Input
                        type="time"
                        value={newHappyHour.startTime}
                        onChange={(e) => setNewHappyHour(prev => ({ ...prev, startTime: e.target.value }))}
                        className="font-gaming text-xs"
                      />
                      <Input
                        type="time"
                        value={newHappyHour.endTime}
                        onChange={(e) => setNewHappyHour(prev => ({ ...prev, endTime: e.target.value }))}
                        className="font-gaming text-xs"
                      />
                      <Input
                        type="number"
                        value={newHappyHour.discountPercent}
                        onChange={(e) => setNewHappyHour(prev => ({ ...prev, discountPercent: parseInt(e.target.value) || 0 }))}
                        placeholder="Discount %"
                        className="font-gaming text-xs"
                      />
                    </div>
                    <Button onClick={addHappyHour} className="btn-gaming w-full text-xs">
                      <Plus className="w-3 h-3 mr-1" />
                      ADD HAPPY HOUR
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Custom Packs */}
            <TabsContent value="packs" className="space-y-4">
              <Card className="card-gaming p-4">
                <div className="flex items-center justify-between mb-4">
                  <Label className="font-gaming text-primary">CUSTOM PACKS</Label>
                  <Package className="w-4 h-4 text-accent" />
                </div>

                <div className="space-y-4">
                  {config.customPacks.map(pack => (
                    <div key={pack.id} className="p-3 border border-primary/20 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-gaming text-sm text-primary">{pack.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {pack.duration}min - ₹{pack.price} - {pack.validStationTypes.join(', ')}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">{pack.description}</div>
                        </div>
                        <Button
                          onClick={() => removeCustomPack(pack.id)}
                          variant="ghost"
                          size="sm"
                          className="text-error hover:bg-error/10 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="border-t border-primary/20 pt-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={newCustomPack.name}
                        onChange={(e) => setNewCustomPack(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Pack Name"
                        className="font-gaming text-xs"
                      />
                      <Input
                        type="number"
                        value={newCustomPack.duration}
                        onChange={(e) => setNewCustomPack(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                        placeholder="Duration (min)"
                        className="font-gaming text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        value={newCustomPack.price}
                        onChange={(e) => setNewCustomPack(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                        placeholder="Price (₹)"
                        className="font-gaming text-xs"
                      />
                      <Input
                        value={newCustomPack.description}
                        onChange={(e) => setNewCustomPack(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Description"
                        className="font-gaming text-xs"
                      />
                    </div>
                    <Button onClick={addCustomPack} className="btn-gaming w-full text-xs">
                      <Plus className="w-3 h-3 mr-1" />
                      ADD CUSTOM PACK
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-6 border-t border-primary/20 flex justify-end space-x-2">
          <Button onClick={onClose} variant="ghost" className="font-gaming">
            CANCEL
          </Button>
          <Button onClick={handleSave} className="btn-gaming">
            <Save className="w-4 h-4 mr-2" />
            SAVE CONFIGURATION
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SystemConfig;