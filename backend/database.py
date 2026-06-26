from pymongo import MongoClient
import certifi
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")

client = MongoClient(MONGODB_URL, tlsCAFile=certifi.where())

db = client["mediquery_db"]

users_collection = db["users"]
reports_collection = db["reports"]
chats_collection = db["chats"]

def test_connection():
    try:
        client.admin.command('ping')
        print("✅ Successfully connected to MongoDB!")
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False