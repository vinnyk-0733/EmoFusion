import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Heart, Trash2 } from 'lucide-react';
import ChatMessage from './ChatMessage';

const SWIPE_THRESHOLD = 80;

const SwipeableChatMessage = ({ message, speechSynthesis, onDelete, onFavorite, isFavorited = false, isNew = false }) => {
  const [isDeleted, setIsDeleted] = useState(message.deleted || false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const controls = useAnimation();
  const x = useMotionValue(0);
  const leftActionOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const leftActionScale = useTransform(x, [0, SWIPE_THRESHOLD], [0.5, 1]);
  const rightActionOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const rightActionScale = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0.5]);

  const handleDragEnd = async (_, info) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    if (navigator.vibrate) navigator.vibrate(10);

    // Swipe right → Like/Favorite
    if (offset > SWIPE_THRESHOLD || velocity > 500) {
      onFavorite?.(message.id);
      // Snap back to original position
      await controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } });
    }
    // Swipe left → Delete
    else if (offset < -SWIPE_THRESHOLD || velocity < -500) {
      setIsAnimatingOut(true);
      await controls.start({ x: -300, opacity: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } });
      setIsDeleted(true);
      onDelete?.(message.id);
    }
    // Didn't reach threshold → snap back
    else {
      await controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } });
    }
  };

  // Show deleted placeholder
  if (isDeleted) {
    return (
      <div className={`flex mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className="px-4 py-2 rounded-2xl bg-secondary/30 border border-border/20">
          <p className="text-xs text-muted-foreground italic">🚫 This message was deleted</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden p-1">
      {/* Swipe right action: Like */}
      <motion.div style={{ opacity: leftActionOpacity, scale: leftActionScale }} className="absolute left-4 top-1/2 -translate-y-1/2 z-0">
        <div className={`p-3 rounded-full ${isFavorited ? 'bg-pink-500' : 'bg-pink-500/80'}`}>
          <Heart className={`h-5 w-5 text-white ${isFavorited ? 'fill-white' : ''}`} />
        </div>
      </motion.div>

      {/* Swipe left action: Delete */}
      <motion.div style={{ opacity: rightActionOpacity, scale: rightActionScale }} className="absolute right-4 top-1/2 -translate-y-1/2 z-0">
        <div className="p-3 rounded-full bg-destructive">
          <Trash2 className="h-5 w-5 text-destructive-foreground" />
        </div>
      </motion.div>

      {/* Draggable message */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -120, right: 120 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="relative z-10 touch-pan-y"
      >
        <ChatMessage message={message} speechSynthesis={speechSynthesis} isNew={isNew} />

        {/* Persistent heart icon below liked messages */}
        {isFavorited && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`flex items-center gap-1 mt-1 ${message.role === 'user' ? 'justify-end pr-2' : 'justify-start pl-2'}`}
          >
            <Heart className="h-3.5 w-3.5 text-pink-500 fill-pink-500" />
            <span className="text-[10px] text-pink-500">Liked</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default SwipeableChatMessage;
