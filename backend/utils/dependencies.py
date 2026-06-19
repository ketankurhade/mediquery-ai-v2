from fastapi import Header, HTTPException
from bson import ObjectId
from database import users_collection
from utils.auth_utils import decode_access_token

def get_current_user(authorization: str = Header(None)):
    """Extract and verify JWT token, return the logged-in user."""
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization header"
        )
    
    token = authorization.split(" ")[1]
    
    try:
        user_id = decode_access_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid user ID")
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user