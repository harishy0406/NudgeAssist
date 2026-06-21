"""
Analytics API — aggregation pipelines for dashboard + AI weekly summary.
Updated to use SQLAlchemy (PostgreSQL).
"""

from fastapi import APIRouter, Depends
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, case, extract

from app.models.ticket import Ticket
from app.models.profile import Profile
from app.core.security import require_role
from app.core.db import get_db

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary")
async def get_summary(
    current_user: Profile = Depends(require_role("manager")),
    db: AsyncSession = Depends(get_db)
):
    """Dashboard metrics via SQL aggregations."""

    # 1. Tickets by department
    dept_stmt = select(Ticket.department, func.count(Ticket.id).label('count')).group_by(Ticket.department).order_by(func.count(Ticket.id).desc())
    dept_result = await db.execute(dept_stmt)
    by_dept = [{"department": row.department or "Unknown", "count": row.count} for row in dept_result]

    # 2. Tickets by status
    status_stmt = select(Ticket.status, func.count(Ticket.id).label('count')).group_by(Ticket.status)
    status_result = await db.execute(status_stmt)
    by_status = [{"status": row.status, "count": row.count} for row in status_result]

    # 3. Average resolution time (for resolved/closed tickets)
    # Postgres EXTRACT(EPOCH FROM (updated_at - created_at)) gets seconds
    res_stmt = select(
        func.avg(
            extract('epoch', Ticket.updated_at) - extract('epoch', Ticket.created_at)
        )
    ).where(Ticket.status.in_(["Resolved", "Closed"]))
    res_result = await db.execute(res_stmt)
    avg_seconds = res_result.scalar() or 0
    avg_resolution = avg_seconds / 3600.0

    # 4. AI categorization accuracy (% tickets where agent didn't override AI suggestion)
    ai_stmt = select(
        func.count(Ticket.id).label('total'),
        func.sum(case((Ticket.category == Ticket.ai_suggested_category, 1), else_=0)).label('correct')
    ).where(Ticket.ai_suggested_category != None)
    ai_result = await db.execute(ai_stmt)
    ai_row = ai_result.first()
    accuracy_pct = 0
    if ai_row and ai_row.total > 0:
        accuracy_pct = round((ai_row.correct / ai_row.total) * 100, 1)

    # 5. Department load (open vs resolved per department)
    load_stmt = select(Ticket.department, Ticket.status, func.count(Ticket.id)).group_by(Ticket.department, Ticket.status)
    load_result = await db.execute(load_stmt)
    dept_load = {}
    for row in load_result:
        dept = row.department or "Unknown"
        stat = row.status
        count = row.count
        if dept not in dept_load:
            dept_load[dept] = {}
        dept_load[dept][stat] = count

    # 6. Ticket trends (last 7 days)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    # Standard SQL grouping by date
    trend_stmt = select(
        func.date(Ticket.created_at).label('date'),
        func.count(Ticket.id).label('count')
    ).where(Ticket.created_at >= seven_days_ago).group_by(func.date(Ticket.created_at)).order_by(func.date(Ticket.created_at))
    trend_result = await db.execute(trend_stmt)
    trends = [{"date": str(row.date), "count": row.count} for row in trend_result]

    # 7. Total counts
    total_result = await db.execute(select(func.count(Ticket.id)))
    total_tickets = total_result.scalar() or 0

    open_result = await db.execute(select(func.count(Ticket.id)).where(Ticket.status == "Open"))
    open_tickets = open_result.scalar() or 0

    res_count_result = await db.execute(select(func.count(Ticket.id)).where(Ticket.status.in_(["Resolved", "Closed"])))
    resolved_tickets = res_count_result.scalar() or 0

    return {
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "resolved_tickets": resolved_tickets,
        "by_department": by_dept,
        "by_status": by_status,
        "avg_resolution_hours": round(avg_resolution, 1),
        "ai_accuracy_pct": accuracy_pct,
        "department_load": dept_load,
        "trends": trends,
    }


@router.get("/ai-weekly-summary")
async def ai_weekly_summary(
    current_user: Profile = Depends(require_role("manager")),
    db: AsyncSession = Depends(get_db)
):
    """Generate an AI-powered weekly summary of ticket trends."""
    try:
        # Get summary data first
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        result = await db.execute(select(Ticket).where(Ticket.created_at >= seven_days_ago))
        recent_tickets = result.scalars().all()

        total = len(recent_tickets)
        by_dept = {}
        by_status = {}
        by_urgency = {}

        for t in recent_tickets:
            dept = t.department or "Unknown"
            by_dept[dept] = by_dept.get(dept, 0) + 1
            by_status[t.status] = by_status.get(t.status, 0) + 1
            by_urgency[t.urgency] = by_urgency.get(t.urgency, 0) + 1

        stats_text = f"""
Weekly Ticket Statistics (last 7 days):
- Total tickets: {total}
- By department: {dict(by_dept)}
- By status: {dict(by_status)}
- By urgency: {dict(by_urgency)}
"""

        from app.ai.categorize import get_llm
        llm = get_llm()
        if llm:
            prompt = f"""You are an executive reporting assistant for NudgeAssist, an internal support platform at The/Nudge Institute.

Generate a concise, insightful weekly summary for leadership based on these ticket statistics:

{stats_text}

Format the summary as:
1. Key highlights (2-3 bullet points)
2. Notable trends or concerns
3. Recommendations

Keep it professional, data-driven, and actionable. Use specific numbers from the data."""

            response = await llm.ainvoke(prompt)
            return {"summary": response.content, "stats": stats_text}
        else:
            return {
                "summary": f"AI summary unavailable. Raw stats:\n{stats_text}",
                "stats": stats_text,
            }

    except Exception as e:
        print(f"[AI] Weekly summary failed: {e}")
        return {
            "summary": f"Failed to generate AI summary: {str(e)}",
            "stats": "",
        }
