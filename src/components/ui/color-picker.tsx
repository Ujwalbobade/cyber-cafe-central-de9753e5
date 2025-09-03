import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, X } from 'lucide-react';

interface ColorPickerProps {
  onColorChange: (color: { r: number; g: number; b: number }) => void;
  initialColor?: { r: number; g: number; b: number };
}

const ColorPicker: React.FC<ColorPickerProps> = ({ onColorChange, initialColor = { r: 0, g: 234, b: 255 } }) => {
  const [color, setColor] = useState(initialColor);
  const [isOpen, setIsOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

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

  const updateColor = (newColor: { r: number; g: number; b: number }) => {
    setColor(newColor);
    onColorChange(newColor);
    localStorage.setItem('theme-color', JSON.stringify(newColor));
  };

  const handleColorChange = (component: 'r' | 'g' | 'b', value: string) => {
    const numValue = Math.max(0, Math.min(255, parseInt(value) || 0));
    const newColor = { ...color, [component]: numValue };
    updateColor(newColor);
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
      updateColor(rgb);
    }
  };

  const handleNativeColorChange = (hex: string) => {
    handleHexChange(hex);
  };

  const presetColors = [
    { r: 0, g: 234, b: 255, name: 'Cyber Blue' },
    { r: 147, g: 51, b: 234, name: 'Electric Purple' },
    { r: 0, g: 255, b: 127, name: 'Neon Green' },
    { r: 255, g: 20, b: 147, name: 'Hot Pink' },
    { r: 255, g: 165, b: 0, name: 'Cyber Orange' },
    { r: 255, g: 0, b: 0, name: 'Laser Red' },
    { r: 255, g: 255, b: 0, name: 'Electric Yellow' },
    { r: 128, g: 0, b: 255, name: 'Deep Purple' },
    { r: 0, g: 255, b: 255, name: 'Aqua' },
  ];

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 font-gaming hover:shadow-glow-primary transition-all duration-300"
      >
        <Palette className="w-4 h-4" />
        Theme Color
        <div 
          className="w-5 h-5 rounded-full border-2 border-border shadow-sm" 
          style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }} 
        />
      </Button>

      {isOpen && (
        <Card 
          ref={cardRef}
          className="absolute top-12 right-0 z-50 p-6 w-96 card-gaming shadow-2xl border-2 border-primary/20"
        >
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-gaming text-foreground">Choose Theme Color</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Large Color Preview */}
            <div 
              className="w-full h-20 rounded-xl border-2 border-primary/20 shadow-glow-primary transition-all duration-300"
              style={{ 
                backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
                boxShadow: `0 0 30px rgb(${color.r}, ${color.g}, ${color.b}, 0.3)`
              }}
            />

            {/* Native Color Picker */}
            <div className="space-y-2">
              <Label className="text-sm font-gaming text-muted-foreground">Color Wheel</Label>
              <input
                type="color"
                value={rgbToHex(color.r, color.g, color.b)}
                onChange={(e) => handleNativeColorChange(e.target.value)}
                className="w-full h-12 rounded-lg border-2 border-border cursor-pointer bg-transparent"
                style={{ colorScheme: 'dark' }}
              />
            </div>

            {/* Preset Colors */}
            <div className="space-y-3">
              <Label className="text-sm font-gaming text-muted-foreground">Quick Presets</Label>
              <div className="grid grid-cols-3 gap-3">
                {presetColors.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => updateColor(preset)}
                    className="group flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/50 transition-all duration-200 hover:shadow-glow-primary"
                    title={preset.name}
                  >
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-background shadow-lg group-hover:scale-110 transition-transform duration-200" 
                      style={{ 
                        backgroundColor: `rgb(${preset.r}, ${preset.g}, ${preset.b})`,
                        boxShadow: `0 4px 15px rgb(${preset.r}, ${preset.g}, ${preset.b}, 0.4)`
                      }} 
                    />
                    <span className="text-xs font-gaming text-center text-muted-foreground group-hover:text-foreground transition-colors">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Controls */}
            <details className="space-y-3">
              <summary className="text-sm font-gaming text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                Advanced RGB & HEX Controls
              </summary>
              
              {/* RGB Sliders */}
              <div className="space-y-3 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="red" className="text-xs font-gaming text-destructive">Red</Label>
                    <span className="text-xs text-muted-foreground">{color.r}</span>
                  </div>
                  <input
                    id="red"
                    type="range"
                    min="0"
                    max="255"
                    value={color.r}
                    onChange={(e) => handleColorChange('r', e.target.value)}
                    className="w-full h-2 bg-gradient-to-r from-black to-red-500 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="green" className="text-xs font-gaming text-accent">Green</Label>
                    <span className="text-xs text-muted-foreground">{color.g}</span>
                  </div>
                  <input
                    id="green"
                    type="range"
                    min="0"
                    max="255"
                    value={color.g}
                    onChange={(e) => handleColorChange('g', e.target.value)}
                    className="w-full h-2 bg-gradient-to-r from-black to-green-500 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="blue" className="text-xs font-gaming text-primary">Blue</Label>
                    <span className="text-xs text-muted-foreground">{color.b}</span>
                  </div>
                  <input
                    id="blue"
                    type="range"
                    min="0"
                    max="255"
                    value={color.b}
                    onChange={(e) => handleColorChange('b', e.target.value)}
                    className="w-full h-2 bg-gradient-to-r from-black to-blue-500 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Hex Input */}
                <div className="space-y-2">
                  <Label htmlFor="hex" className="text-xs font-gaming text-muted-foreground">HEX Value</Label>
                  <Input
                    id="hex"
                    type="text"
                    value={rgbToHex(color.r, color.g, color.b)}
                    onChange={(e) => handleHexChange(e.target.value)}
                    className="h-10 font-mono text-center"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </details>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ColorPicker;