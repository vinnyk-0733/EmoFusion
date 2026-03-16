import { createContext, useContext, useState, useEffect } from 'react';
import { MotionConfig } from 'framer-motion';

const defaultSettings = {
  reducedMotion: false,
  highContrast: false,
  largeText: false,
  soundEnabled: true,
  fontSize: 100,
};

const STORAGE_KEY = 'accessibility-settings';

const AccessibilityContext = createContext(undefined);

export const AccessibilityProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load accessibility settings:', e);
    }
    return defaultSettings;
  });

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;

    // Font size
    const effectiveFontSize = settings.largeText
      ? Math.max(settings.fontSize, 125)
      : settings.fontSize;
    root.style.fontSize = `${effectiveFontSize}%`;

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save accessibility settings:', e);
    }
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, resetSettings }}>
      <MotionConfig reducedMotion={settings.reducedMotion ? "always" : "user"}>
        {children}
      </MotionConfig>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
