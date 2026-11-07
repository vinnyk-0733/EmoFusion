'use client';

import { useState, useEffect, useCallback } from 'react';
import { THEMES } from '@/types/theme';

const THEME_STORAGE_KEY = 'emotion-ai-theme';

// Convert hex to HSL components string "H S% L%"
function hexToHSL(hex) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Lighten/darken a hex color
function adjustHex(hex, amount) {
  hex = hex.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  r = Math.min(255, Math.max(0, r + amount));
  g = Math.min(255, Math.max(0, g + amount));
  b = Math.min(255, Math.max(0, b + amount));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function isLightColor(hex) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

function applyThemeColors(themeData) {
  if (!themeData?.colors) return;

  const root = document.documentElement;
  const { bg, subBg, text, primary, accent } = themeData.colors;
  const isLight = isLightColor(bg);

  // Toggle .dark class for Tailwind dark: variants
  if (isLight) {
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
  }

  const bgHSL = hexToHSL(bg);
  const subBgHSL = hexToHSL(subBg);
  const textHSL = hexToHSL(text);
  const primaryHSL = hexToHSL(primary);
  const accentHSL = hexToHSL(accent);

  const mutedBg = hexToHSL(adjustHex(bg, isLight ? -10 : 12));
  const mutedFg = hexToHSL(adjustHex(text, isLight ? 60 : -60));
  const borderColor = hexToHSL(adjustHex(bg, isLight ? -15 : 18));
  const inputColor = hexToHSL(adjustHex(bg, isLight ? -8 : 10));

  root.style.setProperty('--background', bgHSL);
  root.style.setProperty('--foreground', textHSL);
  root.style.setProperty('--card', subBgHSL);
  root.style.setProperty('--card-foreground', textHSL);
  root.style.setProperty('--popover', subBgHSL);
  root.style.setProperty('--popover-foreground', textHSL);
  root.style.setProperty('--primary', primaryHSL);
  root.style.setProperty('--primary-foreground', isLightColor(primary) ? hexToHSL(bg) : '0 0% 100%');
  root.style.setProperty('--secondary', hexToHSL(adjustHex(bg, isLight ? -6 : 14)));
  root.style.setProperty('--secondary-foreground', textHSL);
  root.style.setProperty('--muted', mutedBg);
  root.style.setProperty('--muted-foreground', mutedFg);
  root.style.setProperty('--accent', accentHSL);
  root.style.setProperty('--accent-foreground', isLightColor(accent) ? hexToHSL(bg) : '0 0% 100%');
  root.style.setProperty('--destructive', '0 72% 55%');
  root.style.setProperty('--destructive-foreground', '0 0% 100%');
  root.style.setProperty('--border', borderColor);
  root.style.setProperty('--input', inputColor);
  root.style.setProperty('--ring', primaryHSL);

  // Neumorphic Soft Depth Shadows
  if (isLight) {
    root.style.setProperty('--neu-bg', bg);
    root.style.setProperty('--neu-surface', subBg);
    root.style.setProperty('--neu-flat', '10px 10px 22px rgba(166, 180, 200, 0.45), -10px -10px 22px rgba(255, 255, 255, 0.95)');
    root.style.setProperty('--neu-flat-sm', '5px 5px 12px rgba(166, 180, 200, 0.35), -5px -5px 12px rgba(255, 255, 255, 0.9)');
    root.style.setProperty('--neu-inset', 'inset 4px 4px 8px rgba(166, 180, 200, 0.35), inset -4px -4px 8px rgba(255, 255, 255, 0.95)');
    root.style.setProperty('--neu-inset-sm', 'inset 2px 2px 5px rgba(166, 180, 200, 0.3), inset -2px -2px 5px rgba(255, 255, 255, 0.9)');
    root.style.setProperty('--neu-btn', '6px 6px 14px rgba(166, 180, 200, 0.4), -6px -6px 14px rgba(255, 255, 255, 0.9)');
    root.style.setProperty('--neu-btn-active', 'inset 3px 3px 6px rgba(166, 180, 200, 0.45), inset -3px -3px 6px rgba(255, 255, 255, 0.95)');
    root.style.setProperty('--neu-glow', '0 6px 20px rgba(45, 212, 191, 0.4)');
  } else {
    root.style.setProperty('--neu-bg', bg);
    root.style.setProperty('--neu-surface', subBg);
    root.style.setProperty('--neu-flat', '10px 10px 24px rgba(8, 10, 16, 0.75), -8px -8px 20px rgba(38, 48, 68, 0.35)');
    root.style.setProperty('--neu-flat-sm', '5px 5px 12px rgba(8, 10, 16, 0.7), -4px -4px 10px rgba(38, 48, 68, 0.3)');
    root.style.setProperty('--neu-inset', 'inset 4px 4px 8px rgba(8, 10, 16, 0.8), inset -4px -4px 8px rgba(38, 48, 68, 0.3)');
    root.style.setProperty('--neu-inset-sm', 'inset 2px 2px 5px rgba(8, 10, 16, 0.75), inset -2px -2px 5px rgba(38, 48, 68, 0.25)');
    root.style.setProperty('--neu-btn', '6px 6px 14px rgba(8, 10, 16, 0.75), -5px -5px 12px rgba(38, 48, 68, 0.35)');
    root.style.setProperty('--neu-btn-active', 'inset 3px 3px 6px rgba(8, 10, 16, 0.85), inset -3px -3px 6px rgba(38, 48, 68, 0.3)');
    root.style.setProperty('--neu-glow', '0 6px 24px rgba(45, 212, 191, 0.35)');
  }

  // Card & General Shadows
  root.style.setProperty('--shadow-card', isLight ? '0 4px 16px rgba(0, 0, 0, 0.05)' : '0 4px 16px rgba(0, 0, 0, 0.4)');
  root.style.setProperty('--shadow-glow', isLight ? '0 0 20px rgba(20, 184, 166, 0.25)' : '0 0 20px rgba(45, 212, 191, 0.25)');

  // Gradients
  root.style.setProperty('--gradient-primary', `linear-gradient(135deg, ${primary}, ${accent})`);
  root.style.setProperty('--gradient-accent', `linear-gradient(135deg, ${accent}, ${primary})`);
  root.style.setProperty('--gradient-background', `linear-gradient(180deg, ${bg}, ${subBg})`);
}

export const useTheme = () => {
  const [theme, setThemeState] = useState('emofusion-light');

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const validTheme = THEMES.find(t => t.id === stored) ? stored : 'emofusion-light';
    setThemeState(validTheme);
    applyTheme(validTheme);
  }, []);

  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    root.removeAttribute('data-theme');
    root.removeAttribute('style');

    const themeData = THEMES.find(t => t.id === newTheme) || THEMES[0];
    applyThemeColors(themeData);
  };

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  }, []);

  const toggleLightDark = useCallback(() => {
    setThemeState((current) => {
      const isCurrentlyDark = current === 'emofusion-dark' || current.includes('dark') || current === 'cyber-mint' || current === 'nordic-frost';
      const targetTheme = isCurrentlyDark ? 'emofusion-light' : 'emofusion-dark';
      localStorage.setItem(THEME_STORAGE_KEY, targetTheme);
      applyTheme(targetTheme);
      return targetTheme;
    });
  }, []);

  return { theme, setTheme, toggleLightDark, isDark: theme === 'emofusion-dark' || theme === 'cyber-mint' || theme === 'nordic-frost' };
};
