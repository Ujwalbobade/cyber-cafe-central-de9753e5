// Theme generation utilities for single-color theme system

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

// Convert RGB to HSL
export const rgbToHsl = (r: number, g: number, b: number): HSL => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};

// Convert HSL to CSS HSL format
export const hslToCss = (hsl: HSL): string => {
  return `${hsl.h} ${hsl.s}% ${hsl.l}%`;
};

// Generate theme colors from a single base color
export const generateThemeColors = (baseColor: RGB) => {
  const baseHsl = rgbToHsl(baseColor.r, baseColor.g, baseColor.b);
  
  // Generate variations
  const primary = baseHsl;
  const primaryGlow = { ...baseHsl, l: Math.min(80, baseHsl.l + 15) };
  
  // Secondary: Complementary color (opposite on color wheel)
  const secondary = { 
    h: (baseHsl.h + 180) % 360, 
    s: Math.max(60, baseHsl.s), 
    l: Math.min(70, Math.max(40, baseHsl.l)) 
  };
  const secondaryGlow = { ...secondary, l: Math.min(85, secondary.l + 15) };
  
  // Accent: Triadic color (120 degrees offset)
  const accent = { 
    h: (baseHsl.h + 120) % 360, 
    s: Math.max(70, baseHsl.s), 
    l: Math.min(65, Math.max(45, baseHsl.l)) 
  };
  const accentGlow = { ...accent, l: Math.min(80, accent.l + 15) };

  return {
    primary: hslToCss(primary),
    primaryGlow: hslToCss(primaryGlow),
    secondary: hslToCss(secondary),
    secondaryGlow: hslToCss(secondaryGlow),
    accent: hslToCss(accent),
    accentGlow: hslToCss(accentGlow),
  };
};

// Apply theme colors to CSS custom properties
export const applyThemeColors = (colors: ReturnType<typeof generateThemeColors>) => {
  const root = document.documentElement;
  
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--primary-glow', colors.primaryGlow);
  root.style.setProperty('--secondary', colors.secondary);
  root.style.setProperty('--secondary-glow', colors.secondaryGlow);
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--accent-glow', colors.accentGlow);
  
  // Update ring color to match primary
  root.style.setProperty('--ring', colors.primary);
  
  // Update gradients
  root.style.setProperty('--gradient-primary', `linear-gradient(135deg, hsl(${colors.primary}) 0%, hsl(${colors.primaryGlow}) 100%)`);
  root.style.setProperty('--gradient-secondary', `linear-gradient(135deg, hsl(${colors.secondary}) 0%, hsl(${colors.secondaryGlow}) 100%)`);
  root.style.setProperty('--gradient-gaming', `linear-gradient(135deg, hsl(${colors.primary}) 0%, hsl(${colors.secondary}) 50%, hsl(${colors.accent}) 100%)`);
  
  // Update shadows
  root.style.setProperty('--shadow-gaming', `0 0 30px hsl(${colors.primary} / 0.3)`);
  root.style.setProperty('--shadow-glow-primary', `0 0 20px hsl(${colors.primary} / 0.5)`);
  root.style.setProperty('--shadow-glow-secondary', `0 0 20px hsl(${colors.secondary} / 0.5)`);
  root.style.setProperty('--shadow-glow-accent', `0 0 20px hsl(${colors.accent} / 0.5)`);
};