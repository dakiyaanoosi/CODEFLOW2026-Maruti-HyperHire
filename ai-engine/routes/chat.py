from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from chat_engine import generate_chat_response
from generation import call_llm_json
import logging
import json

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    pageContext: Optional[str] = None
    userRole: Optional[str] = "student"
    activeJob: Optional[Dict[str, Any]] = None
    activeProfile: Optional[Dict[str, Any]] = None
    activePortfolio: Optional[List[Dict[str, Any]]] = None
    activeApplication: Optional[Dict[str, Any]] = None
    recommendationState: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    response: str
    suggestions: Optional[List[str]] = []
    quickActions: Optional[List[str]] = []
    reasoningHighlights: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# LLM system prompt builder
# ---------------------------------------------------------------------------

def _build_system_prompt(req: ChatRequest) -> str:
    role = req.userRole or "student"
    page = req.pageContext or "/dashboard"

    context_lines = [f"User Role: {role}", f"Current Page: {page}"]

    if req.activeJob:
        job = req.activeJob
        context_lines.append(
            f"Active Job: {job.get('title')} | Category: {job.get('category')} | "
            f"Budget: ₹{job.get('budget', 0)} | Skills: {', '.join(job.get('requiredSkills', []))}"
        )

    if req.activeProfile:
        p = req.activeProfile
        context_lines.append(
            f"Active Profile: {p.get('name')} | Skills: {', '.join(p.get('skills', [])[:8])} | "
            f"Trust: {p.get('trustScore', 80)} | Strength: {p.get('profileStrength', 0)}% | "
            f"Exp: {p.get('experienceLevel', 'Intermediate')}"
        )

    if req.activePortfolio:
        titles = [p.get("title", "") for p in req.activePortfolio[:3]]
        context_lines.append(f"Portfolio Items: {', '.join(titles)}")

    if req.recommendationState:
        rs = req.recommendationState
        context_lines.append(
            f"AI Score: {rs.get('match_percentage', 'N/A')}% match, "
            f"Confidence: {int((rs.get('confidence_score', 0)) * 100)}%"
        )

    context_block = "\n".join(context_lines)

    persona = (
        "You are HyperAI, a premium AI hiring strategist and career intelligence assistant "
        "built into the HyperHire workforce platform. "
    )

    if role == "business":
        persona += (
            "You specialize in helping businesses optimize their job descriptions, "
            "understand AI-ranked candidate quality, improve hiring requirements, "
            "and predict application outcomes. You think like a senior talent acquisition strategist."
        )
    else:
        persona += (
            "You specialize in helping students and freelancers optimize their profiles, "
            "understand AI match scores, discover trending skills, improve portfolio depth, "
            "and win more gigs. You think like a senior career advisor and recruitment expert."
        )

    return (
        f"{persona}\n\n"
        "CONTEXT (live platform state):\n"
        f"{context_block}\n\n"
        "INSTRUCTIONS:\n"
        "- Be contextual and specific — reference the actual job/profile data above, not generic advice.\n"
        "- Use markdown formatting: headers (##), bold (**), bullet lists.\n"
        "- Be concise and actionable — every response should include a clear next step.\n"
        "- Never fabricate numbers — use the context data provided.\n"
        "- Respond as if you are an expert co-pilot embedded in the platform, not a generic chatbot.\n"
        "- Return a JSON object with keys: response (string, markdown), suggestions (array of 2-3 short strings), "
        "quickActions (array of 3-5 action labels from the platform), reasoningHighlights (object or null)."
    )


# ---------------------------------------------------------------------------
# LLM response schema
# ---------------------------------------------------------------------------

CHAT_SCHEMA = {
    "type": "object",
    "properties": {
        "response": {"type": "string"},
        "suggestions": {
            "type": "array",
            "items": {"type": "string"}
        },
        "quickActions": {
            "type": "array",
            "items": {"type": "string"}
        },
        "reasoningHighlights": {
            "type": ["object", "null"],
            "additionalProperties": True
        },
    },
    "required": ["response", "suggestions", "quickActions", "reasoningHighlights"],
    "additionalProperties": False,
}


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    """
    HyperAI contextual chat endpoint.
    Attempts to use an LLM (OpenAI / Gemini) for rich responses.
    Falls back to the rule-based chat_engine if no LLM key is configured.
    """
    try:
        # Build history for the LLM
        history_dicts = [{"role": m.role, "content": m.content} for m in (req.history or [])]

        system_prompt = _build_system_prompt(req)
        user_payload = {
            "message": req.message,
            "recentHistory": history_dicts[-6:],  # last 3 turns for context
        }

        # Try LLM first
        llm_result = call_llm_json(system_prompt, user_payload, CHAT_SCHEMA)

        if llm_result and "response" in llm_result:
            logger.info("HyperAI /chat: LLM response generated successfully.")
            return ChatResponse(
                response=llm_result.get("response", ""),
                suggestions=llm_result.get("suggestions", []),
                quickActions=llm_result.get("quickActions", []),
                reasoningHighlights=llm_result.get("reasoningHighlights"),
            )

        # Fallback to rule-based engine
        logger.info("HyperAI /chat: Using rule-based fallback engine (no LLM key or LLM error).")
        result = generate_chat_response(
            message=req.message,
            history=history_dicts,
            page_context=req.pageContext,
            user_role=req.userRole,
            active_job=req.activeJob,
            active_profile=req.activeProfile,
            active_portfolio=req.activePortfolio,
            active_application=req.activeApplication,
            recommendation_state=req.recommendationState,
        )

        return ChatResponse(
            response=result["response"],
            suggestions=result.get("suggestions", []),
            quickActions=result.get("quickActions", []),
            reasoningHighlights=result.get("reasoningHighlights"),
        )

    except Exception as e:
        logger.exception("Error in /chat endpoint")
        raise HTTPException(status_code=500, detail=str(e))
