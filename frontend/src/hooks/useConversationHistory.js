import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export const useConversationHistory = () => {
  const { toast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all chats on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch specific chat details when active ID changes
  useEffect(() => {
    if (activeConversationId) {
      fetchChatDetails(activeConversationId);
    } else {
      setActiveConversation(null);
    }
  }, [activeConversationId]);

  const fetchConversations = async () => {
    try {
      const chats = await apiService.getChats();
      // Map backend fields to frontend expected fields if necessary
      // Backend: id (str), title, created_at, updated_at, messages (usually empty in list view if we optimize, but here we get them)
      // Frontend expects: id, title, dominantEmotion (we might need to calculate this from last message)

      const formattedChats = chats.map(c => ({
        id: c._id || c.id,
        title: c.title,
        updatedAt: c.updated_at,
        dominantEmotion: getLastEmotion(c.messages)
      }));

      setConversations(formattedChats);
    } catch (e) {
      console.error('Failed to fetch conversations:', e);
      toast({ title: "Error", description: "Could not load chat history", variant: "destructive" });
    }
  };

  const fetchChatDetails = async (id) => {
    setIsLoading(true);
    try {
      const chat = await apiService.getChat(id);

      // Patch: Generate IDs for messages if they don't exist (backend doesn't store them)
      const messagesWithIds = (chat.messages || []).map((msg, index) => ({
        ...msg,
        // If ID exists, use it; otherwise generate one based on timestamp and index to dependably render
        id: msg.id || `msg-${new Date(msg.timestamp).getTime()}-${index}`,
        // Ensure timestamp is a Date object or valid string
        timestamp: msg.timestamp || new Date().toISOString()
      }));

      setActiveConversation({
        id: chat._id || chat.id,
        title: chat.title,
        messages: messagesWithIds,
        updatedAt: chat.updated_at
      });
    } catch (e) {
      console.error('Failed to fetch chat details:', e);
      toast({ title: "Error", description: "Could not load chat details", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const getLastEmotion = (messages) => {
    if (!messages || messages.length === 0) return 'neutral';
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].emotion) return messages[i].emotion;
    }
    return 'neutral';
  };

  const startNewConversation = useCallback(async () => {
    try {
      const newChat = await apiService.createChat("New Chat");
      const formattedChat = {
        id: newChat._id || newChat.id,
        title: newChat.title,
        updatedAt: newChat.updated_at,
        dominantEmotion: 'neutral',
        messages: []
      };

      setConversations(prev => [formattedChat, ...prev]);
      setActiveConversationId(formattedChat.id);
      return formattedChat.id;
    } catch (e) {
      console.error('Failed to create chat:', e);
      toast({ title: "Error", description: "Could not create new chat", variant: "destructive" });
      return null;
    }
  }, [toast]);

  const selectConversation = useCallback((id) => {
    setActiveConversationId(id);
  }, []);

  const deleteConversation = useCallback(async (id) => {
    try {
      await apiService.deleteChat(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setActiveConversation(null);
      }
    } catch (e) {
      console.error('Failed to delete chat:', e);
      toast({ title: "Error", description: "Could not delete chat", variant: "destructive" });
    }
  }, [activeConversationId, toast]);

  const clearAllConversations = useCallback(async () => {
    try {
      await apiService.deleteAllChats();
      setConversations([]);
      setActiveConversationId(null);
      setActiveConversation(null);
      toast({ title: "Cleared", description: "All conversations have been deleted", duration: 3000 });
    } catch (e) {
      console.error('Failed to clear all chats:', e);
      toast({ title: "Error", description: "Could not delete all chats", variant: "destructive" });
    }
  }, [toast]);

  const renameConversation = useCallback(async (id, newTitle) => {
    try {
      await apiService.updateChat(id, { title: newTitle });
      setConversations(prev =>
        prev.map(conv =>
          conv.id === id ? { ...conv, title: newTitle } : conv
        )
      );
      if (activeConversation && activeConversation.id === id) {
        setActiveConversation(prev => ({ ...prev, title: newTitle }));
      }
    } catch (e) {
      console.error('Failed to rename chat:', e);
      toast({ title: "Error", description: "Could not rename chat", variant: "destructive" });
    }
  }, [activeConversation, toast]);

  const addMessage = useCallback((message) => {
    // This is now mostly handled by the WebSocket logic which interacts with backend directly.
    // However, to keep the UI list valid without refreshing:
    setConversations(prev => {
      return prev.map(conv => {
        if (conv.id !== activeConversationId) return conv;
        return {
          ...conv,
          updatedAt: new Date().toISOString(), // approximate
          dominantEmotion: message.emotion || conv.dominantEmotion
        };
      });
    });
  }, [activeConversationId]);

  const deleteMessage = useCallback(async (messageId, messageIndex) => {
    if (!activeConversationId) return;
    try {
      await apiService.softDeleteMessage(activeConversationId, messageIndex);
    } catch (e) {
      console.error('Failed to delete message from DB:', e);
    }
  }, [activeConversationId]);

  return {
    conversations,
    activeConversationId,
    activeConversation,
    isLoading,
    startNewConversation,
    addMessage,
    selectConversation,
    deleteConversation,
    clearAllConversations,
    renameConversation,
    deleteMessage,
  };
};
