import { motion } from 'framer-motion';
import { EMOTION_EMOJIS } from '@/types/emotion';

const sizeClasses = {
  sm: 'text-xl',
  md: 'text-3xl',
  lg: 'text-5xl',
};

const EmotionIndicator = ({
  emotion,
  size = 'md',
  showLabel = false,
  animated = true,
}) => {
  const emoji = EMOTION_EMOJIS[emotion];
  const glowClass = `emotion-glow-${emotion}`;

  return (
    <motion.div
      key={emotion}
      initial={animated ? { scale: 0.5, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className={`flex items-center gap-2 ${glowClass}`}
    >
      <motion.span
        className={`${sizeClasses[size]} filter drop-shadow-lg`}
        animate={animated ? { 
          y: [0, -5, 0],
          scale: [1, 1.1, 1],
        } : {}}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {emoji}
      </motion.span>
      {showLabel && (
        <span className="text-sm font-medium text-muted-foreground capitalize">
          {emotion}
        </span>
      )}
    </motion.div>
  );
};

export default EmotionIndicator;
