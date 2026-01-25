import asyncio
import os
from dotenv import load_dotenv
from models.db import db
from models.chat import Chat
from memory.conversation import memory_manager

load_dotenv()

async def test_mongo():
    print("Testing MongoDB Connection...")
    try:
        db.connect()
        print("✅ Connected to MongoDB")
        
        # Test Chat Creation via Memory Manager
        print("\nTesting Session Creation...")
        session_id = await memory_manager.create_session("Test Chat")
        print(f"✅ Created session: {session_id}")
        
        # Test Adding Message
        print("\nTesting Adding Turn...")
        await memory_manager.add_turn(
            session_id,
            "Hello",
            "happy",
            "Positive mood",
            "Hi there!"
        )
        print("✅ Added turn")
        
        # Test Retrieving History
        print("\nTesting History Retrieval...")
        history = await memory_manager.get_history(session_id)
        if len(history) == 2:
            print(f"✅ Retrieved {len(history)} messages")
        else:
            print(f"❌ Retrieved {len(history)} messages, expected 2")
            
        # Test Deletion
        print("\nTesting Deletion...")
        await memory_manager.remove_session(session_id)
        
        history_after = await memory_manager.get_history(session_id)
        if len(history_after) == 0:
            print("✅ Session deleted successfully")
        else:
             print("❌ Session deletion failed")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_mongo())
