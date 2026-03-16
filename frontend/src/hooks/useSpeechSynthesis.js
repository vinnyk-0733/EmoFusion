// Speech synthesis hook for text-to-speech functionality
import { useState, useEffect, useCallback, useRef } from 'react';

export const useSpeechSynthesis = (options = {}) => {
  const {
    rate = 1,
    pitch = 1,
    volume = 1,
    voiceURI,
    onEnd,
    onError,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState([]);
  const [currentText, setCurrentText] = useState(null);
  
  const utteranceRef = useRef(null);

  // Check support and load voices
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setIsSupported(true);

      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        const mappedVoices = availableVoices.map(voice => ({
          name: voice.name,
          lang: voice.lang,
          voiceURI: voice.voiceURI,
          default: voice.default,
        }));
        setVoices(mappedVoices);
      };

      // Load voices immediately if available
      loadVoices();

      // Also listen for voiceschanged event (Chrome loads voices async)
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }
  }, []);

  const getVoice = useCallback((uri) => {
    const availableVoices = window.speechSynthesis.getVoices();
    
    if (uri) {
      const found = availableVoices.find(v => v.voiceURI === uri);
      if (found) return found;
    }

    // Prefer English voices with these preferences
    const preferredVoices = [
      'Google UK English Female',
      'Google US English',
      'Microsoft Zira',
      'Samantha',
      'Karen',
    ];

    for (const name of preferredVoices) {
      const found = availableVoices.find(v => v.name.includes(name));
      if (found) return found;
    }

    // Fall back to first English voice or default
    const englishVoice = availableVoices.find(v => v.lang.startsWith('en'));
    return englishVoice || availableVoices[0] || null;
  }, []);

  const speak = useCallback((text) => {
    if (!isSupported || !text.trim()) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    const voice = getVoice(voiceURI);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setCurrentText(text);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentText(null);
      onEnd?.();
    };

    utterance.onerror = (event) => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentText(null);
      if (event.error !== 'canceled') {
        onError?.(`Speech synthesis error: ${event.error}`);
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, rate, pitch, volume, voiceURI, getVoice, onEnd, onError]);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentText(null);
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported || !isSpeaking) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [isSupported, isSpeaking]);

  const resume = useCallback(() => {
    if (!isSupported || !isPaused) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, [isSupported, isPaused]);

  const toggle = useCallback((text) => {
    if (isSpeaking && currentText === text) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      speak(text);
    }
  }, [isSpeaking, isPaused, currentText, speak, pause, resume]);

  return {
    speak,
    cancel,
    pause,
    resume,
    toggle,
    isSpeaking,
    isPaused,
    isSupported,
    voices,
    currentText,
  };
};
