import asyncio
from models.db import db
# from models.chat import Chat # Not strictly needed for raw delete

async def cleanup():
    # connect is sync
    db.connect()
    
    # Check total before
    total_before = await db.get_collection('chats').count_documents({})
    print(f"Total chats before: {total_before}")
    
    # Find chats with "New Chat" title and empty/null messages
    # Also delete checks where messages array exists but is empty
    delete_result = await db.get_collection('chats').delete_many({
        "title": "New Chat",
        "$or": [
            {"messages": {"$exists": False}},
            {"messages": None},
            {"messages": []},
            {"messages": {"$size": 0}} # redundant but safe
        ]
    })
    
    print(f"Deleted {delete_result.deleted_count} empty 'New Chat' sessions.")
    
    # Verify remaining
    chats = await db.get_collection('chats').find().to_list(100)
    print("Remaining chats:")
    for c in chats:
        print(f" - {c.get('_id')} : {c.get('title')} (Messages: {len(c.get('messages', []))})")

    db.close()

if __name__ == "__main__":
    asyncio.run(cleanup())
