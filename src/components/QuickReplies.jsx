import { motion } from 'framer-motion';

const QUICK_REPLIES = {
  happy: [
    "Tell me more! 😊",
    "I'm grateful for...",
    "Let's celebrate!",
    "What else is going well?",
  ],
  sad: [
    "I need to talk",
    "Help me feel better",
    "Just listening helps",
    "What can I do?",
  ],
  angry: [
    "I need to vent",
    "Help me calm down",
    "Let's breathe together",
    "I want solutions",
  ],
  fear: [
    "I'm feeling anxious",
    "Help me relax",
    "What should I do?",
    "I need reassurance",
  ],
  surprise: [
    "That's unexpected!",
    "Tell me more",
    "How did that happen?",
    "I'm processing this",
  ],
  neutral: [
    "How are you?",
    "I need advice",
    "Let's chat",
    "Help me with something",
  ],
  disgust: [
    "That bothers me",
    "I need perspective",
    "Help me understand",
    "Let's move past this",
  ],
};

const QuickReplies = ({ emotion, onSelect, disabled }) => {
  const replies = QUICK_REPLIES[emotion] || QUICK_REPLIES.neutral;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-wrap gap-1.5 sm:gap-2 px-2 sm:px-4 py-2"
    >
      {replies.map((reply, index) => (
        <motion.button
          key={reply}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelect(reply)}
          disabled={disabled}
          className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-full bg-secondary/80 hover:bg-primary/20 hover:text-primary border border-border/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {reply}
        </motion.button>
      ))}
    </motion.div>
  );
};

export default QuickReplies;
