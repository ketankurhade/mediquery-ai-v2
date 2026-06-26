from fastapi import APIRouter, HTTPException, Depends
from models.user import UserCreate, UserLogin, TokenResponse
from database import users_collection
from utils.auth_utils import hash_password, verify_password, create_access_token
from utils.dependencies import get_current_user
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", status_code=201)
def register(user: UserCreate):
    # Check if email already exists
    existing = users_collection.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    
    # Hash the password
    hashed = hash_password(user.password)
    
    # Save new user
    new_user = {
        "name": user.name,
        "email": user.email,
        "password": hashed,
        "created_at": datetime.utcnow()
    }
    result = users_collection.insert_one(new_user)
    
    return {
        "message": "Account created successfully",
        "user_id": str(result.inserted_id)
    }

@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin):
    # Find user by email
    user = users_collection.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create JWT token
    token = create_access_token(str(user["_id"]))
    
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """Test route - returns current logged-in user's info."""
    return {
        "id": str(current_user["_id"]),
        "name": current_user["name"],
        "email": current_user["email"]
    }

@router.delete("/me", status_code=204)
def delete_account(current_user: dict = Depends(get_current_user)):
    """Delete the logged-in user's account and all their data."""
    from database import reports_collection, chats_collection
    
    user_id = str(current_user["_id"])
    
    # Delete all reports
    reports_collection.delete_many({"user_id": user_id})
    
    # Delete all chats
    chats_collection.delete_many({"user_id": user_id})
    
    # Delete the user account
    users_collection.delete_one({"_id": current_user["_id"]})
    
    return None