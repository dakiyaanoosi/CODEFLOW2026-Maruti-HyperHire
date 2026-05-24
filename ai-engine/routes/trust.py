from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Optional
import math

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
    Uses deterministic heuristic logic tailored to the score inputs to simulate AI inference.
    """
    
    explanation = ""
    risks = []
    growth = []
    
    dims = profile.dimensions
    
    # 1. Base Explanation based on trend and overall score
    if profile.trend == "improving":
        explanation += "Your marketplace credibility is growing. "
    elif profile.trend == "declining":
        explanation += "Recent activity has negatively impacted your marketplace confidence. "
    else:
        explanation += "Your reputation has remained stable. "
        
    explanation += f"You are currently in the Top {100 - profile.percentile}% for overall reliability. "

    # 2. Dimensional Analysis
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
        explanation += f"Your {highest_dim[0]} is excellent and strongly boosts your recommendation ranking. "
        
    if lowest_dim[1] < 70:
        explanation += f"However, inconsistent {lowest_dim[0]} is capping your overall {profile.rank} rank potential."
        
    # 3. Risk Detection
    if profile.volatilityIndex > 20:
        risks.append("Erratic task completion patterns detected. This lowers business hiring confidence.")
        
    if dims.communication < 75:
        risks.append("Delayed responses are creating workflow friction.")
        
    if dims.delivery < 75:
        risks.append("Missed deadlines observed in recent workflows. Abandonment risk flagged.")
        
    # 4. Growth Opportunities
    if lowest_dim[0] == "communication":
        growth.append("Maintain a <2 hour response time on new messages to quickly recover your score.")
    elif lowest_dim[0] == "delivery":
        growth.append("Deliver your next 3 milestones on or before the due date to unlock Gold status.")
    elif lowest_dim[0] == "reliability":
        growth.append("Ensure tasks are marked 'Completed' reliably without prolonged inactivity.")
        
    if len(growth) == 0:
        growth.append("Maintain your current consistency to reach the Elite tier.")
        
    if len(risks) == 0:
        risks.append("No critical behavioral risks detected.")

    return TrustExplanationResponse(
        explanation=explanation.strip(),
        risksDetected=risks,
        growthOpportunities=growth
    )
