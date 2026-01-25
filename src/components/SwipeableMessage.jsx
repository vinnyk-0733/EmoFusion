import { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Heart, Trash2 } from 'lucide-react';
import ChatBubble from './ChatBubble';

const SWIPE_THRESHOLD = 80;

const SwipeableMessage = ({ message, index, onDelete, onFavorite, isFavorited = false }) => {
  const [isRevealed, setIsRevealed] = useState(null);
  const x = useMotionValue(0);
  const leftActionOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const leftActionScale = useTransform(x, [0, SWIPE_THRESHOLD], [0.5, 1]);
  const rightActionOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const rightActionScale = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0.5]);

  const handleDragEnd = (_, info) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    if (navigator.vibrate) navigator.vibrate(10);
    if (offset > SWIPE_THRESHOLD || velocity > 500) { setIsRevealed('left'); onFavorite?.(message.id); setTimeout(() => setIsRevealed(null), 300); }
    else if (offset < -SWIPE_THRESHOLD || velocity < -500) { setIsRevealed('right'); onDelete?.(message.id); }
    else { setIsRevealed(null); }
  };

  return (
    <div className="relative overflow-hidden">
      <motion.div style={{ opacity: leftActionOpacity, scale: leftActionScale }} className="absolute left-4 top-1/2 -translate-y-1/2 z-0"><div className={`p-3 rounded-full ${isFavorited ? 'bg-pink-500' : 'bg-pink-500/80'}`}><Heart className={`h-5 w-5 text-white ${isFavorited ? 'fill-white' : ''}`} /></div></motion.div>
      <motion.div style={{ opacity: rightActionOpacity, scale: rightActionScale }} className="absolute right-4 top-1/2 -translate-y-1/2 z-0"><div className="p-3 rounded-full bg-destructive"><Trash2 className="h-5 w-5 text-destructive-foreground" /></div></motion.div>
      <motion.div style={{ x }} drag="x" dragConstraints={{ left: -120, right: 120 }} dragElastic={0.1} onDragEnd={handleDragEnd} animate={{ x: isRevealed === 'right' ? -300 : 0, opacity: isRevealed === 'right' ? 0 : 1 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} className="relative z-10 cursor-grab active:cursor-grabbing">
        <ChatBubble message={message} index={index} />
      </motion.div>
    </div>
  );
};

export default SwipeableMessage;
