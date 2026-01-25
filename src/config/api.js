// API Configuration
// Set these in your .env file or update the defaults

export const API_CONFIG = {
  // FastAPI backend base URL
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  
  // Endpoints
  endpoints: {
    facialEmotion: '/api/emotion/facial',
    textEmotion: '/api/emotion/text',
    chatGenerate: '/api/chat/generate',
  },
  
  // Emotion detection settings
  emotion: {
    // Fusion weights: 0.6 FER + 0.4 TER
    facialWeight: 0.6,
    textWeight: 0.4,
    
    // Detection interval for camera (ms)
    detectionInterval: 2000,
    
    // Debounce for text emotion detection (ms)
    textDebounce: 500,
  },
  
  // Request settings
  request: {
    timeout: 30000, // 30 seconds
  },
};

// Expected FastAPI endpoint structures for reference:
/*
POST /api/emotion/facial
Body: { image: "base64_string" }
Response: { emotion: "happy", confidence: 0.95, all_emotions: {...} }

POST /api/emotion/text
Body: { text: "user message" }
Response: { emotion: "sad", confidence: 0.85, all_emotions: {...} }

POST /api/chat/generate
Body: { 
  messages: [{ role: "user"|"assistant", content: "...", emotion?: "..." }],
  emotion_context: "happy"
}
Response: { response: "AI response text", emotion_context: "happy" }
*/
