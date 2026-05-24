from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import datetime

router = APIRouter(prefix="/optimization")

class OptimizationScores(BaseModel):
    overall: int
    clarity: int
    relevance: int
    professionalism: int
    marketCompetitiveness: int
    trustCompatibility: int

class OptimizationWeakness(BaseModel):
    phrase: str
    reason: str
    suggestedFix: str

class OptimizationInsight(BaseModel):
    text: str
    type: str  # "strategic" | "market_trend" | "trust_impact"

class OptimizationAnalysisResponse(BaseModel):
    scores: OptimizationScores
    previousOverallScore: Optional[int]
    percentile: int
    confidence: int
    confidenceReasoning: str
    weaknesses: List[OptimizationWeakness]
    insights: List[OptimizationInsight]
    lastUpdated: str

# Payload Models
class ProposalOptimizationPayload(BaseModel):
    text: str
    jobDescription: str
    jobRequiredSkills: List[str]
    studentTrustScore: int
    previousScore: Optional[int] = None

class GigOptimizationPayload(BaseModel):
    title: str
    description: str
    budget: float
    category: str
    skills: List[str]
    businessTrustScore: int
    previousScore: Optional[int] = None


@router.post("/proposal", response_model=OptimizationAnalysisResponse)
def optimize_proposal(payload: ProposalOptimizationPayload):
    """
    Evaluates a student's proposal semantically against the job requirements.
    Simulates semantic matching and multi-dimensional scoring.
    """
    text_lower = payload.text.lower()
    word_count = len(text_lower.split())
    
    # 1. Relevance: Check if required skills are mentioned
    skills_mentioned = sum(1 for skill in payload.jobRequiredSkills if skill.lower() in text_lower)
    relevance = 40 if len(payload.jobRequiredSkills) == 0 else min(100, int((skills_mentioned / len(payload.jobRequiredSkills)) * 100) + 20)
    if word_count < 20: relevance = min(relevance, 30)

    # 2. Clarity & Professionalism (Mocked via heuristics)
    clarity = min(100, 30 + (word_count * 2)) if word_count < 35 else 85
    professionalism = 90 if "sincerely" in text_lower or "regards" in text_lower or "experience" in text_lower else 65

    # 3. Weakness Detection
    weaknesses = []
    generic_phrases = ["i want this job", "i am hardworking", "hire me", "i can do this"]
    for phrase in generic_phrases:
        if phrase in text_lower:
            weaknesses.append(OptimizationWeakness(
                phrase=phrase,
                reason="Lacks technical specificity and sounds generic.",
                suggestedFix="Show, don't tell. Detail a specific past project where you delivered similar results."
            ))
            professionalism -= 15
            clarity -= 10
            
    if word_count < 15 and text_lower != "":
        weaknesses.append(OptimizationWeakness(
            phrase=payload.text,
            reason="Proposal is too brief to evaluate semantic fit.",
            suggestedFix="Expand on how your skills directly solve the client's core problem."
        ))

    # 4. Market Competitiveness & Trust
    trust_compatibility = min(100, payload.studentTrustScore + 10)
    market_comp = (relevance + professionalism) // 2
    
    overall = (clarity + relevance + professionalism + market_comp + trust_compatibility) // 5

    # 5. Strategic Insights
    insights = []
    if relevance < 60:
        insights.append(OptimizationInsight(
            text="This proposal lacks explicit technical references. Including keywords from the gig will boost your semantic match score.",
            type="strategic"
        ))
    if payload.studentTrustScore > 85:
        insights.append(OptimizationInsight(
            text="Your Elite trust ranking significantly increases hiring probability. Ensure your proposal timeline matches your high reliability score.",
            type="trust_impact"
        ))
        
    confidence_reasoning = "High semantic overlap with gig requirements." if relevance > 75 else "Vague technical references reduce matching certainty."

    return OptimizationAnalysisResponse(
        scores=OptimizationScores(
            overall=max(0, overall),
            clarity=max(0, clarity),
            relevance=max(0, relevance),
            professionalism=max(0, professionalism),
            marketCompetitiveness=max(0, market_comp),
            trustCompatibility=max(0, trust_compatibility)
        ),
        previousOverallScore=payload.previousScore,
        percentile=max(1, 100 - overall + 5),  # Simplified percentile proxy
        confidence=min(99, 40 + (word_count * 2)),
        confidenceReasoning=confidence_reasoning,
        weaknesses=weaknesses,
        insights=insights,
        lastUpdated=datetime.datetime.utcnow().isoformat() + "Z"
    )

@router.post("/gig", response_model=OptimizationAnalysisResponse)
def optimize_gig(payload: GigOptimizationPayload):
    """
    Evaluates a business's gig creation payload.
    Identifies vague requirements, uncompetitive budgets, and missing tags.
    """
    desc_lower = payload.description.lower()
    word_count = len(desc_lower.split())
    
    clarity = min(100, 30 + (word_count * 1.5)) if word_count < 40 else 85
    relevance = 90 if len(payload.skills) > 2 else 50
    professionalism = 85
    
    # Market & Trust Check
    market_comp = 80
    insights = []
    weaknesses = []
    
    # Heuristics: Budget Analytics
    if payload.budget > 0 and payload.budget < 500:
        market_comp -= 20
        insights.append(OptimizationInsight(
            text="Current budget range may discourage high-trust, elite candidates. The marketplace average for this category is higher.",
            type="market_trend"
        ))
    
    # Generic description check
    if word_count < 20 and word_count > 0:
        weaknesses.append(OptimizationWeakness(
            phrase=payload.description,
            reason="Description is too brief to semantically attract the right talent.",
            suggestedFix="Detail the core deliverables, technical stack, and expected timeline clearly."
        ))
        clarity -= 20
        
    if len(payload.skills) == 0:
        insights.append(OptimizationInsight(
            text="Adding specific technology tags dramatically improves the AI recommendation engine's ability to source candidates.",
            type="strategic"
        ))
        
    if payload.businessTrustScore > 80:
        insights.append(OptimizationInsight(
            text="Your high business trust score acts as a talent magnet. Emphasize your fast milestone approval history.",
            type="trust_impact"
        ))

    overall = int((clarity + relevance + professionalism + market_comp + payload.businessTrustScore) / 5)

    return OptimizationAnalysisResponse(
        scores=OptimizationScores(
            overall=max(0, overall),
            clarity=max(0, int(clarity)),
            relevance=max(0, relevance),
            professionalism=max(0, professionalism),
            marketCompetitiveness=max(0, market_comp),
            trustCompatibility=max(0, payload.businessTrustScore)
        ),
        previousOverallScore=payload.previousScore,
        percentile=max(1, 100 - overall + 10),
        confidence=min(95, 50 + (word_count * 2)),
        confidenceReasoning="Clear deliverables and budget enable high-confidence matching." if overall > 75 else "Vague requirements limit semantic matching precision.",
        weaknesses=weaknesses,
        insights=insights,
        lastUpdated=datetime.datetime.utcnow().isoformat() + "Z"
    )
