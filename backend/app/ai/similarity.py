"""
Similar ticket retrieval using pgvector in PostgreSQL (Supabase).
Falls back to text-based search if vector search is unavailable.
"""

from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.ai.embeddings import get_embedding
from app.models.ticket import Ticket


async def find_similar_tickets(
    description: str,
    db: AsyncSession,
    status_filter: str = "Resolved",
    k: int = 3,
) -> List[Dict]:
    """
    Find similar resolved tickets using pgvector cosine similarity search.
    Falls back to text-based search if vector search is unavailable.
    """
    results = []

    # Try pgvector search first
    try:
        embedding = await get_embedding(description)
        if embedding:
            # Ticket.embedding.cosine_distance(embedding) -> the smaller the distance, the more similar
            # Using <-> operator in pgvector via cosine_distance
            stmt = (
                select(Ticket, Ticket.embedding.cosine_distance(embedding).label('distance'))
                .where(Ticket.status.in_(["Resolved", "Closed"]))
                .where(Ticket.embedding != None)
                .order_by(Ticket.embedding.cosine_distance(embedding))
                .limit(k)
            )
            
            res = await db.execute(stmt)
            for row in res:
                ticket = row.Ticket
                distance = row.distance
                # Convert distance to a similarity score between 0 and 1
                # cosine distance is 1 - cosine_similarity. So similarity = 1 - distance
                score = max(0.0, 1.0 - distance)
                
                results.append({
                    "id": str(ticket.id),
                    "title": ticket.title,
                    "description": ticket.description[:200],
                    "category": ticket.category,
                    "resolution_note": ticket.resolution_note or "",
                    "score": round(score, 3),
                })

            if results:
                return results
    except Exception as e:
        print(f"[AI] pgvector search failed (falling back to text): {e}")

    # Fallback: simple text search
    try:
        stmt = select(Ticket).where(Ticket.status.in_(["Resolved", "Closed"])).limit(k * 3)
        res = await db.execute(stmt)
        tickets = res.scalars().all()

        # Simple keyword matching
        desc_words = set(description.lower().split())
        scored = []
        for t in tickets:
            t_words = set(t.description.lower().split())
            overlap = len(desc_words & t_words)
            if overlap > 0:
                score = overlap / max(len(desc_words), 1)
                scored.append((t, score))

        scored.sort(key=lambda x: x[1], reverse=True)

        for t, score in scored[:k]:
            results.append({
                "id": str(t.id),
                "title": t.title,
                "description": t.description[:200],
                "category": t.category,
                "resolution_note": t.resolution_note or "",
                "score": round(score, 3),
            })
    except Exception as e:
        print(f"[AI] Text search fallback also failed: {e}")

    return results
