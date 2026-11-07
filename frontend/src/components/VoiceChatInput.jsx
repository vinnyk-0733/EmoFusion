'use client';

import { useState, useCallback, useRef } from 'react';
import { Send, Mic, MicOff, Paperclip, StopCircle, Loader2 } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const VoiceChatInput = ({
  value = '',
  onChange,
  onSend,
  onStop,
  isGenerating = false,
  disabled = false,
  placeholder = 'Type or speak your message...',
  onAttachmentClick
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const { isListening, isSupported, interimTranscript, error, startListening, stopListening } =
    useSpeechRecognition({
      onResult: (transcript) => {
        onChange(value + (value ? ' ' : '') + transcript);
      },
      onError: (errorMessage) => {
        toast({
          variant: 'destructive',
          title: 'Voice Input Error',
          description: errorMessage,
        });
      },
      continuous: false,
      language: 'en-IN',
    });

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled && !isGenerating) {
        onSend();
      }
    }
  };

  const handleMicClick = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleAttachment = () => {
    if (onAttachmentClick) {
      onAttachmentClick();
    } else {
      fileInputRef.current?.click();
    }
  };

  const displayValue = isListening && interimTranscript ? value + (value ? ' ' : '') + interimTranscript : value;

  return (
    <div className="w-full relative z-10 select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            toast({
              title: "Attachment added",
              description: `Image "${file.name}" ready for emotion analysis`,
            });
          }
        }}
      />

      {/* ─── Main Neumorphic Capsule ──────────────────────────────── */}
      <div
        className={cn(
          'flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-full transition-all duration-200',
          'bg-[#f0f4f9] dark:bg-[#151922]',
          'shadow-[inset_3px_3px_7px_rgba(166,180,200,0.38),inset_-3px_-3px_7px_rgba(255,255,255,0.95)]',
          'dark:shadow-[inset_3px_3px_8px_rgba(8,10,16,0.8),inset_-3px_-3px_6px_rgba(35,42,58,0.25)]'
        )}
      >
        {/* Paperclip Button */}
        <button
          type="button"
          onClick={handleAttachment}
          title="Attach image for emotion detection"
          className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:scale-105 active:scale-95 transition-all"
        >
          <Paperclip className="h-5 w-5 -rotate-45" />
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? 'Listening... Speak now' : (isGenerating ? 'EmoFusion is responding...' : placeholder)}
          disabled={disabled || isListening || isGenerating}
          className="flex-1 bg-transparent border-0 outline-none ring-0 focus:ring-0 focus:outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-normal px-1 py-1"
        />

        {/* Microphone Button */}
        {isSupported && (
          <button
            type="button"
            onClick={handleMicClick}
            disabled={disabled || isGenerating}
            title={isListening ? 'Stop listening' : 'Start voice input'}
            className={cn(
              'flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200',
              isListening
                ? 'bg-rose-500 text-white shadow-[0_0_16px_rgba(244,63,94,0.6)] animate-pulse'
                : 'bg-[#ffffff] dark:bg-[#1e2433] text-teal-600 dark:text-teal-400 shadow-[3px_3px_8px_rgba(166,180,200,0.35),-3px_-3px_8px_rgba(255,255,255,0.9)] dark:shadow-[3px_3px_8px_rgba(8,10,16,0.7),-2px_-2px_6px_rgba(38,48,68,0.3)] hover:scale-105 active:scale-95'
            )}
          >
            {isListening ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>
        )}

        {/* Send or Stop Button */}
        {isGenerating ? (
          <button
            type="button"
            onClick={onStop}
            title="Stop generation"
            className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-rose-500 text-white shadow-[0_4px_14px_rgba(244,63,94,0.45)] hover:scale-105 active:scale-95 transition-all"
          >
            <StopCircle className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSend}
            disabled={!value.trim() || disabled || isListening}
            title="Send message"
            className={cn(
              'flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-full text-white transition-all duration-200',
              value.trim() && !disabled && !isListening
                ? 'bg-gradient-to-r from-[#2dd4bf] to-[#06b6d4] shadow-[0_4px_14px_rgba(6,182,212,0.45)] hover:scale-105 active:scale-95 cursor-pointer'
                : 'bg-slate-300 dark:bg-slate-700 opacity-60 cursor-not-allowed'
            )}
          >
            <Send className="h-5 w-5 ml-0.5" />
          </button>
        )}
      </div>

      {/* Voice Status Pill */}
      {isListening && (
        <div className="absolute -top-7 left-6 px-3 py-0.5 rounded-full text-[11px] font-medium bg-teal-500 text-white shadow-md flex items-center gap-1.5 animate-bounce">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          <span>Listening to your voice...</span>
        </div>
      )}
    </div>
  );
};

export default VoiceChatInput;
