"""
Pydantic schemas for ticket operations.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal, List
from datetime import datetime
import uuid


# --- Request schemas ---

class TicketCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    category: Optional[str] = None  # Can be auto-filled by AI
    urgency: Optional[Literal["Low", "Medium", "High"]] = None
    department: Optional[str] = None


class TicketStatusUpdate(BaseModel):
    status: Literal["Open", "In Progress", "Resolved", "Closed"]
    note: Optional[str] = ""
    resolution_note: Optional[str] = None


class TicketAssign(BaseModel):
    assigned_to: uuid.UUID  # Agent user ID


# --- Response schemas ---

class TicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    title: str
    description: str
    category: Optional[str] = None
    urgency: str
    status: str
    created_by: uuid.UUID
    created_by_name: Optional[str] = None
    assigned_to: Optional[uuid.UUID] = None
    assigned_to_name: Optional[str] = None
    department: Optional[str] = None
    ai_confidence: Optional[float] = None
    ai_suggested_category: Optional[str] = None
    ai_suggested_urgency: Optional[str] = None
    resolution_note: Optional[str] = None
    similar_tickets: Optional[List[uuid.UUID]] = None
    created_at: datetime
    updated_at: datetime


class TicketListResponse(BaseModel):
    tickets: List[TicketResponse]
    total: int
    page: int
    page_size: int


class AICategorizationResponse(BaseModel):
    category: str
    urgency: str
    confidence: float


class SimilarTicketResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    category: Optional[str] = None
    resolution_note: Optional[str] = None
    score: float


class DraftResponseResult(BaseModel):
    draft: str
    based_on_tickets: List[uuid.UUID]


class TicketEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    ticket_id: uuid.UUID
    old_status: Optional[str] = None
    new_status: str
    actor_id: uuid.UUID
    note: str
    timestamp: datetime
