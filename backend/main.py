"""
Backend Entry Point
Starts Uvicorn server for the Modular Monolith application.
"""

import sys
from pathlib import Path
import uvicorn

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app

if __name__ == "__main__":
    print("=" * 60)
    print("Starting EmoFusion Backend (Modular Monolith)...")
    print("=" * 60)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8002, reload=True)
