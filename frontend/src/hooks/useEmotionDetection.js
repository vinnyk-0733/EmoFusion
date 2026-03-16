import { useState, useCallback, useRef } from 'react';
import { detectFacialEmotion, detectTextEmotion, detectFusedEmotion } from '@/services/api';

// Map API emotion strings to EmotionType
const mapToEmotionType = (emotion) => {
  const emotionMap = {
    happy: 'happy',
    sad: 'sad',
    angry: 'angry',
    fear: 'fear',
    surprise: 'surprise',
    neutral: 'neutral',
    disgust: 'disgust',
    // Common variations
    happiness: 'happy',
    sadness: 'sad',
    anger: 'angry',
    fearful: 'fear',
    surprised: 'surprise',
    disgusted: 'disgust',
  };
  
  return emotionMap[emotion.toLowerCase()] || 'neutral';
};

export const useEmotionDetection = () => {
  const [state, setState] = useState({
    facialEmotion: null,
    textEmotion: null,
    fusedEmotion: 'neutral',
    confidence: 0,
    isDetecting: false,
    error: null,
  });

  const lastDetectionRef = useRef(0);
  const DEBOUNCE_MS = 500;

  const detectFromFace = useCallback(async (imageBase64) => {
    try {
      setState(prev => ({ ...prev, isDetecting: true, error: null }));
      const result = await detectFacialEmotion(imageBase64);
      const emotion = mapToEmotionType(result.emotion);
      
      setState(prev => ({
        ...prev,
        facialEmotion: emotion,
        isDetecting: false,
      }));
      
      return emotion;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Facial detection failed';
      setState(prev => ({ ...prev, error: message, isDetecting: false }));
      return 'neutral';
    }
  }, []);

  const detectFromText = useCallback(async (text) => {
    if (!text.trim()) return 'neutral';
    
    try {
      setState(prev => ({ ...prev, isDetecting: true, error: null }));
      const result = await detectTextEmotion(text);
      const emotion = mapToEmotionType(result.emotion);
      
      setState(prev => ({
        ...prev,
        textEmotion: emotion,
        isDetecting: false,
      }));
      
      return emotion;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Text detection failed';
      setState(prev => ({ ...prev, error: message, isDetecting: false }));
      return 'neutral';
    }
  }, []);

  const detectFused = useCallback(async (
    imageBase64,
    text
  ) => {
    const now = Date.now();
    if (now - lastDetectionRef.current < DEBOUNCE_MS) {
      return state.fusedEmotion;
    }
    lastDetectionRef.current = now;

    try {
      setState(prev => ({ ...prev, isDetecting: true, error: null }));
      const result = await detectFusedEmotion(imageBase64, text);
      const emotion = mapToEmotionType(result.emotion);
      
      setState(prev => ({
        ...prev,
        fusedEmotion: emotion,
        confidence: result.confidence,
        isDetecting: false,
      }));
      
      return emotion;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Emotion detection failed';
      setState(prev => ({ ...prev, error: message, isDetecting: false }));
      return 'neutral';
    }
  }, [state.fusedEmotion]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    detectFromFace,
    detectFromText,
    detectFused,
    clearError,
  };
};
