"""
Ticket document model for SQLAlchemy (PostgreSQL/Supabase).
Includes pgvector embedding field for Atlas Vector Search replacement.
"""

import uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy import String, Float, DateTime
from pgvector.sqlalchemy import Vector
from datetime import datetime, timezone
from typing import Optional

from app.models.base import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # IT / HR / Finance / Admin
    urgency: Mapped[str] = mapped_column(String, default="Medium")
    status: Mapped[str] = mapped_column(String, default="Open")
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    assigned_to: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    ai_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ai_suggested_category: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    ai_suggested_urgency: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    resolution_note: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    embedding = mapped_column(Vector(768), nullable=True)  # pgvector
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
