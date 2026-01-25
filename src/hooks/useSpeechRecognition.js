import { useState, useEffect, useCallback, useRef } from 'react';

export const useSpeechRecognition = (options = {}) => {
  const {
    continuous = false,
    language = 'en-US',
  } = options;

  const [state, setState] = useState({
    isListening: false,
    isSupported: false,
    transcript: '',
    interimTranscript: '',
    error: null,
  });

  const recognitionRef = useRef(null);
  const optionsRef = useRef(options);

  // Keep options ref updated (separate effect to maintain hook count)
  useEffect(() => {
    optionsRef.current = options;
  });

  // Check browser support and setup
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      setState(prev => ({ ...prev, isSupported: false }));
      return;
    }

    setState(prev => ({ ...prev, isSupported: true }));

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setState(prev => ({ ...prev, isListening: true, error: null }));
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setState(prev => ({ 
          ...prev, 
          transcript: prev.transcript + finalTranscript,
          interimTranscript: '' 
        }));
        optionsRef.current.onResult?.(finalTranscript);
      }

      if (interimTranscript) {
        setState(prev => ({ ...prev, interimTranscript }));
        optionsRef.current.onInterimResult?.(interimTranscript);
      }
    };

    recognition.onerror = (event) => {
      let errorMessage = 'Speech recognition error';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found. Please check your settings.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition aborted.';
          break;
        default:
          errorMessage = `Error: ${event.error}`;
      }

      setState(prev => ({ ...prev, error: errorMessage, isListening: false }));
      optionsRef.current.onError?.(errorMessage);
    };

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }));
      optionsRef.current.onEnd?.();
    };

    return () => {
      recognition.abort();
    };
  }, [continuous, language]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    setState(prev => ({ 
      ...prev, 
      transcript: '', 
      interimTranscript: '', 
      error: null 
    }));
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      // Recognition might already be started
      console.warn('Speech recognition start error:', error);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
  }, []);

  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setState(prev => ({ ...prev, transcript: '', interimTranscript: '' }));
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
};
