'use client';

import { useState } from 'react';
import { Volume2, VolumeX, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import TypewriterText from './TypewriterText';
import MiniAILogo from './MiniAILogo';

const EMOTION_EMOJIS = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  fear: '😨',
  surprise: '😲',
  neutral: '😐',
  disgust: '🤢',
};

const ChatMessage = ({ message, speechSynthesis, isNew = false }) => {
  const { speak, cancel, isSpeaking, currentText, isSupported } = speechSynthesis || {};
  const isUser = message.role === 'user';
  const isCurrentlySpeaking = isSpeaking && currentText === message.content;
  const [hasAnimated, setHasAnimated] = useState(!isNew || isUser);

  const handleSpeakClick = (e) => {
    e.stopPropagation();
    if (!speak) return;
    if (isCurrentlySpeaking) {
      cancel?.();
    } else {
      const cleanText = message.content.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
      speak(cleanText);
    }
  };

  const handleTypewriterComplete = () => {
    setHasAnimated(true);
  };

  return (
    <div
      className={cn(
        'flex items-end gap-3 mb-5 select-text',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* ─── Assistant Avatar on Left ─────────────────────────────── */}
      {!isUser && (
        <div className="flex-shrink-0 mb-1">
          <MiniAILogo size={36} />
        </div>
      )}

      {/* ─── Message Bubble ───────────────────────────────────────── */}
      <div
        className={cn(
          'relative max-w-[78%] sm:max-w-[70%] px-5 py-3.5 transition-all duration-200 group',
          isUser
            ? cn(
                'rounded-[24px] rounded-br-sm',
                'bg-[#c8f3ea] text-slate-900',
                'dark:bg-[#114b46] dark:text-[#ccfbf1] dark:border dark:border-[#2dd4bf]/30',
                'shadow-[4px_4px_12px_rgba(166,180,200,0.32),-3px_-3px_10px_rgba(255,255,255,0.85)]',
                'dark:shadow-[4px_4px_14px_rgba(8,10,16,0.7),-2px_-2px_8px_rgba(45,212,191,0.15)]'
              )
            : cn(
                'rounded-[24px] rounded-bl-sm',
                'bg-[#ffffff] text-slate-800',
                'dark:bg-[#1e2433] dark:text-slate-100',
                'shadow-[5px_5px_15px_rgba(166,180,200,0.35),-5px_-5px_15px_rgba(255,255,255,0.95)]',
                'dark:shadow-[5px_5px_16px_rgba(8,10,16,0.75),-3px_-3px_10px_rgba(38,48,68,0.3)]'
              )
        )}
      >
        {/* Emotion indicator pill if present */}
        {message.emotion && isUser && (
          <span
            className="absolute -top-2.5 right-3 px-1.5 py-0.5 rounded-full text-xs bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700"
            aria-label={`Emotion: ${message.emotion}`}
          >
            {EMOTION_EMOJIS[message.emotion]}
          </span>
        )}

        <div className="text-sm leading-relaxed pr-2 font-normal">
          {!isUser && !hasAnimated ? (
            <TypewriterText
              text={message.content}
              speed={15}
              onComplete={handleTypewriterComplete}
            />
          ) : (
            <span className="whitespace-pre-wrap">{message.content}</span>
          )}
        </div>

        {/* Read Aloud Button for Assistant Messages */}
        {!isUser && isSupported && hasAnimated && (
          <button
            onClick={handleSpeakClick}
            className={cn(
              'absolute bottom-1.5 right-2 p-1 rounded-full transition-opacity',
              isCurrentlySpeaking
                ? 'opacity-100 text-teal-600 bg-teal-50 dark:bg-teal-950/50'
                : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            )}
            title={isCurrentlySpeaking ? 'Stop speaking' : 'Read aloud'}
          >
            {isCurrentlySpeaking ? (
              <VolumeX className="h-3.5 w-3.5" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {/* ─── User Avatar on Right ──────────────────────────────────── */}
      {isUser && (
        <div className="flex-shrink-0 mb-1">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#ffffff] dark:bg-[#1e2433] shadow-[3px_3px_8px_rgba(166,180,200,0.35),-3px_-3px_8px_rgba(255,255,255,0.9)] dark:shadow-[3px_3px_8px_rgba(8,10,16,0.7),-2px_-2px_6px_rgba(38,48,68,0.3)]">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
