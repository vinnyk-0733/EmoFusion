import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { THEMES } from '@/types/theme';

const ThemeSwitcher = ({ currentTheme, onThemeChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative z-[100]">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="relative h-10 w-10 rounded-xl bg-secondary/50 hover:bg-secondary transition-all duration-300 hover:shadow-glow">
        <Palette className="h-5 w-5 text-primary" />
      </Button>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90]" onClick={() => setIsOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} transition={{ duration: 0.2 }} className="absolute right-0 top-12 z-[100] w-64 glass-card p-2 bg-card border border-border shadow-xl">
              <div className="space-y-1">
                {THEMES.map((theme) => (
                  <button key={theme.id} onClick={() => { onThemeChange(theme.id); setIsOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${currentTheme === theme.id ? 'bg-primary/20 text-primary' : 'hover:bg-secondary/50 text-foreground'}`}>
                    <span className="text-xl">{theme.icon}</span>
                    <div className="flex-1 text-left"><div className="font-medium text-sm">{theme.name}</div><div className="text-xs text-muted-foreground">{theme.description}</div></div>
                    {currentTheme === theme.id && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeSwitcher;
