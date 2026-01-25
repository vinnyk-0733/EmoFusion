import { useState, useEffect, useCallback } from 'react';

const THEME_STORAGE_KEY = 'emotion-ai-theme';

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
    
    // Remove all theme attributes
    root.removeAttribute('data-theme');
    
    // Apply new theme if not default
    if (newTheme !== 'dark-healthcare') {
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
