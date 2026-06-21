"""
NudgeAssist — Configuration module.
Loads environment variables via pydantic-settings.
"""

from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional


class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str = "https://your-project.supabase.co"
    SUPABASE_DB_URL: str = "postgresql+asyncpg://postgres:pass@db.your-project.supabase.co:5432/postgres"

    @field_validator("SUPABASE_DB_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if isinstance(v, str):
            if v.startswith("postgresql://"):
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+asyncpg://", 1)
        return v
    
    SUPABASE_JWT_SECRET: str = "your-supabase-jwt-secret"

    # LLM API Keys
    GEMINI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None

    # SMTP (Gmail)
    SMTP_USER: Optional[str] = None
    SMTP_PASS: Optional[str] = None
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"
    # Permit local Next.js development regardless of whether it is opened via
    # localhost, 127.0.0.1, or a fallback port selected by Next.js.
    CORS_ORIGIN_REGEX: str = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
