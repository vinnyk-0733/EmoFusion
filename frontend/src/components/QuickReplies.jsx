'use client';

import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';

const DEFAULT_SUGGESTIONS = [
  "Tell me a joke 😊",
  "How to reduce stress?",
  "Mood tips",
  "Talk about anxiety",
];

const QUICK_REPLIES_BY_EMOTION = {
  happy: [
    "Tell me a joke 😊",
    "How to keep this good mood?",
    "Share a positive thought",
    "What else is going well?",
  ],
  sad: [
    "I need someone to listen",
    "How to reduce stress?",
    "Comforting words",
    "Mood tips",
  ],
  angry: [
    "Calming techniques",
    "Help me vent safely",
    "Take a deep breath with me",
    "How to reduce stress?",
  ],
  fear: [
    "Talk about anxiety",
    "Grounding exercise",
    "Help me relax",
    "Reassure me",
  ],
  surprise: [
    "Tell me a joke 😊",
    "Help me process this",
    "Mood tips",
    "What do you think?",
  ],
  neutral: DEFAULT_SUGGESTIONS,
};

const QuickReplies = ({ emotion = 'neutral', onSelect, disabled = false }) => {
  const replies = QUICK_REPLIES_BY_EMOTION[emotion] || DEFAULT_SUGGESTIONS;

  return (
    <div className="w-full mb-3 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-3 rounded-[24px] bg-[#f0f4f9] dark:bg-[#161a24] shadow-[5px_5px_15px_rgba(166,180,200,0.35),-5px_-5px_15px_rgba(255,255,255,0.9)] dark:shadow-[5px_5px_16px_rgba(8,10,16,0.7),-3px_-3px_10px_rgba(35,42,58,0.3)]">
        {/* Suggestions Title Badge */}
        <div className="flex items-center gap-2 pl-2 text-xs font-bold text-slate-800 dark:text-slate-100 flex-shrink-0">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Lightbulb className="h-3.5 w-3.5 fill-teal-500/20" />
          </div>
          <span>Suggestions</span>
        </div>

        {/* Horizontal Chips */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-soft pb-1 sm:pb-0 flex-1">
          {replies.map((reply, index) => (
            <motion.button
              key={reply}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => onSelect(reply)}
              disabled={disabled}
              className="flex-shrink-0 px-4 py-1.5 text-xs font-medium rounded-full bg-[#ffffff] dark:bg-[#1e2433] text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-800 shadow-[2px_2px_6px_rgba(166,180,200,0.3),-2px_-2px_6px_rgba(255,255,255,0.9)] dark:shadow-[2px_2px_6px_rgba(8,10,16,0.6),-1px_-1px_4px_rgba(38,48,68,0.25)] hover:border-teal-400 hover:text-teal-600 dark:hover:text-teal-300 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {reply}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickReplies;
