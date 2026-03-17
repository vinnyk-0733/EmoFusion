import { useRef, useEffect, useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import SwipeableMessage from './SwipeableMessage';
import TypingIndicator from './TypingIndicator';

const MessageContainer = ({ messages, isTyping, onLoadMore, onDeleteMessage, onFavoriteMessage, favoritedMessages = new Set() }) => {
  const containerRef = useRef(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const previousScrollHeight = useRef(0);

  useEffect(() => { if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight; }, [messages.length, isTyping]);

  const handleScroll = useCallback(async () => {
    if (!containerRef.current || isLoadingMore || !hasMore || !onLoadMore) return;
    const { scrollTop } = containerRef.current;
    if (scrollTop < 100) {
      setIsLoadingMore(true);
      previousScrollHeight.current = containerRef.current.scrollHeight;
      try {
        const olderMessages = await onLoadMore();
        if (olderMessages.length === 0) setHasMore(false);
        requestAnimationFrame(() => { if (containerRef.current) { const newScrollHeight = containerRef.current.scrollHeight; containerRef.current.scrollTop = newScrollHeight - previousScrollHeight.current; } });
      } catch (error) { console.error('Failed to load more messages:', error); }
      finally { setIsLoadingMore(false); }
    }
  }, [isLoadingMore, hasMore, onLoadMore]);

  return (
    <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin">
      <AnimatePresence>
        {isLoadingMore && <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex justify-center py-4"><div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">Loading older messages...</span></div></motion.div>}
      </AnimatePresence>
      {messages.length === 0 && !isTyping && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full text-center py-12">
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-6xl mb-4">🤖</motion.div>
          <h3 className="text-xl font-semibold mb-2 gradient-text">Welcome to EmoFusion</h3>
          <p className="text-muted-foreground max-w-md">I'm your emotion-aware AI assistant. Enable your camera and start chatting—I'll understand not just your words, but how you're feeling.</p>
        </motion.div>
      )}
      {messages.map((message, index) => <SwipeableMessage key={message.id} message={message} index={index} onDelete={onDeleteMessage} onFavorite={onFavoriteMessage} isFavorited={favoritedMessages.has(message.id)} />)}
      <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>
    </div>
  );
};

export default MessageContainer;
