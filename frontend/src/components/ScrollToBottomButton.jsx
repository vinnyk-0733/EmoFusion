import { ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

const ScrollToBottomButton = ({ visible, onClick, unreadCount = 0 }) => {
  const handleClick = () => { if (navigator.vibrate) navigator.vibrate(5); onClick(); };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.8 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} className="absolute bottom-4 right-4 z-20">
          <Button onClick={handleClick} size="icon" className="h-10 w-10 rounded-full shadow-lg bg-primary hover:bg-primary/90 active:scale-95 transition-transform">
            <ArrowDown className="h-5 w-5" />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScrollToBottomButton;
