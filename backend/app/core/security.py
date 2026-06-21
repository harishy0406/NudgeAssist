"""
Security module — Supabase Auth JWT verification and dependencies.
"""

from typing import List, Optional
import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.db import get_db
from app.models.profile import Profile

# Bearer token scheme
security = HTTPBearer()

import urllib.request
import json
import time

_jwks_cache = None
_jwks_cache_time = 0
JWKS_CACHE_TTL = 3600  # cache for 1 hour

def get_jwks() -> dict:
    global _jwks_cache, _jwks_cache_time
    now = time.time()
    if _jwks_cache is None or now - _jwks_cache_time > JWKS_CACHE_TTL:
        try:
            url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
            with urllib.request.urlopen(url, timeout=5) as response:
                _jwks_cache = json.loads(response.read().decode())
                _jwks_cache_time = now
        except Exception as e:
            # If fetch fails but we have cached version, use it as fallback
            if _jwks_cache:
                print(f"[Security] Failed to refresh JWKS, using cached version: {e}")
            else:
                raise e
    return _jwks_cache

def verify_supabase_token(token: str) -> str:
    """Decode Supabase JWT and return user ID (sub)."""
    try:
        # Try JWKS verification first (ES256 asymmetric)
        try:
            header = jwt.get_unverified_header(token)
            kid = header.get("kid")
            if kid:
                jwks = get_jwks()
                jwk_key = next((k for k in jwks["keys"] if k["kid"] == kid), None)
                if jwk_key:
                    payload = jwt.decode(
                        token,
                        jwk_key,
                        algorithms=["ES256", "RS256"],
                        audience="authenticated"
                    )
                    user_id: str = payload.get("sub")
                    if user_id:
                        return user_id
        except Exception as jwks_err:
            print(f"[Security] JWKS verification bypassed or failed: {jwks_err}. Trying HS256 fallback...")

        # Fallback: legacy HS256 symmetric verification with SUPABASE_JWT_SECRET
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise ValueError("Token missing sub claim")
        return user_id
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Profile:
    """Decode JWT and return the current user profile from DB."""
    token = credentials.credentials
    user_id_str = verify_supabase_token(token)
    
    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user ID format")
    
    result = await db.execute(select(Profile).where(Profile.id == user_id))
    profile = result.scalars().first()
    
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User profile not found. Did you call /profile/bootstrap?",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return profile


def require_role(*allowed_roles: str):
    """Dependency factory: restrict access to specific roles."""
    async def role_checker(current_user: Profile = Depends(get_current_user)) -> Profile:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(allowed_roles)}",
            )
        return current_user
    return role_checker
