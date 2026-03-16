const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const apiService = {
  // Chat History Management
  getChats: async () => {
    try {
      const response = await fetch(`${API_URL}/chats`);
      if (!response.ok) throw new Error('Failed to fetch chats');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  createChat: async (title = 'New Chat') => {
    try {
      const response = await fetch(`${API_URL}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error('Failed to create chat');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  getChat: async (id) => {
    try {
      const response = await fetch(`${API_URL}/chats/${id}`);
      if (!response.ok) throw new Error('Failed to fetch chat');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  deleteChat: async (id) => {
    try {
      const response = await fetch(`${API_URL}/chats/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete chat');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  updateChat: async (id, data) => {
    try {
      const response = await fetch(`${API_URL}/chats/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update chat');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  softDeleteMessage: async (chatId, msgIndex) => {
    try {
      const response = await fetch(`${API_URL}/chats/${chatId}/messages/${msgIndex}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete message');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  deleteAllChats: async () => {
    try {
      const response = await fetch(`${API_URL}/chats/all`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete all chats');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  toggleLikeMessage: async (chatId, msgIndex) => {
    try {
      const response = await fetch(`${API_URL}/chats/${chatId}/messages/${msgIndex}/like`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Failed to toggle like');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};

export const detectFacialEmotion = async (imageBase64) => {
  try {
    const response = await fetch(`${API_URL}/emotion/facial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64 }),
    });
    if (!response.ok) throw new Error('Failed to detect facial emotion');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const detectTextEmotion = async (text) => {
  try {
    const response = await fetch(`${API_URL}/emotion/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error('Failed to detect text emotion');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
