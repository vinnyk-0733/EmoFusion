import { useState, useRef, useCallback, useEffect } from 'react';
import { detectFacialEmotion } from '@/services/api';

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
    happiness: 'happy',
    sadness: 'sad',
    anger: 'angry',
    fearful: 'fear',
    surprised: 'surprise',
    disgusted: 'disgust',
  };
  return emotionMap[emotion.toLowerCase()] || 'neutral';
};

export const useCamera = (detectionIntervalMs = 2000) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [detectedEmotion, setDetectedEmotion] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const videoRef = useRef(null);
  const detectionIntervalRef = useRef(null);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !isEnabled) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  }, [isEnabled]);

  const detectEmotion = useCallback(async () => {
    const frame = captureFrame();
    if (!frame) return;

    setIsDetecting(true);
    try {
      const result = await detectFacialEmotion(frame);
      setDetectedEmotion({
        emotion: mapToEmotionType(result.emotion),
        confidence: result.confidence,
      });
    } catch (err) {
      console.error('Facial emotion detection failed:', err);
      // Don't set error state to avoid disrupting UX, just log
    } finally {
      setIsDetecting(false);
    }
  }, [captureFrame]);

  const startDetectionLoop = useCallback(() => {
    if (detectionIntervalRef.current) return;
    
    // Initial detection after a short delay
    setTimeout(detectEmotion, 500);
    
    // Start interval
    detectionIntervalRef.current = setInterval(detectEmotion, detectionIntervalMs);
  }, [detectEmotion, detectionIntervalMs]);

  const stopDetectionLoop = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: 'user',
        },
      });
      setStream(mediaStream);
      setIsEnabled(true);
    } catch (err) {
      setError('Camera access denied or not available');
      setIsEnabled(false);
    }
  }, []);

  // Sync stream to video element whenever stream or ref changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream]);

  const stopCamera = useCallback(() => {
    stopDetectionLoop();
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsEnabled(false);
    setDetectedEmotion(null);
  }, [stream, stopDetectionLoop]);

  const toggleCamera = useCallback(() => {
    if (isEnabled) {
      stopCamera();
    } else {
      startCamera();
    }
  }, [isEnabled, startCamera, stopCamera]);

  // Start detection loop when camera is enabled
  useEffect(() => {
    if (isEnabled && stream) {
      // Wait for video to be ready
      const video = videoRef.current;
      if (video) {
        const handleCanPlay = () => {
          startDetectionLoop();
        };
        video.addEventListener('canplay', handleCanPlay);
        
        // If already ready
        if (video.readyState >= 3) {
          startDetectionLoop();
        }
        
        return () => {
          video.removeEventListener('canplay', handleCanPlay);
        };
      }
    }
  }, [isEnabled, stream, startDetectionLoop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetectionLoop();
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream, stopDetectionLoop]);

  return {
    videoRef,
    isEnabled,
    error,
    toggleCamera,
    captureFrame,
    startCamera,
    stopCamera,
    detectedEmotion,
    isDetecting,
  };
};
