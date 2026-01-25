# Emotion-Aware AI Healthcare Assistant - Backend

FastAPI backend for multimodal emotion recognition and context-aware AI responses.

## Features

- **Facial Emotion Recognition (FER)** - Keras model for emotion detection from camera feed
- **Text Emotion Recognition (TER)** - DistilBERT model for emotion detection from text
- **Weighted Emotion Fusion** - Combines FER (60%) and TER (40%) for final emotion
- **Conversation Memory** - Maintains context across conversation turns
- **Intent Detection** - Identifies healthcare, general, or mixed intents
- **LLM Integration** - Mistral 7B via Ollama for response generation
- **WebSocket Communication** - Real-time bidirectional messaging

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Install Ollama and Mistral

```bash
# Install Ollama (https://ollama.ai)
curl -fsSL https://ollama.ai/install.sh | sh

# Pull Mistral model
ollama pull mistral:7b
```

### 3. Configure Models

Update `config.py` with your model paths:

```python
FER_MODEL_PATH = "models/fer_model.keras"  # Your Keras FER model
TER_MODEL_PATH = "models/ter_model"         # Your DistilBERT TER model
```

### 4. Run the Server

```bash
python main.py
# or
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## WebSocket API

### Endpoint
`ws://localhost:8000/ws/chat`

### Message Types

#### Client → Server

**Chat Message:**
```json
{
  "type": "message",
  "text": "I'm feeling a bit anxious today",
  "image": "base64_encoded_image" // optional
}
```

**Clear History:**
```json
{
  "type": "clear"
}
```

**Ping:**
```json
{
  "type": "ping"
}
```

#### Server → Client

**Connection Confirmed:**
```json
{
  "type": "connected",
  "data": {"session_id": "uuid"}
}
```

**Emotion Update:**
```json
{
  "type": "emotion",
  "data": {
    "emotion": "sad",
    "mental_state": "Low mood",
    "confidence": 0.75,
    "scores": {"happy": 0.1, "sad": 0.75, ...},
    "fer_available": true,
    "ter_available": true
  }
}
```

**Stream Chunk:**
```json
{
  "type": "stream",
  "data": {"chunk": "I understand"}
}
```

**Complete Response:**
```json
{
  "type": "response",
  "data": {
    "message": "I understand you're feeling anxious...",
    "emotion": "fear",
    "mental_state": "Anxiety"
  }
}
```

## Project Structure

```
backend/
├── main.py                 # FastAPI entry point
├── config.py               # Configuration and constants
├── requirements.txt        # Python dependencies
├── models/
│   ├── fer.py              # Facial emotion recognition
│   ├── ter.py              # Text emotion recognition
│   └── fusion.py           # Emotion fusion logic
├── llm/
│   ├── mistral.py          # Ollama/Mistral integration
│   └── prompt_builder.py   # Dynamic prompt construction
├── memory/
│   └── conversation.py     # Chat history management
├── api/
│   └── websocket.py        # WebSocket endpoint
└── utils/
    ├── image_utils.py      # Image processing
    └── intent.py           # Intent detection
```

## Emotion Fusion Formula

```
Final Emotion = 0.6 × FER + 0.4 × TER
```

## Mental State Mapping

| Emotion   | Mental State   |
|-----------|----------------|
| sad       | Low mood       |
| fear      | Anxiety        |
| angry     | Stress         |
| neutral   | Stable         |
| happy     | Positive mood  |
| surprise  | Excited        |

## Safety Features

- No medical diagnoses or medication advice
- Encourages professional help for severe distress
- Graceful handling of missing face detection
- Healthcare disclaimer in responses
