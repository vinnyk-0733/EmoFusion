import { MessageSquare, History, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const BottomNav = ({ activeTab, onTabChange }) => {
  const handleTabPress = (tab) => {
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(5);
    }
    onTabChange(tab);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="glass-card border-t border-border/50 px-2 pb-safe">
        <div className="flex items-center justify-around py-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabPress(tab.id)}
                className={cn(
                  'relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors',
                  'active:scale-95 transition-transform',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon className={cn('h-5 w-5 relative z-10', isActive && 'text-primary')} />
                <span className={cn('text-xs relative z-10', isActive && 'font-medium')}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
