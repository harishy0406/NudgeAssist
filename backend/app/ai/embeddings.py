"""
Embedding generation and storage for ticket similarity search.
"""

from typing import List, Optional
from app.core.config import settings


async def get_embedding(text: str) -> Optional[List[float]]:
    """Generate embedding vector for text."""
    if settings.GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            result = genai.embed_content(
                model="models/gemini-embedding-2",
                content=text,
                output_dimensionality=768,
            )
            return result["embedding"]
        except Exception as e:
            print(f"[AI] Gemini embedding failed: {e}")

    # Fallback: use sentence-transformers (local, free)
    try:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer("all-mpnet-base-v2")
        embedding = model.encode(text).tolist()
        return embedding
    except Exception as e:
        print(f"[AI] Local embedding failed: {e}")
        return None


async def compute_and_store_embedding(ticket_id, description: str):
    """Compute embedding and store it on the ticket document."""
    from app.models.ticket import Ticket
    from app.core.db import async_session_maker
    from sqlalchemy.future import select

    embedding = await get_embedding(description)
    if embedding:
        async with async_session_maker() as session:
            result = await session.execute(select(Ticket).where(Ticket.id == ticket_id))
            ticket = result.scalars().first()
            if ticket:
                ticket.embedding = embedding
                await session.commit()
                print(f"[AI] Stored embedding for ticket {ticket_id} (dim={len(embedding)})")
