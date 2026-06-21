"""
Database connection module.
Initializes SQLAlchemy async engine and provides a get_db session dependency.
"""

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from typing import AsyncGenerator

from app.core.config import settings

# Create the async engine
engine = create_async_engine(
    settings.SUPABASE_DB_URL,
    echo=False,
    pool_size=5,
    max_overflow=10,
)

# Create the async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that provides an async database session per request."""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
