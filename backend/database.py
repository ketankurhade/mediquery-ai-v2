from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")

# Connect to MongoDB Atlas
client = MongoClient(MONGODB_URL)

# Select database (creates it automatically on first write)
db = client["mediquery_db"]

# Collections (like tables)
users_collection = db["users"]
reports_collection = db["reports"]
chats_collection = db["chats"]

def test_connection():
    """Test if MongoDB connection works."""
    try:
        client.admin.command('ping')
        print("✅ Successfully connected to MongoDB!")
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False