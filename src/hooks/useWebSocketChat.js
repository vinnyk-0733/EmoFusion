// WebSocket-based Chat Hook
// Integrates with FastAPI backend for real-time emotion-aware chat

import { useState, useCallback, useRef, useEffect } from 'react';
import { wsService } from '@/services/websocket';
import { useToast } from '@/hooks/use-toast';

const generateId = () => Math.random().toString(36).substring(2, 15);

// Mental state mapping (matches backend)
const MENTAL_STATE_MAP = {
  sad: 'Low mood',
  fear: 'Anxiety',
  angry: 'Stress',
  neutral: 'Stable',
  happy: 'Positive mood',
  surprise: 'Excited',
  disgust: 'Discomfort',
};

export const useWebSocketChat = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [mentalState, setMentalState] = useState('Stable');
  const [emotionConfidence, setEmotionConfidence] = useState(0);
  const [error, setError] = useState(null);

  const messageIdRef = useRef(0);
  const streamingMessageRef = useRef('');
  const pendingMessageIdRef = useRef(null);
  const lastUserMessageIdRef = useRef(null);
  const previousConnectionState = useRef(null);

  // Handle WebSocket events
  const handleWebSocketEvent = useCallback((event) => {
    switch (event.type) {
      case 'connected':
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);

        // Show toast only if this is a reconnection (not initial connection)
        if (previousConnectionState.current === false) {
          toast({
            title: "Connected",
            description: "Successfully connected to the server",
            duration: 3000,
          });
        }
        previousConnectionState.current = true;
        break;

      case 'emotion': {
        const emotionData = event.data;
        setCurrentEmotion(emotionData.emotion);
        setMentalState(emotionData.mental_state);
        setEmotionConfidence(emotionData.confidence);

        // Update the last USER message with the correctly analyzed emotion
        // This fixes the issue where the user bubble showed the *previous* emotion
        if (lastUserMessageIdRef.current) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === lastUserMessageIdRef.current
                ? { ...msg, emotion: emotionData.emotion }
                : msg
            )
          );
        }
        break;
      }

      case 'stream': {
        const { chunk } = event.data;
        streamingMessageRef.current += chunk;

        // Update the assistant message in real-time
        if (pendingMessageIdRef.current) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === pendingMessageIdRef.current
                ? { ...msg, content: streamingMessageRef.current }
                : msg
            )
          );
        }
        break;
      }

      case 'response': {
        const response = event.data;
        setIsTyping(false);

        // Update the final message
        if (pendingMessageIdRef.current) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === pendingMessageIdRef.current
                ? {
                  ...msg,
                  content: response.message,
                  emotion: response.emotion,
                }
                : msg
            )
          );
        }

        // Reset streaming state
        streamingMessageRef.current = '';
        pendingMessageIdRef.current = null;
        break;
      }

      case 'cleared':
        setMessages([]);
        toast({
          title: "Conversation cleared",
          description: "Your chat history has been reset",
          duration: 2000,
        });
        break;

      case 'interrupted':
        setIsTyping(false);
        toast({
          title: "Stopped",
          description: "Response generation stopped",
          duration: 1000,
        });
        break;

      case 'error': {
        const errorData = event.data;
        setError(errorData.message);
        setIsTyping(false);
        toast({
          title: "Error",
          description: errorData.message,
          variant: "destructive",
          duration: 4000,
        });
        break;
      }
    }
  }, [toast]);

  // Handle disconnection
  useEffect(() => {
    const checkConnection = () => {
      if (!wsService.isConnected && previousConnectionState.current === true) {
        setIsConnected(false);
        previousConnectionState.current = false;
        toast({
          title: "Disconnected",
          description: "Lost connection to server. Click 'Reconnect' to try again.",
          variant: "destructive",
          duration: 5000,
        });
      }
    };

    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, [toast]);

  // Connect to WebSocket on mount
  useEffect(() => {
    const unsubscribe = wsService.subscribe(handleWebSocketEvent);

    // We do NOT auto-connect here anymore. 
    // Connection is driven by the parent component (Index.jsx) via activeConversationId to prevent creating junk sessions.

    if (wsService.isConnected) {
      setIsConnected(true);
      previousConnectionState.current = true;
    }

    return () => {
      unsubscribe();
    };
  }, [handleWebSocketEvent, toast]);

  const connect = useCallback(async (chatId = null) => {
    setIsConnecting(true);
    setError(null);

    // Only show toast if it's a manual connection (not auto-resume silently if desired, though here we always toast)
    // Actually, maybe we should be less noisy if it's just switching chats?
    // Let's keep it for now.

    // If we're already connected to this chat, skip?
    // wsService.connect handles that check.

    try {
      await wsService.connect(chatId);
      setIsConnected(true);
    } catch (err) {
      setError('Failed to connect to server');
      toast({
        title: "Connection failed",
        description: "Could not connect to server. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);

  const disconnect = useCallback(() => {
    wsService.disconnect();
    setIsConnected(false);
  }, []);

  const addMessage = useCallback((
    content,
    role,
    emotion
  ) => {
    const newMessage = {
      id: `msg-${++messageIdRef.current}-${generateId()}`,
      role,
      content,
      timestamp: new Date(),
      emotion,
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  }, []);

  const sendMessage = useCallback(async (
    content,
    imageBase64
  ) => {
    if (!wsService.isConnected) {
      setError('Not connected to server');
      return;
    }

    // Add user message immediately
    const userMessage = addMessage(content, 'user', currentEmotion);
    lastUserMessageIdRef.current = userMessage.id;

    // Create placeholder for assistant response
    const assistantMessage = {
      id: `msg-${++messageIdRef.current}-${generateId()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    pendingMessageIdRef.current = assistantMessage.id;
    streamingMessageRef.current = '';

    // Show typing indicator
    setIsTyping(true);

    // Send via WebSocket
    const sent = wsService.sendMessage(content, imageBase64);
    if (!sent) {
      setError('Failed to send message');
      setIsTyping(false);
    }
  }, [addMessage, currentEmotion]);

  const clearHistory = useCallback(() => {
    if (wsService.isConnected) {
      wsService.clearHistory();
    }
    setMessages([]);
  }, []);

  const loadMoreMessages = useCallback(async () => {
    // WebSocket-based chat doesn't support loading old messages
    // This could be implemented via a REST endpoint if needed
    return [];
  }, []);

  const getMentalState = useCallback((emotion) => {
    return MENTAL_STATE_MAP[emotion] || 'Stable';
  }, []);

  const stopGeneration = useCallback(() => {
    if (wsService.isConnected && isTyping) {
      wsService.send({ type: 'stop' });
      setIsTyping(false);
    }
  }, [isTyping]);

  return {
    // State
    messages,
    isTyping,
    isConnected,
    isConnecting,
    currentEmotion,
    mentalState,
    emotionConfidence,
    error,

    // Actions
    connect,
    disconnect,
    sendMessage,
    stopGeneration,
    clearHistory,
    loadMoreMessages,
    setCurrentEmotion,
    getMentalState,

    // Utilities
    clearError: () => setError(null),
    setMessages,
    restoreMessages: useCallback((historyMessages) => {
      // Robust sanitization
      if (!Array.isArray(historyMessages)) return;

      const validMessages = historyMessages.filter(m =>
        m &&
        typeof m === 'object' &&
        m.id &&
        (typeof m.content === 'string' || typeof m.content === 'number')
      );

      setMessages(validMessages);

      if (validMessages.length > 0) {
        const lastMsg = validMessages[validMessages.length - 1];
        if (lastMsg.emotion) {
          setCurrentEmotion(lastMsg.emotion);
          setMentalState(MENTAL_STATE_MAP[lastMsg.emotion] || 'Stable');
        }
      }
      setMessages(validMessages);

      if (validMessages.length > 0) {
        const lastMsg = validMessages[validMessages.length - 1];
        if (lastMsg.emotion) {
          setCurrentEmotion(lastMsg.emotion);
          setMentalState(MENTAL_STATE_MAP[lastMsg.emotion] || 'Stable');
        }
      }
    }, []),
    currentSessionId: wsService.currentSessionId,
  };
};
