"""
Ticket API routes — full CRUD + lifecycle management + AI features.
Updated to use SQLAlchemy (PostgreSQL).
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query, BackgroundTasks
from typing import Optional
from datetime import datetime, timezone
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.models.profile import Profile
from app.models.ticket import Ticket
from app.models.ticket_event import TicketEvent
from app.models.notification import Notification
from app.schemas.ticket import (
    TicketCreate,
    TicketStatusUpdate,
    TicketResponse,
    TicketListResponse,
    TicketEventResponse,
    SimilarTicketResponse,
    DraftResponseResult,
)
from app.core.security import get_current_user, require_role
from app.core.db import get_db
from app.core.email import send_status_email

router = APIRouter(prefix="/tickets", tags=["Tickets"])

# Valid status transitions
VALID_TRANSITIONS = {
    "Open": ["In Progress"],
    "In Progress": ["Resolved", "Open"],
    "Resolved": ["Closed", "In Progress"],
    "Closed": [],
}


def ticket_to_response(ticket: Ticket, creator_name: str = None, assignee_name: str = None) -> TicketResponse:
    """Convert Ticket model to response schema."""
    return TicketResponse(
        id=ticket.id,
        title=ticket.title,
        description=ticket.description,
        category=ticket.category,
        urgency=ticket.urgency,
        status=ticket.status,
        created_by=ticket.created_by,
        created_by_name=creator_name,
        assigned_to=ticket.assigned_to,
        assigned_to_name=assignee_name,
        department=ticket.department,
        ai_confidence=ticket.ai_confidence,
        ai_suggested_category=ticket.ai_suggested_category,
        ai_suggested_urgency=ticket.ai_suggested_urgency,
        resolution_note=ticket.resolution_note,
        # Similar tickets are computed on demand by /tickets/similar and are
        # not persisted on the Ticket model.
        similar_tickets=None,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
    )


@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    data: TicketCreate,
    background_tasks: BackgroundTasks,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new ticket. Triggers AI categorization if available."""
    # Try AI categorization
    ai_category = None
    ai_urgency = None
    ai_confidence = None

    try:
        from app.ai.categorize import categorize_ticket
        result = await categorize_ticket(data.description)
        ai_category = result.get("category")
        ai_urgency = result.get("urgency")
        ai_confidence = result.get("confidence")
    except Exception as e:
        print(f"[AI] Categorization failed (non-blocking): {e}")

    # Use AI suggestion if user didn't specify, otherwise respect user's choice
    final_category = data.category or ai_category or "IT"
    final_urgency = data.urgency or ai_urgency or "Medium"
    department = data.department or final_category  # Department maps to category

    ticket = Ticket(
        title=data.title,
        description=data.description,
        category=final_category,
        urgency=final_urgency,
        status="Open",
        created_by=current_user.id,
        department=department,
        ai_confidence=ai_confidence,
        ai_suggested_category=ai_category,
        ai_suggested_urgency=ai_urgency,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)

    # Try to compute embedding in background
    try:
        from app.ai.embeddings import compute_and_store_embedding
        background_tasks.add_task(compute_and_store_embedding, ticket.id, data.description)
    except Exception as e:
        print(f"[AI] Embedding computation failed (non-blocking): {e}")

    # Log creation event
    event = TicketEvent(
        ticket_id=ticket.id,
        old_status=None,
        new_status="Open",
        actor_id=current_user.id
    )
    db.add(event)
    await db.commit()

    return ticket_to_response(ticket, creator_name=current_user.name)


@router.get("", response_model=TicketListResponse)
async def list_tickets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    category: Optional[str] = None,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List tickets filtered by user role."""
    
    stmt = select(Ticket)
    count_stmt = select(func.count(Ticket.id))
    
    # Role-based filtering
    if current_user.role == "employee":
        stmt = stmt.where(Ticket.created_by == current_user.id)
        count_stmt = count_stmt.where(Ticket.created_by == current_user.id)
    elif current_user.role == "agent":
        if current_user.department:
            stmt = stmt.where(Ticket.department == current_user.department)
            count_stmt = count_stmt.where(Ticket.department == current_user.department)
    # manager sees all

    if status_filter:
        stmt = stmt.where(Ticket.status == status_filter)
        count_stmt = count_stmt.where(Ticket.status == status_filter)
    if category:
        stmt = stmt.where(Ticket.category == category)
        count_stmt = count_stmt.where(Ticket.category == category)

    total_result = await db.execute(count_stmt)
    total = total_result.scalar()

    stmt = stmt.order_by(Ticket.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    tickets = result.scalars().all()

    # Fetch names
    # For a real production app, use joinedload, but this is fine for this scale
    responses = []
    for t in tickets:
        creator = await db.execute(select(Profile).where(Profile.id == t.created_by))
        creator_prof = creator.scalars().first()
        
        assignee_prof = None
        if t.assigned_to:
            assignee = await db.execute(select(Profile).where(Profile.id == t.assigned_to))
            assignee_prof = assignee.scalars().first()
            
        responses.append(
            ticket_to_response(
                t,
                creator_name=creator_prof.name if creator_prof else None,
                assignee_name=assignee_prof.name if assignee_prof else None,
            )
        )

    return TicketListResponse(
        tickets=responses,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/similar")
async def get_similar_tickets(
    desc: str = Query(..., min_length=10),
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Find similar resolved tickets using pgvector."""
    try:
        from app.ai.similarity import find_similar_tickets
        results = await find_similar_tickets(desc, db)
        return {"similar_tickets": results}
    except Exception as e:
        print(f"[AI] Similarity search failed: {e}")
        return {"similar_tickets": []}


@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(
    ticket_id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get ticket detail."""
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Access control
    if current_user.role == "employee" and ticket.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == "agent" and ticket.department != current_user.department:
        raise HTTPException(status_code=403, detail="Access denied — different department")

    creator = await db.execute(select(Profile).where(Profile.id == ticket.created_by))
    creator_prof = creator.scalars().first()
    
    assignee_prof = None
    if ticket.assigned_to:
        assignee = await db.execute(select(Profile).where(Profile.id == ticket.assigned_to))
        assignee_prof = assignee.scalars().first()

    return ticket_to_response(
        ticket,
        creator_name=creator_prof.name if creator_prof else None,
        assignee_name=assignee_prof.name if assignee_prof else None,
    )


@router.get("/{ticket_id}/events")
async def get_ticket_events(
    ticket_id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get ticket event history."""
    stmt = select(TicketEvent).where(TicketEvent.ticket_id == ticket_id).order_by(TicketEvent.timestamp)
    result = await db.execute(stmt)
    events = result.scalars().all()

    return [
        TicketEventResponse(
            id=e.id,
            ticket_id=e.ticket_id,
            old_status=e.old_status,
            new_status=e.new_status,
            actor_id=e.actor_id,
            note="",
            timestamp=e.timestamp,
        )
        for e in events
    ]


@router.patch("/{ticket_id}/status", response_model=TicketResponse)
async def update_ticket_status(
    ticket_id: uuid.UUID,
    data: TicketStatusUpdate,
    background_tasks: BackgroundTasks,
    current_user: Profile = Depends(require_role("agent", "manager")),
    db: AsyncSession = Depends(get_db)
):
    """Update ticket status through the lifecycle."""
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Validate transition
    allowed = VALID_TRANSITIONS.get(ticket.status, [])
    if data.status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition: {ticket.status} → {data.status}. Allowed: {allowed}",
        )

    old_status = ticket.status
    ticket.status = data.status

    if data.resolution_note:
        ticket.resolution_note = data.resolution_note

    # Auto-assign agent if not already assigned
    if not ticket.assigned_to and current_user.role == "agent":
        ticket.assigned_to = current_user.id

    # Log event
    event = TicketEvent(
        ticket_id=ticket.id,
        old_status=old_status,
        new_status=data.status,
        actor_id=current_user.id
    )
    db.add(event)

    # Create in-app notification for ticket creator
    notification = Notification(
        user_id=ticket.created_by,
        ticket_id=ticket.id,
        message=f"Your ticket \"{ticket.title}\" was updated: {old_status} → {data.status}",
    )
    db.add(notification)
    
    await db.commit()
    await db.refresh(ticket)

    # Send email notification in background
    creator_res = await db.execute(select(Profile).where(Profile.id == ticket.created_by))
    creator = creator_res.scalars().first()
    
    # Needs a mock email for the profile since Supabase profiles table doesn't have email.
    # Typically you'd fetch it from Supabase auth admin, but for this demo, we'll bypass if none.
    # In a full app, Profile would cache email or we'd query it.
    
    # We will skip email or just log it if we don't have the user's email in the DB.

    return ticket_to_response(ticket, creator_name=creator.name if creator else None)


@router.patch("/{ticket_id}/assign", response_model=TicketResponse)
async def assign_ticket(
    ticket_id: uuid.UUID,
    current_user: Profile = Depends(require_role("agent", "manager")),
    db: AsyncSession = Depends(get_db)
):
    """Assign ticket to the current agent."""
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket.assigned_to = current_user.id
    await db.commit()
    await db.refresh(ticket)

    return ticket_to_response(ticket)


@router.get("/{ticket_id}/draft-response")
async def get_draft_response(
    ticket_id: uuid.UUID,
    current_user: Profile = Depends(require_role("agent", "manager")),
    db: AsyncSession = Depends(get_db)
):
    """Generate an AI draft response for this ticket (agent copilot)."""
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    try:
        from app.ai.draft_response import generate_draft_response
        draft_result = await generate_draft_response(ticket, db)
        return draft_result
    except Exception as e:
        print(f"[AI] Draft response generation failed: {e}")
        return {"draft": "Unable to generate AI draft at this time. Please compose your response manually.", "based_on_tickets": []}
