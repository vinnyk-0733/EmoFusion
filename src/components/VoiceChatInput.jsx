import { useState, useCallback } from 'react';
import { Send, Mic, MicOff, Loader2, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const VoiceChatInput = ({ value, onChange, onSend, onStop, isGenerating = false, disabled = false, placeholder = 'Type your message...' }) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const { isListening, isSupported, interimTranscript, error, startListening, stopListening } = useSpeechRecognition({
    onResult: (transcript) => { onChange(value + (value ? ' ' : '') + transcript); setIsProcessing(false); },
    onInterimResult: () => { setIsProcessing(true); },
    onError: (errorMessage) => { toast({ variant: 'destructive', title: 'Voice Input Error', description: errorMessage }); setIsProcessing(false); },
    onEnd: () => { setIsProcessing(false); },
    continuous: false,
    language: 'en-US',
  });

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (value.trim() && !disabled && !isGenerating) onSend(); } };
  const handleMicClick = useCallback(() => { if (isListening) stopListening(); else startListening(); }, [isListening, startListening, stopListening]);
  const displayValue = isListening && interimTranscript ? value + (value ? ' ' : '') + interimTranscript : value;

  return (
    <div className="relative z-0 glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4">
      <div className="flex gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Textarea
            value={displayValue}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Listening...' : (isGenerating ? 'AI is replying...' : placeholder)}
            className={cn('min-h-[60px] resize-none pr-12', isListening && 'border-primary animate-pulse')}
            disabled={disabled || isListening || isGenerating}
          />
          {isSupported && (
            <Button type="button" variant="ghost" size="icon" onClick={handleMicClick} disabled={disabled || isGenerating} className={cn('absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full transition-all', isListening ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 animate-pulse' : 'hover:bg-secondary text-muted-foreground hover:text-foreground')} aria-label={isListening ? 'Stop listening' : 'Start voice input'}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {isGenerating ? (
          <Button onClick={onStop} variant="destructive" className="h-auto px-6 animate-in zoom-in duration-200">
            <StopCircle className="w-5 h-5 fill-current" />
          </Button>
        ) : (
          <Button onClick={onSend} disabled={!value.trim() || disabled || isListening} className="h-auto px-6">
            <Send className="w-5 h-5" />
          </Button>
        )}
      </div>
      {isListening && <div className="mt-2 flex items-center gap-2 text-sm text-primary"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span></span><span>Listening... Speak now</span></div>}
      {error && !isListening && <div className="mt-2 text-sm text-destructive">{error}</div>}
      {!isSupported && <div className="mt-2 text-xs text-muted-foreground">Voice input is not supported in this browser. Try Chrome or Edge.</div>}
    </div>
  );
};

export default VoiceChatInput;
