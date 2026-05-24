from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Optional
import datetime
import uuid

router = APIRouter(prefix="/hyperai/context")

class TrustDimensions(BaseModel):
    reliability: float
    communication: float
    delivery: float
    collaboration: float

class PlatformSignalPayload(BaseModel):
    userId: str
    role: str
    trustDimensions: TrustDimensions
    activeWorkflowsCount: int
    overdueTasksCount: int
    recentActivityCount: int
    marketSpecialization: List[str]

class ContextualInsight(BaseModel):
    id: str
    category: str
    priority: str
    confidence: int
    title: str
    description: str
    signalsAnalyzed: List[str]
    actionableAdvice: str
    relatedEntityUrl: Optional[str]
    createdAt: str
    expiresAt: str

class AIEcosystemSummary(BaseModel):
    executiveSummary: str
    overallHealth: str
    lastAnalyzedAt: str

class AIContextResponse(BaseModel):
    summary: AIEcosystemSummary
    insights: List[ContextualInsight]

@router.post("", response_model=AIContextResponse)
def evaluate_ecosystem_context(payload: PlatformSignalPayload):
    """
    Hybrid Contextual Engine endpoint. 
    Simulates a sophisticated deep-reasoning AI orchestrator interpreting cross-system state.
    """
    now = datetime.datetime.utcnow()
    expires_at = (now + datetime.timedelta(days=1)).isoformat() + "Z"
    now_str = now.isoformat() + "Z"
    
    insights = []
    
    # Analyze Risk: Workflow Abandonment vs Trust
    if payload.overdueTasksCount > 0 and payload.recentActivityCount == 0:
        if payload.trustDimensions.communication < 70:
            insights.append(ContextualInsight(
                id=f"insight_{uuid.uuid4().hex[:8]}",
                category="risk",
                priority="urgent",
                confidence=94,
                title="Severe Workflow Abandonment Risk",
                description="Your workflow is currently inactive with overdue milestones, combined with declining communication scores.",
                signalsAnalyzed=["workflow inactivity", "overdue milestones", "low communication trust"],
                actionableAdvice="Immediately respond to pending tasks and provide a status update to avoid a rank penalty.",
                relatedEntityUrl="/dashboard",
                createdAt=now_str,
                expiresAt=expires_at
            ))
        else:
            insights.append(ContextualInsight(
                id=f"insight_{uuid.uuid4().hex[:8]}",
                category="workflow_efficiency",
                priority="high",
                confidence=82,
                title="Workflow Momentum Stalling",
                description="You have overdue tasks but strong communication. A quick update can clear the bottleneck.",
                signalsAnalyzed=["overdue milestones", "high communication trust"],
                actionableAdvice="Reschedule the deadline or complete the immediate next step.",
                relatedEntityUrl="/dashboard",
                createdAt=now_str,
                expiresAt=expires_at
            ))
            
    # Analyze Opportunity: Market Trends vs Portfolio
    if len(payload.marketSpecialization) > 0:
        # Mock trend detection
        top_skill = payload.marketSpecialization[0]
        insights.append(ContextualInsight(
            id=f"insight_{uuid.uuid4().hex[:8]}",
            category="market_trend",
            priority="medium",
            confidence=88,
            title=f"Rising Demand for {top_skill}",
            description=f"Marketplace analytics show a 24% increase in businesses searching for {top_skill} experts this week.",
            signalsAnalyzed=[f"portfolio specialization ({top_skill})", "macro search trends"],
            actionableAdvice="Update your portfolio with your latest project to capture this surge in visibility.",
            relatedEntityUrl="/profile",
            createdAt=now_str,
            expiresAt=expires_at
        ))
        
    # Analyze Trust Growth
    if payload.trustDimensions.delivery > 85 and payload.trustDimensions.reliability < 75:
        insights.append(ContextualInsight(
            id=f"insight_{uuid.uuid4().hex[:8]}",
            category="trust_growth",
            priority="info",
            confidence=91,
            title="Reliability is Capping Your Rank",
            description="Your work quality (delivery) is excellent, but inconsistent deadlines are holding back your Elite status.",
            signalsAnalyzed=["high delivery trust", "low reliability trust"],
            actionableAdvice="Submit your next deliverable 24 hours early to spike your reliability index.",
            relatedEntityUrl="/profile",
            createdAt=now_str,
            expiresAt=expires_at
        ))

    # Fallback insight if doing perfectly well
    if len(insights) == 0:
        insights.append(ContextualInsight(
            id=f"insight_{uuid.uuid4().hex[:8]}",
            category="opportunity",
            priority="info",
            confidence=98,
            title="Ecosystem Optimization",
            description="Your workflow and trust states are fully synchronized. The matching algorithm is actively prioritizing your profile.",
            signalsAnalyzed=["0 overdue tasks", "stable trust profile"],
            actionableAdvice="Apply to 2 new gigs while your recommendation weight is artificially boosted.",
            relatedEntityUrl="/jobs",
            createdAt=now_str,
            expiresAt=expires_at
        ))

    # Generate Executive Summary
    avg_trust = (payload.trustDimensions.reliability + payload.trustDimensions.communication + payload.trustDimensions.delivery + payload.trustDimensions.collaboration) / 4
    
    if payload.overdueTasksCount > 0:
        overall_health = "at_risk"
        exec_summary = "Your marketplace visibility is at risk due to workflow delays. Immediate action required on overdue tasks."
    elif avg_trust > 85:
        overall_health = "excellent"
        exec_summary = "Your ecosystem health is exceptional. You are receiving maximum AI recommendation priority."
    else:
        overall_health = "stable"
        exec_summary = "Your marketplace presence is stable. Focus on improving communication speed to boost hiring conversion."

    summary = AIEcosystemSummary(
        executiveSummary=exec_summary,
        overallHealth=overall_health,
        lastAnalyzedAt=now_str
    )

    return AIContextResponse(
        summary=summary,
        insights=insights
    )
