import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const ChatInput = ({ onSendMessage, disabled }) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="p-4 border-t border-border/50"
    >
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`relative glass-card rounded-2xl transition-all duration-300 ${
            isFocused ? 'shadow-glow ring-1 ring-primary/50' : ''
          }`}
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            disabled={disabled}
            className="min-h-[60px] max-h-[150px] resize-none bg-transparent border-none focus-visible:ring-0 pr-24 text-foreground placeholder:text-muted-foreground"
            rows={1}
          />
          
          <div className="absolute right-2 bottom-2 flex items-center gap-2">
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || disabled}
              className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Character count */}
        <div className="flex justify-between items-center mt-2 px-2">
          <span className="text-xs text-muted-foreground">
            {disabled ? '⏳ AI is responding...' : 'Press Enter to send'}
          </span>
          <span className={`text-xs ${input.length > 1000 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {input.length}/1000
          </span>
        </div>
      </form>
    </motion.div>
  );
};

export default ChatInput;
