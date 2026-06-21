"""
Notification API routes.
Updated to use SQLAlchemy (PostgreSQL).
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
import uuid

from app.models.notification import Notification
from app.models.profile import Profile
from app.core.security import get_current_user
from app.core.db import get_db

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
async def get_notifications(
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's notifications (most recent first)."""
    stmt = (
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    result = await db.execute(stmt)
    notifications = result.scalars().all()

    return {
        "notifications": [
            {
                "id": str(n.id),
                "ticket_id": str(n.ticket_id),
                "message": n.message,
                "read": n.read,
                "created_at": n.created_at.isoformat(),
            }
            for n in notifications
        ],
        "unread_count": sum(1 for n in notifications if not n.read),
    }


@router.patch("/{notification_id}/read")
async def mark_read(
    notification_id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark a notification as read."""
    result = await db.execute(select(Notification).where(Notification.id == notification_id))
    notif = result.scalars().first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notif.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    notif.read = True
    await db.commit()
    return {"status": "ok"}


@router.patch("/read-all")
async def mark_all_read(
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark all notifications as read."""
    stmt = (
        update(Notification)
        .where(Notification.user_id == current_user.id)
        .where(Notification.read == False)
        .values(read=True)
    )
    await db.execute(stmt)
    await db.commit()
    return {"status": "ok"}
