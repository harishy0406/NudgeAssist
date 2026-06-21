"""
AI Categorization — auto-classify tickets by department + urgency.
Uses Gemini or Groq via LangChain.
"""

import json
from typing import Optional
from app.core.config import settings


def get_llm():
    """Get the best available LLM."""
    if settings.GEMINI_API_KEY:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=settings.GEMINI_API_KEY,
                temperature=0.1,
            )
        except Exception as e:
            print(f"[AI] Gemini init failed: {e}")

    if settings.GROQ_API_KEY:
        try:
            from langchain_groq import ChatGroq
            return ChatGroq(
                model_name="llama-3.1-8b-instant",
                groq_api_key=settings.GROQ_API_KEY,
                temperature=0.1,
            )
        except Exception as e:
            print(f"[AI] Groq init failed: {e}")

    print("[AI] No LLM provider configured.")
    return None


async def categorize_ticket(description: str) -> dict:
    """
    Classify a ticket description into department + urgency + confidence.
    Returns: { category: str, urgency: str, confidence: float }
    """
    llm = get_llm()
    if not llm:
        return {"category": "IT", "urgency": "Medium", "confidence": 0.0}

    prompt = f"""You are a ticket classification system for an organization with these departments:
- IT (hardware, software, VPN, accounts, access, printers, laptops, network)
- HR (leave, payroll, benefits, onboarding, offboarding, policy, harassment)
- Finance (reimbursement, invoices, budget, procurement, expenses, travel claims)
- Admin (facilities, office supplies, ID cards, workspace, parking, cafeteria)

Classify this ticket description and determine its urgency:

TICKET: "{description}"

Respond ONLY with valid JSON (no markdown, no code blocks):
{{"category": "IT|HR|Finance|Admin", "urgency": "Low|Medium|High", "confidence": 0.0-1.0}}

Rules:
- confidence should reflect how clearly the description maps to the category
- High urgency: blocking work, security issues, payroll errors
- Medium urgency: degraded productivity, non-critical issues
- Low urgency: nice-to-have, general queries, suggestions"""

    try:
        response = await llm.ainvoke(prompt)
        content = response.content.strip()
        # Clean possible markdown wrapping
        if content.startswith("```"):
            content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        result = json.loads(content)

        # Validate
        valid_categories = ["IT", "HR", "Finance", "Admin"]
        valid_urgencies = ["Low", "Medium", "High"]

        if result.get("category") not in valid_categories:
            result["category"] = "IT"
        if result.get("urgency") not in valid_urgencies:
            result["urgency"] = "Medium"
        if not isinstance(result.get("confidence"), (int, float)):
            result["confidence"] = 0.5

        return result
    except Exception as e:
        print(f"[AI] Categorization error: {e}")
        return {"category": "IT", "urgency": "Medium", "confidence": 0.0}
