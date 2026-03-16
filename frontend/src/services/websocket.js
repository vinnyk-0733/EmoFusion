// WebSocket Service for Real-time Chat Communication
// Connects to FastAPI backend for emotion-aware AI responses

const DEFAULT_WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/chat';

class WebSocketService {
  constructor(config = {}) {
    this.ws = null;
    this.url = config.url || DEFAULT_WS_URL;
    this.reconnectAttempts = config.reconnectAttempts ?? 5;
    this.reconnectDelay = config.reconnectDelay ?? 3000;
    this.currentAttempt = 0;
    this.sessionId = null;
    this.eventHandlers = new Set();
    this.reconnectTimer = null;
    this.waitingConnectionPromise = null;
  }

  connect(chatId = null) {
    // Determine target Chat ID (resume previous if not specified)
    const targetChatId = chatId || this.lastConnectedChatId;

    // If already connected, return the session ID
    if (this.ws?.readyState === WebSocket.OPEN) {
      // If we are already connected but want a different chat, we need to reconnect
      if (targetChatId && this.sessionId !== targetChatId) {
        this.disconnect();
      } else {
        return Promise.resolve(this.sessionId || '');
      }
    }

    // If currently connecting, return the existing promise to prevent duplicates
    if (this.waitingConnectionPromise) {
      return this.waitingConnectionPromise;
    }

    this.isIntentionallyClosed = false;

    this.waitingConnectionPromise = new Promise((resolve, reject) => {
      try {
        const wsUrl = new URL(this.url);
        if (targetChatId) {
          wsUrl.searchParams.append('chat_id', targetChatId);
          this.lastConnectedChatId = targetChatId;
        }
        this.ws = new WebSocket(wsUrl.toString());

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.currentAttempt = 0;
          // Don't resolve here yet, wait for 'connected' message with session ID
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'connected') {
              this.sessionId = data.data.session_id;
              // If we didn't have a specific ID, store the one assigned by server
              if (!this.lastConnectedChatId) {
                this.lastConnectedChatId = this.sessionId;
              }
              console.log('[WebSocket] Session:', this.sessionId);
              resolve(this.sessionId);
              this.waitingConnectionPromise = null; // Connection success, clear promise
            }

            this.notifyHandlers(data);
          } catch (e) {
            console.error('[WebSocket] Failed to parse message:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          if (this.waitingConnectionPromise) {
            reject(error);
            this.waitingConnectionPromise = null;
          }
        };

        this.ws.onclose = (event) => {
          console.log('[WebSocket] Closed:', event.code, event.reason);

          // If we were waiting for connection and it closed, reject
          if (this.waitingConnectionPromise) {
            // Only reject if it wasn't established yet. 
            // Ideally onclose happens after established, but if it happens during connect, reject.
            // We can check if sessionId is set or if we resolved. 
            // But actually, if onclose happens, the promise might be pending.
            // We usually clear promise on 'connected'. 
            // If we didn't get 'connected' yet, this is a failed attempt.
          }

          this.waitingConnectionPromise = null; // Clear promise on close

          if (!this.isIntentionallyClosed && this.currentAttempt < this.reconnectAttempts) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        this.waitingConnectionPromise = null;
        reject(error);
      }
    });

    return this.waitingConnectionPromise;
  }

  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.currentAttempt++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.currentAttempt - 1);

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.currentAttempt}/${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      // Pass the last known chat ID to resume session
      this.connect(this.lastConnectedChatId).catch(console.error);
    }, delay);
  }

  disconnect() {
    this.isIntentionallyClosed = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.sessionId = null;
    console.log('[WebSocket] Disconnected');
  }

  sendMessage(text, imageBase64 = null) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[WebSocket] Not connected');
      return false;
    }

    const message = {
      type: 'message',
      text,
    };

    if (imageBase64) {
      message.image = imageBase64;
    }

    this.ws.send(JSON.stringify(message));
    return true;
  }

  send(data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[WebSocket] Not connected');
      return false;
    }
    this.ws.send(JSON.stringify(data));
    return true;
  }

  clearHistory() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    this.ws.send(JSON.stringify({ type: 'clear' }));
    return true;
  }

  ping() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    this.ws.send(JSON.stringify({ type: 'ping' }));
    return true;
  }

  subscribe(handler) {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  notifyHandlers(event) {
    this.eventHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch (e) {
        console.error('[WebSocket] Handler error:', e);
      }
    });
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get currentSessionId() {
    return this.sessionId;
  }
}

// Singleton instance
export const wsService = new WebSocketService();

export default WebSocketService;
