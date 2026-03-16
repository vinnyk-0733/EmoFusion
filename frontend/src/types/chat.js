// Chat types - no TypeScript, just for reference
// Message shape: { id, role, content, timestamp, emotion? }
// ConversationContext shape: { id, messages, emotionHistory }
// AssistantMode: 'healthcare' | 'general' | 'hybrid'
// WebSocketMessage shape: { type, payload }

export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
};

export const WS_MESSAGE_TYPES = {
  MESSAGE: 'message',
  EMOTION: 'emotion',
  RESPONSE: 'response',
  ERROR: 'error',
  TYPING: 'typing',
};
