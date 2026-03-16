import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import TypewriterText from './TypewriterText';

const EMOTION_EMOJIS = {
  happy: '😊', sad: '😢', angry: '😠', fear: '😨',
  surprise: '😲', neutral: '😐', disgust: '🤢',
};

const ChatMessage = ({ message, speechSynthesis, isNew = false }) => {
  const { speak, cancel, isSpeaking, currentText, isSupported } = speechSynthesis;
  const isUser = message.role === 'user';
  const isCurrentlySpeaking = isSpeaking && currentText === message.content;
  const [hasAnimated, setHasAnimated] = useState(!isNew || isUser);

  const handleSpeakClick = () => {
    if (isCurrentlySpeaking) {
      cancel();
    } else {
      const cleanText = message.content.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
      speak(cleanText);
    }
  };

  const handleTypewriterComplete = () => {
    setHasAnimated(true);
  };

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={cn(
          'relative max-w-[80%] px-4 py-3 rounded-2xl group',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary'
        )}
      >
        {message.emotion && isUser && (
          <span className="absolute -top-3 right-2 text-lg" aria-label={`Emotion: ${message.emotion}`}>
            {EMOTION_EMOJIS[message.emotion]}
          </span>
        )}

        <p className="text-sm pr-8">
          {!isUser && !hasAnimated ? (
            <TypewriterText
              text={message.content}
              speed={15}
              onComplete={handleTypewriterComplete}
            />
          ) : (
            message.content
          )}
        </p>

        {!isUser && isSupported && hasAnimated && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSpeakClick}
            className={cn(
              'absolute bottom-1 right-1 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity',
              isCurrentlySpeaking && 'opacity-100 bg-primary/20'
            )}
            aria-label={isCurrentlySpeaking ? 'Stop speaking' : 'Read aloud'}
          >
            {isCurrentlySpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
