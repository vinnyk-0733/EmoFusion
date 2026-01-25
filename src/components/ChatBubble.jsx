import { motion } from 'framer-motion';
import { EMOTION_EMOJIS } from '@/types/emotion';
import { format } from 'date-fns';

const ChatBubble = ({ message, index }) => {
  const isUser = message.role === 'user';
  const emoji = (message.emotion && isUser) ? EMOTION_EMOJIS[message.emotion] : null;

  return (
    <motion.div initial={{ opacity: 0, y: 20, x: isUser ? 20 : -20 }} animate={{ opacity: 1, y: 0, x: 0 }} transition={{ duration: 0.4, delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`relative max-w-[80%] ${isUser ? 'order-1' : 'order-2'}`}>
        {emoji && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }} className={`absolute -top-3 ${isUser ? 'right-2' : 'left-2'} text-lg z-10`}>{emoji}</motion.div>}
        <div className={`relative px-4 py-3 rounded-2xl ${isUser ? 'bg-primary text-primary-foreground rounded-br-md' : 'glass-card rounded-bl-md'}`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          <div className={`flex items-center gap-1 mt-2 text-xs ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}><span>{format(message.timestamp, 'HH:mm')}</span></div>
        </div>
        <div className={`absolute bottom-0 w-4 h-4 ${isUser ? 'right-0 bg-primary rounded-bl-xl' : 'left-0 glass-card rounded-br-xl'}`} style={{ clipPath: isUser ? 'polygon(100% 0, 100% 100%, 0 100%)' : 'polygon(0 0, 100% 100%, 0 100%)' }} />
      </div>
    </motion.div>
  );
};

export default ChatBubble;
