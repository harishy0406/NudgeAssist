"""
Profile API — GET /me and POST /profile/bootstrap
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.db import get_db
from app.core.security import security, verify_supabase_token, get_current_user
from app.models.profile import Profile
from fastapi.security import HTTPAuthorizationCredentials
import uuid
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/profile", tags=["Profile"])

class BootstrapRequest(BaseModel):
    name: str
    role: str = "employee"
    department: Optional[str] = None

@router.get("/me")
async def get_me(current_user: Profile = Depends(get_current_user)):
    """Return the current logged in user's profile."""
    return {
        "id": current_user.id,
        "name": current_user.name,
        "role": current_user.role,
        "department": current_user.department,
    }

@router.post("/bootstrap")
async def bootstrap_profile(
    request: BootstrapRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """
    Called once after a new Supabase Auth signup to create the matching profile row.
    """
    token = credentials.credentials
    user_id_str = verify_supabase_token(token)
    user_id = uuid.UUID(user_id_str)
    
    # Check if already exists
    result = await db.execute(select(Profile).where(Profile.id == user_id))
    existing = result.scalars().first()
    
    if existing:
        return {"message": "Profile already exists", "profile": existing.id}
    
    new_profile = Profile(
        id=user_id,
        name=request.name,
        role=request.role,
        department=request.department
    )
    db.add(new_profile)
    await db.commit()
    return {"message": "Profile created successfully"}
