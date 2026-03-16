import { motion } from 'framer-motion';

const TypingIndicator = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex justify-start mb-4"
    >
      <div className="glass-card px-4 py-3 rounded-2xl rounded-bl-md">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
              className="w-2 h-2 rounded-full bg-primary"
            />
          ))}
          <span className="ml-2 text-xs text-muted-foreground">AI is thinking...</span>
        </div>
      </div>
    </motion.div>
  );
};

export default TypingIndicator;
