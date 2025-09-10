import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Monitor, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Station } from '@/components/Types/Stations';



interface StationModalProps {
  station?: Station; // if provided → edit mode
  onClose: () => void;
  onSave: (station: Station) => void; 
//  onSave: (station: Omit<Station, 'id' | 'isLocked' | 'currentSession'>) => void;
}

const StationModal: React.FC<StationModalProps> = ({ station, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'PC' as 'PC' | 'PS5' | 'PS4',
    hourlyRate: 120,
    ipAddress: '',
    macAddress: '',
    specifications: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});


  // Pre-fill if editing
  useEffect(() => {
  if (station) {
    setFormData({
      name: station.name,
      type: station.type,
      hourlyRate: station.hourlyRate,
      ipAddress: station.ipAddress ?? '',
      macAddress: station.macAddress,
      specifications: station.specifications,
    });
  }
}, [station]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Station name is required';
    }

    if (formData.hourlyRate <= 0) {
      newErrors.hourlyRate = 'Hourly rate must be greater than 0';
    }

    if (!formData.macAddress.trim()) {
      newErrors.macAddress = 'MAC address is required';
    } else if (!/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(formData.macAddress)) {
      newErrors.macAddress = 'Invalid MAC address format (AA:BB:CC:DD:EE:FF)';
    }

    if (!formData.specifications.trim()) {
      newErrors.specifications = 'Specifications are required';
    }

    if (formData.type === 'PC' && formData.ipAddress && !/^(\d{1,3}\.){3}\d{1,3}$/.test(formData.ipAddress)) {
      newErrors.ipAddress = 'Invalid IP address format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  if (validateForm()) {
    const updated: Station = {
      ...station!, // keep existing fields like id, isLocked, etc.
      ...formData,
      status: station?.status ?? "AVAILABLE",
    };

    onSave(updated);
  }
};

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PC':
        return <Monitor className="w-5 h-5" />;
      case 'PS5':
      case 'PS4':
        return <Gamepad2 className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const isEdit = !!station;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse-gaming" />
        <div
          className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/10 rounded-full blur-3xl animate-pulse-gaming"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <Card className="w-full max-w-md card-gaming border-primary/30 relative z-10 animate-slide-in-gaming">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow-primary">
                {isEdit ? (
                  <Save className="w-6 h-6 text-primary-foreground" />
                ) : (
                  <Plus className="w-6 h-6 text-primary-foreground" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-gaming font-bold text-foreground">
                  {isEdit ? 'EDIT RIG' : 'DEPLOY NEW RIG'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isEdit
                    ? 'Modify this gaming station’s details'
                    : 'Add a new gaming station to the network'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-error/10 hover:text-error"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Station Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="font-gaming text-sm tracking-wide">
                RIG DESIGNATION
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-input/50 border-primary/30 focus:border-primary h-11 font-gaming"
                placeholder="e.g., GAMING-RIG-04"
              />
              {errors.name && (
                <p className="text-error text-xs font-gaming">{errors.name}</p>
              )}
            </div>

            {/* Station Type */}
            <div className="space-y-2">
              <Label className="font-gaming text-sm tracking-wide">
                TERMINAL TYPE
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as 'PC' | 'PS5' | 'PS4' })
                }
              >
                <SelectTrigger className="bg-input/50 border-primary/30 focus:border-primary h-11 font-gaming">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(formData.type)}
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/30">
                  <SelectItem value="PC" className="font-gaming">
                    <div className="flex items-center space-x-2">
                      <Monitor className="w-4 h-4" />
                      <span>Gaming PC</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="PS5" className="font-gaming">
                    <div className="flex items-center space-x-2">
                      <Gamepad2 className="w-4 h-4" />
                      <span>PlayStation 5</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="PS4" className="font-gaming">
                    <div className="flex items-center space-x-2">
                      <Gamepad2 className="w-4 h-4" />
                      <span>PlayStation 4</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hourly Rate */}
            <div className="space-y-2">
              <Label htmlFor="rate" className="font-gaming text-sm tracking-wide">
                CREDIT RATE (₹/HR)
              </Label>
              <Input
                id="rate"
                type="number"
                step="10"
                min="0"
                value={formData.hourlyRate}
                onChange={(e) =>
                  setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })
                }
                className="bg-input/50 border-primary/30 focus:border-primary h-11 font-gaming"
              />
              {errors.hourlyRate && (
                <p className="text-error text-xs font-gaming">{errors.hourlyRate}</p>
              )}
            </div>

            {/* MAC Address */}
            <div className="space-y-2">
              <Label htmlFor="mac" className="font-gaming text-sm tracking-wide">
                MAC ADDRESS
              </Label>
              <Input
                id="mac"
                value={formData.macAddress}
                onChange={(e) =>
                  setFormData({ ...formData, macAddress: e.target.value })
                }
                className="bg-input/50 border-primary/30 focus:border-primary h-11 font-mono text-sm"
                placeholder="AA:BB:CC:DD:EE:FF"
              />
              {errors.macAddress && (
                <p className="text-error text-xs font-gaming">{errors.macAddress}</p>
              )}
            </div>

            {/* IP Address (PC only) */}
            {formData.type === 'PC' && (
              <div className="space-y-2">
                <Label htmlFor="ip" className="font-gaming text-sm tracking-wide">
                  NETWORK ADDRESS (OPTIONAL)
                </Label>
                <Input
                  id="ip"
                  value={formData.ipAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, ipAddress: e.target.value })
                  }
                  className="bg-input/50 border-primary/30 focus:border-primary h-11 font-mono text-sm"
                  placeholder="192.168.1.xxx"
                />
                {errors.ipAddress && (
                  <p className="text-error text-xs font-gaming">{errors.ipAddress}</p>
                )}
              </div>
            )}

            {/* Specifications */}
            <div className="space-y-2">
              <Label htmlFor="specifications" className="font-gaming text-sm tracking-wide">
                SPECIFICATIONS
              </Label>

              {/* Predefined options */}
              <Select
                onValueChange={(value) =>
                  setFormData({ ...formData, specifications: value })
                }
              >
                <SelectTrigger className="bg-input/50 border-primary/30 focus:border-primary h-11 font-gaming mb-2">
                  <SelectValue placeholder="Choose a spec template (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/30">
                  <SelectItem
                    value="Intel i5 | 16GB RAM | GTX 1660 | 512GB SSD"
                    className="font-gaming"
                  >
                    Entry-Level Gaming PC
                  </SelectItem>
                  <SelectItem
                    value="Intel i7 | 32GB RAM | RTX 3070 | 1TB NVMe"
                    className="font-gaming"
                  >
                    High-End Gaming PC
                  </SelectItem>
                  <SelectItem
                    value="Ryzen 5 | 16GB RAM | RTX 3060 | 512GB SSD"
                    className="font-gaming"
                  >
                    Balanced Gaming PC
                  </SelectItem>
                  <SelectItem value="PlayStation 5 (Digital Edition)" className="font-gaming">
                    PlayStation 5
                  </SelectItem>
                  <SelectItem value="PlayStation 4 Pro" className="font-gaming">
                    PlayStation 4
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Manual input */}
              <Textarea
                id="specifications"
                value={formData.specifications}
                onChange={(e) =>
                  setFormData({ ...formData, specifications: e.target.value })
                }
                className="bg-input/50 border-primary/30 focus:border-primary font-mono text-sm h-24"
                placeholder="Enter custom specifications if not using a template..."
              />
              {errors.specifications && (
                <p className="text-error text-xs font-gaming">
                  {errors.specifications}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button type="submit" className="flex-1 btn-gaming font-gaming h-11">
                {isEdit ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    SAVE CHANGES
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    DEPLOY RIG
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1 font-gaming h-11"
              >
                ABORT
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default StationModal;