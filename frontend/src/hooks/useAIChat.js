import { useState, useCallback, useRef } from 'react';
import { generateResponse } from '@/services/api';

const generateId = () => Math.random().toString(36).substring(2, 15);

// Fallback responses when API is unavailable
const FALLBACK_RESPONSES = {
  happy: ["I'm glad you're feeling positive! How can I help you today?"],
  sad: ["I'm here to listen and support you. What's on your mind?"],
  angry: ["I understand things can be frustrating. Let's work through this together."],
  fear: ["You're safe here. Let's take things one step at a time."],
  surprise: ["Something unexpected? I'd love to hear more!"],
  neutral: ["Hello! How can I assist you today?"],
  disgust: ["I understand something doesn't sit right. Let's talk about it."],
};

export const useAIChat = (options = {}) => {
  const { useFallback = true } = options;
  
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [error, setError] = useState(null);
  const messageIdRef = useRef(0);

  const addMessage = useCallback((content, role, emotion) => {
    const newMessage = {
      id: `msg-${++messageIdRef.current}-${generateId()}`,
      role,
      content,
      timestamp: new Date(),
      emotion,
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const sendMessage = useCallback(async (content, detectedEmotion) => {
    const emotion = detectedEmotion || currentEmotion;
    
    // Add user message
    addMessage(content, 'user', emotion);
    setCurrentEmotion(emotion);
    setIsTyping(true);
    setError(null);

    try {
      // Build conversation history for context
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        emotion: msg.emotion,
      }));
      
      // Add current message
      chatHistory.push({ role: 'user', content, emotion });

      // Call FastAPI backend
      const response = await generateResponse(chatHistory, emotion);
      
      setIsTyping(false);
      addMessage(response.response, 'assistant', emotion);
    } catch (err) {
      console.error('AI Chat error:', err);
      setIsTyping(false);
      
      if (useFallback) {
        // Use fallback response
        const fallbacks = FALLBACK_RESPONSES[emotion];
        const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        addMessage(fallback, 'assistant', emotion);
        setError('Using offline mode - backend unavailable');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to get response');
      }
    }
  }, [addMessage, currentEmotion, messages, useFallback]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    messageIdRef.current = 0;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isTyping,
    currentEmotion,
    setCurrentEmotion,
    sendMessage,
    clearMessages,
    error,
    clearError,
  };
};
