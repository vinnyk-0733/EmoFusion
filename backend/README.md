# Emotion-Aware AI Healthcare Assistant - Backend

FastAPI backend featuring a **Modular Monolithic Architecture** for multimodal emotion recognition and context-aware Generative AI responses.

## Architecture: Modular Monolith

The codebase is organized into clean, self-contained domain modules rather than technical layers:

```
backend/
├── app/
│   ├── main.py                     # Application factory (lifespan, CORS, router mounting)
│   ├── core/                       # Shared Cross-Cutting Infrastructure
│   │   ├── config.py               # Central environment settings, model paths, labels
│   │   └── database.py             # MongoDB connection pool (Motor) & collection helpers
│   │
│   └── modules/                    # Self-Contained Bounded Contexts
│       ├── emotion/                # Multimodal Emotion Recognition Module
│       │   ├── models/             # Local model weights (.h5, .keras, .yaml, ter_model/)
│       │   ├── fer_service.py      # Facial Emotion Recognition (Keras CNN on 48x48 faces)
│       │   ├── ter_service.py      # Text Emotion Recognition (DistilBERT + keywords)
│       │   ├── landmarks.py        # 68-point facial landmark analysis (FacemarkLBF)
│       │   ├── fusion_service.py   # Dual-modality mental state matrix evaluation
│       │   ├── vision_utils.py     # Base64 image decoding & Haar face cascade detection
│       │   ├── schemas.py          # Pydantic schemas (ImageRequest, TextRequest, etc.)
│       │   └── router.py           # REST endpoints (/api/emotion/facial, /api/emotion/text)
│       │
│       ├── llm/                    # Generative AI & Prompt Engineering Module
│       │   ├── client.py           # LangChain + Google Gemini API streaming & sync
│       │   ├── prompt_builder.py   # Context-aware system prompt & conversation history
│       │   └── intent.py           # User intent categorization (advice, question, statement)
│       │
│       └── chat/                   # Real-Time Messaging & Persistence Module
│           ├── schemas.py          # Chat, Message, and PyObjectId models
│           ├── service.py          # Chat CRUD, message turns, soft-delete, likes, memory
│           ├── websocket_manager.py # WebSocket connection tracker per session
│           ├── router.py           # REST endpoints (/api/chats/*)
│           └── websocket.py        # WebSocket (/ws/chat) orchestrating emotion + LLM
│
├── main.py                         # Root entrypoint (starts uvicorn on port 8002)
├── requirements.txt
└── .env
```

## Setup & Running

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment (`.env`)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=emofusiondb
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash
```

### 3. Run the Backend
```bash
python main.py
```
Server runs on `http://localhost:8002` with interactive OpenAPI docs at `http://localhost:8002/docs`.
