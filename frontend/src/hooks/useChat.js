// Re-export WebSocket-based chat hook as useChat for seamless integration
// Falls back to demo mode if WebSocket is not available

import { useWebSocketChat } from './useWebSocketChat';

export const useChat = useWebSocketChat;
