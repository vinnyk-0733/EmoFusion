import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export const PullToRefreshIndicator = ({ pullDistance, isRefreshing, progress, shouldRefresh }) => {
  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: pullDistance > 10 || isRefreshing ? 1 : 0, y: isRefreshing ? 0 : pullDistance - 40 }}
      className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 pointer-events-none"
      style={{ height: Math.max(pullDistance, isRefreshing ? 50 : 0) }}
    >
      <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-200 ${shouldRefresh || isRefreshing ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
        <RefreshCw className={`w-5 h-5 transition-transform duration-200 ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: isRefreshing ? undefined : `rotate(${progress * 180}deg)` }} />
      </div>
    </motion.div>
  );
};
