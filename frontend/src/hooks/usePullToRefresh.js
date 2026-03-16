import { useState, useRef, useCallback, useEffect } from 'react';

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  maxPull = 120,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef(null);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback((e) => {
    const container = containerRef.current;
    if (!container || isRefreshing) return;
    
    // Only enable pull-to-refresh when scrolled to top
    if (container.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e) => {
    if (!isPulling.current || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      isPulling.current = false;
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      // Apply resistance to make it feel more natural
      const resistance = 0.5;
      const distance = Math.min(diff * resistance, maxPull);
      setPullDistance(distance);
      
      // Haptic feedback when reaching threshold
      if (distance >= threshold && navigator.vibrate) {
        navigator.vibrate(5);
      }
    }
  }, [isRefreshing, threshold, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      
      // Haptic feedback on refresh trigger
      if (navigator.vibrate) {
        navigator.vibrate([10, 50, 10]);
      }
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);
  const shouldRefresh = pullDistance >= threshold;

  return {
    containerRef,
    pullDistance,
    isRefreshing,
    progress,
    shouldRefresh,
  };
};
