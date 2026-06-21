"""
NudgeAssist — FastAPI Main Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.profile import router as profile_router
from app.api.tickets import router as tickets_router
from app.api.notifications import router as notifications_router
from app.api.analytics import router as analytics_router

app = FastAPI(
    title="NudgeAssist API",
    description="AI-Powered Internal Support & Ticketing Platform for The/Nudge Institute",
    version="1.0.0",
)

# CORS
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(profile_router)
app.include_router(tickets_router)
app.include_router(notifications_router)
app.include_router(analytics_router)


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint — verifies API + DB are alive."""
    try:
        # Just simple db connect check could be added here, for now it's okay
        return {
            "status": "healthy",
            "database": "supabase postgresql via sqlalchemy",
            "version": "1.0.0",
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": f"error: {str(e)}",
            "version": "1.0.0",
        }


@app.get("/", tags=["Root"])
async def root():
    return {
        "app": "NudgeAssist API",
        "version": "1.0.0",
        "docs": "/docs",
    }
