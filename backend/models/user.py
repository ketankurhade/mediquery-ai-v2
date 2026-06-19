from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# What the client sends when registering
class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)

# What the client sends when logging in
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# What we send back (never include password!)
class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime

# Token response after successful login
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"