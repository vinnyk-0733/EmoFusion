"""
Database Connection & Lifecycle Management
Provides async MongoDB access via Motor with auto-reconnection and collection helpers.
"""

import logging
from typing import Optional
import motor.motor_asyncio
from app.core.config import settings

logger = logging.getLogger(__name__)


class DatabaseManager:
    """Manages MongoDB connection pool and database references."""

    def __init__(self):
        self.client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
        self.db: Optional[motor.motor_asyncio.AsyncIOMotorDatabase] = None

    def connect(self) -> motor.motor_asyncio.AsyncIOMotorDatabase:
        """Establish MongoDB connection if not already connected."""
        if self.client is None or self.db is None:
            try:
                self.client = motor.motor_asyncio.AsyncIOMotorClient(
                    settings.MONGO_URL,
                    serverSelectionTimeoutMS=5000
                )
                self.db = self.client[settings.DB_NAME]
                logger.info(f"Connected to MongoDB at {settings.MONGO_URL} (db: {settings.DB_NAME})")
            except Exception as e:
                logger.error(f"Could not connect to MongoDB: {e}")
                raise e
        return self.db

    def close(self):
        """Close MongoDB connection pool."""
        if self.client:
            self.client.close()
            self.client = None
            self.db = None
            logger.info("Closed MongoDB connection pool")

    def get_collection(self, collection_name: str) -> motor.motor_asyncio.AsyncIOMotorCollection:
        """Get collection by name with on-demand connection initialization."""
        if self.db is None:
            self.connect()
        return self.db[collection_name]


# Global database singleton
db = DatabaseManager()

