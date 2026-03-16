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

  const bgHSL = hexToHSL(bg);
  const subBgHSL = hexToHSL(subBg);
  const textHSL = hexToHSL(text);
  const primaryHSL = hexToHSL(primary);
  const accentHSL = hexToHSL(accent);

  const mutedBg = hexToHSL(adjustHex(bg, isLight ? -15 : 15));
  const mutedFg = hexToHSL(adjustHex(text, isLight ? 80 : -80));
  const borderColor = hexToHSL(adjustHex(bg, isLight ? -25 : 25));
  const inputColor = hexToHSL(adjustHex(bg, isLight ? -10 : 10));

  root.style.setProperty('--background', bgHSL);
  root.style.setProperty('--foreground', textHSL);
  root.style.setProperty('--card', subBgHSL);
  root.style.setProperty('--card-foreground', textHSL);
  root.style.setProperty('--popover', subBgHSL);
  root.style.setProperty('--popover-foreground', textHSL);
  root.style.setProperty('--primary', primaryHSL);
  root.style.setProperty('--primary-foreground', isLightColor(primary) ? hexToHSL(bg) : '0 0% 100%');
  root.style.setProperty('--secondary', hexToHSL(adjustHex(bg, isLight ? -8 : 20)));
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

  // Gradients
  root.style.setProperty('--gradient-primary', `linear-gradient(135deg, ${primary}, ${accent})`);
  root.style.setProperty('--gradient-accent', `linear-gradient(135deg, ${accent}, ${primary})`);
  root.style.setProperty('--gradient-background', `linear-gradient(180deg, ${bg}, ${subBg})`);

  // Glass
  const glassOpacity = isLight ? '0.8' : '0.6';
  root.style.setProperty('--glass-bg', `${subBgHSL} / ${glassOpacity}`);
  root.style.setProperty('--glass-border', `${textHSL} / 0.1`);

  // Shadows
  root.style.setProperty('--shadow-glow', `0 0 40px hsl(${primaryHSL} / 0.3)`);
  root.style.setProperty('--shadow-neon', `0 0 20px hsl(${primaryHSL} / 0.5), 0 0 40px hsl(${primaryHSL} / 0.3)`);
  root.style.setProperty('--shadow-card', `0 8px 32px hsl(${bgHSL} / 0.5)`);
}

export const useTheme = () => {
  const [theme, setThemeState] = useState('dark-healthcare');

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      setThemeState(stored);
      applyTheme(stored);
    }
  }, []);

  const applyTheme = (newTheme) => {
    const root = document.documentElement;

    // Remove old data-theme
    root.removeAttribute('data-theme');
    // Remove inline styles from previous dynamic theme
    root.removeAttribute('style');

    // Find theme in our list
    const themeData = THEMES.find(t => t.id === newTheme);

    if (themeData?.colors) {
      // Dynamic color injection
      applyThemeColors(themeData);
    } else if (newTheme !== 'dark-healthcare') {
      // Fallback to data-theme for any CSS-only themes
      root.setAttribute('data-theme', newTheme);
    }
  };

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  }, []);

  return { theme, setTheme };
};
