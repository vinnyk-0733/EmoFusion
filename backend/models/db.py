import motor.motor_asyncio
from config import MONGO_URL, DB_NAME
import logging

logger = logging.getLogger(__name__)

class Database:
    client: motor.motor_asyncio.AsyncIOMotorClient = None
    db = None

    def connect(self):
        try:
            self.client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
            self.db = self.client[DB_NAME]
            logger.info("Connected to MongoDB")
        except Exception as e:
            logger.error(f"Could not connect to MongoDB: {e}")
            raise e

    def close(self):
        if self.client:
            self.client.close()
            logger.info("Closed MongoDB connection")

    def get_collection(self, collection_name: str):
        return self.db[collection_name]

db = Database()
