"""
AI Draft Response Generator — RAG-augmented agent copilot.
Generates suggested first responses grounded in similar resolved tickets.
"""

from app.ai.similarity import find_similar_tickets
from app.ai.categorize import get_llm
from app.models.ticket import Ticket


from sqlalchemy.ext.asyncio import AsyncSession

async def generate_draft_response(ticket: Ticket, db: AsyncSession) -> dict:
    """
    Generate a draft response for an agent, grounded in similar resolved tickets.
    """
    # Fetch similar resolved tickets for context
    similar = await find_similar_tickets(ticket.description, db, k=3)

    context = ""
    ticket_ids = []
    for s in similar:
        if s.get("resolution_note"):
            context += f"\nSimilar Ticket: {s['title']}\nResolution: {s['resolution_note']}\n---"
            ticket_ids.append(s["id"])

    llm = get_llm()
    if not llm:
        return {
            "draft": "AI draft generation is currently unavailable. Please compose your response manually.",
            "based_on_tickets": [],
        }

    prompt = f"""You are a helpful support agent at The/Nudge Institute. 
Draft a professional, empathetic first response to this internal support ticket.

TICKET:
Title: {ticket.title}
Description: {ticket.description}
Category: {ticket.category}
Urgency: {ticket.urgency}

{f"SIMILAR PAST RESOLUTIONS (for reference):{context}" if context else "No similar past tickets found."}

Guidelines:
1. Acknowledge the issue clearly
2. If similar past resolutions exist, use them to suggest a solution
3. If the issue needs investigation, explain next steps
4. Keep the tone professional but warm
5. Be concise (3-5 sentences)
6. Don't include subject lines or signatures — just the response body"""

    try:
        response = await llm.ainvoke(prompt)
        return {
            "draft": response.content.strip(),
            "based_on_tickets": ticket_ids,
        }
    except Exception as e:
        print(f"[AI] Draft generation error: {e}")
        return {
            "draft": "Unable to generate draft at this time.",
            "based_on_tickets": [],
        }
