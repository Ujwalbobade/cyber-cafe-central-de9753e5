import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette } from 'lucide-react';

interface ColorPickerProps {
  onColorChange: (color: { r: number; g: number; b: number }) => void;
  initialColor?: { r: number; g: number; b: number };
}

const ColorPicker: React.FC<ColorPickerProps> = ({ onColorChange, initialColor = { r: 0, g: 234, b: 255 } }) => {
  const [color, setColor] = useState(initialColor);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedColor = localStorage.getItem('theme-color');
    if (savedColor) {
      try {
        const parsed = JSON.parse(savedColor);
        setColor(parsed);
        onColorChange(parsed);
      } catch (error) {
        console.error('Failed to parse saved color:', error);
      }
    }
  }, [onColorChange]);

  const handleColorChange = (component: 'r' | 'g' | 'b', value: string) => {
    const numValue = Math.max(0, Math.min(255, parseInt(value) || 0));
    const newColor = { ...color, [component]: numValue };
    setColor(newColor);
    onColorChange(newColor);
    localStorage.setItem('theme-color', JSON.stringify(newColor));
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const handleHexChange = (hex: string) => {
    const rgb = hexToRgb(hex);
    if (rgb) {
      setColor(rgb);
      onColorChange(rgb);
      localStorage.setItem('theme-color', JSON.stringify(rgb));
    }
  };

  const presetColors = [
    { r: 0, g: 234, b: 255, name: 'Cyber Blue' },
    { r: 147, g: 51, b: 234, name: 'Electric Purple' },
    { r: 0, g: 255, b: 127, name: 'Neon Green' },
    { r: 255, g: 20, b: 147, name: 'Hot Pink' },
    { r: 255, g: 165, b: 0, name: 'Cyber Orange' },
    { r: 255, g: 0, b: 0, name: 'Laser Red' },
  ];

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 font-gaming"
      >
        <Palette className="w-4 h-4" />
        Theme Color
        <div 
          className="w-4 h-4 rounded border border-border" 
          style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }} 
        />
      </Button>

      {isOpen && (
        <Card className="absolute top-12 right-0 z-50 p-4 w-80 card-gaming">
          <div className="space-y-4">
            <div className="text-sm font-gaming text-foreground">Theme Color Picker</div>
            
            {/* Color Preview */}
            <div 
              className="w-full h-16 rounded-lg border border-primary/20 shadow-glow-primary"
              style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
            />

            {/* RGB Inputs */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="red" className="text-xs font-gaming text-error">R</Label>
                <Input
                  id="red"
                  type="number"
                  min="0"
                  max="255"
                  value={color.r}
                  onChange={(e) => handleColorChange('r', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="green" className="text-xs font-gaming text-accent">G</Label>
                <Input
                  id="green"
                  type="number"
                  min="0"
                  max="255"
                  value={color.g}
                  onChange={(e) => handleColorChange('g', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="blue" className="text-xs font-gaming text-primary">B</Label>
                <Input
                  id="blue"
                  type="number"
                  min="0"
                  max="255"
                  value={color.b}
                  onChange={(e) => handleColorChange('b', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Hex Input */}
            <div>
              <Label htmlFor="hex" className="text-xs font-gaming text-muted-foreground">HEX</Label>
              <Input
                id="hex"
                type="text"
                value={rgbToHex(color.r, color.g, color.b)}
                onChange={(e) => handleHexChange(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>

            {/* Preset Colors */}
            <div>
              <Label className="text-xs font-gaming text-muted-foreground">Presets</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {presetColors.map((preset, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setColor(preset);
                      onColorChange(preset);
                      localStorage.setItem('theme-color', JSON.stringify(preset));
                    }}
                    className="h-8 p-1 flex items-center gap-1"
                    title={preset.name}
                  >
                    <div 
                      className="w-4 h-4 rounded border border-border" 
                      style={{ backgroundColor: `rgb(${preset.r}, ${preset.g}, ${preset.b})` }} 
                    />
                    <span className="text-xs truncate">{preset.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="w-full font-gaming"
            >
              Close
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ColorPicker;