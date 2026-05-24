from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Optional
from generation import call_llm_json

router = APIRouter(prefix="/trust")

class TrustDimensions(BaseModel):
    reliability: float
    communication: float
    delivery: float
    collaboration: float

class TrustProfileRequest(BaseModel):
    userId: str
    role: str
    overallScore: float
    rank: str
    dimensions: TrustDimensions
    percentile: float
    trend: str
    volatilityIndex: float

class TrustExplanationResponse(BaseModel):
    explanation: str
    risksDetected: List[str]
    growthOpportunities: List[str]

@router.post("/explain", response_model=TrustExplanationResponse)
def explain_trust_profile(profile: TrustProfileRequest):
    """
    Analyzes a multi-dimensional Trust Profile and generates behavioral intelligence.
    Uses LLM if available; otherwise falls back to a deterministic, data-driven fallback.
    """
    try:
        system_prompt = (
            "You are a professional reputation systems engineer and talent development coach.\n"
            "Analyze a user's trust profile (overall score, dimensions: reliability, communication, delivery, collaboration, trend, volatility) to generate behavioral intelligence.\n"
            "Generate:\n"
            "- explanation (string): A professional, evidence-backed reasoning explanation (2 sentences).\n"
            "- risksDetected (list of strings): 1-3 behavioral risks based on the profile inputs.\n"
            "- growthOpportunities (list of strings): 1-3 strategic growth suggestions.\n"
            "Examples of explanation: 'Repeated on-time workflow completion increased reliability confidence.' 'Strong communication reviews improved marketplace ranking.'\n"
            "Keep explanations concise, strategic, and believable.\n"
            "You must return a JSON object matching the requested schema."
        )
        
        user_payload = profile.model_dump()
        
        llm_result = call_llm_json(system_prompt, user_payload, {
            "type": "object",
            "properties": {
                "explanation": {"type": "string"},
                "risksDetected": {"type": "array", "items": {"type": "string"}},
                "growthOpportunities": {"type": "array", "items": {"type": "string"}}
            },
            "required": ["explanation", "risksDetected", "growthOpportunities"],
            "additionalProperties": False
        })
        
        if llm_result:
            return TrustExplanationResponse(
                explanation=llm_result.get("explanation", ""),
                risksDetected=llm_result.get("risksDetected", []),
                growthOpportunities=llm_result.get("growthOpportunities", [])
            )
            
    except Exception as e:
        print(f"Error calling LLM for trust explanation: {e}")

    # Fallback (deterministic)
    explanation = ""
    risks = []
    growth = []
    
    dims = profile.dimensions
    
    if profile.trend == "improving":
        explanation += "Your marketplace credibility is growing. Repeated on-time workflow completion has increased reliability confidence. "
    elif profile.trend == "declining":
        explanation += "Recent activity has impacted your marketplace confidence. Decreased response times have created workflow friction. "
    else:
        explanation += "Your reputation remains stable. Consistent communication reviews have sustained your marketplace ranking. "
        
    explanation += f"Currently in the Top {int(100 - profile.percentile)}% for overall reliability."
    
    lowest_dim = min([
        ("reliability", dims.reliability),
        ("communication", dims.communication),
        ("delivery", dims.delivery),
        ("collaboration", dims.collaboration)
    ], key=lambda x: x[1])
    
    highest_dim = max([
        ("reliability", dims.reliability),
        ("communication", dims.communication),
        ("delivery", dims.delivery),
        ("collaboration", dims.collaboration)
    ], key=lambda x: x[1])
    
    if highest_dim[1] > 85:
        explanation += f" Strong performance in {highest_dim[0]} boosts your profile's recommendations."
        
    if lowest_dim[1] < 75:
        explanation += f" Improving consistent {lowest_dim[0]} will unlock further ranking potential."
        
    # Risks
    if profile.volatilityIndex > 20:
        risks.append("Erratic task completion patterns detected. This lowers business hiring confidence.")
    if dims.communication < 75:
        risks.append("Delayed responses are creating workflow friction.")
    if dims.delivery < 75:
        risks.append("Missed deadlines observed in recent workflows. Abandonment risk flagged.")
        
    # Growth
    if lowest_dim[0] == "communication":
        growth.append("Maintain a <2 hour response time on new messages to quickly recover your score.")
    elif lowest_dim[0] == "delivery":
        growth.append("Deliver your next 3 milestones on or before the due date to unlock Gold status.")
    else:
        growth.append("Ensure tasks are marked 'Completed' reliably without prolonged inactivity.")
        
    if not growth:
        growth.append("Maintain your current consistency to reach the Elite tier.")
    if not risks:
        risks.append("No critical behavioral risks detected.")
        
    return TrustExplanationResponse(
        explanation=explanation.strip(),
        risksDetected=risks,
        growthOpportunities=growth
    )
