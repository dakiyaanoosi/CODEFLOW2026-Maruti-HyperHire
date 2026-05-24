from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import random

router = APIRouter(prefix="/talent")

# Minimal Payload Models
class MinimalCandidatePayload(BaseModel):
    userId: str
    skills: List[str]
    bioSnippet: str
    trustScore: int
    experienceLevel: str
    preferredCategories: List[str]

class TalentSearchRequest(BaseModel):
    query: str
    candidates: List[MinimalCandidatePayload]

# Response Models
class CandidateMatch(BaseModel):
    userId: str
    semanticScore: int
    diversityBonus: int
    freshnessWeight: int
    overallScore: int
    matchReasoning: str
    riskFactors: List[str]
    rarityIndicators: List[str]
    momentum: str

class AIRecruiterGuidance(BaseModel):
    message: str
    type: str # "warning" | "opportunity" | "market_trend"

class TalentSearchResponse(BaseModel):
    matches: List[CandidateMatch]
    recruiterGuidance: List[AIRecruiterGuidance]
    searchIntentExtracted: List[str]


@router.post("/search", response_model=TalentSearchResponse)
def search_talent(payload: TalentSearchRequest):
    """
    Semantic Workforce Graph Search Engine.
    Executes intent extraction, semantic overlap, and diversity balancing.
    """
    query_lower = payload.query.lower()
    matches = []
    
    # 1. Search Intent Extraction (Mocked via heuristics for speed)
    intent_tags = []
    if "ai" in query_lower or "artificial intelligence" in query_lower:
        intent_tags.append("AI/Machine Learning Focus")
    if "react" in query_lower or "frontend" in query_lower:
        intent_tags.append("Frontend Architecture")
    if "backend" in query_lower or "node" in query_lower:
        intent_tags.append("Backend Scalability")
    if "design" in query_lower or "ui" in query_lower or "ux" in query_lower:
        intent_tags.append("User Experience Focus")
        
    if not intent_tags:
        intent_tags = ["General Software Engineering"]

    # 2. Candidate Evaluation
    for idx, candidate in enumerate(payload.candidates):
        # Semantic Score Baseline
        semantic_score = 40
        match_reasons = []
        risk_factors = []
        rarity_indicators = []
        
        # Skill Overlap
        cand_skills_lower = [s.lower() for s in candidate.skills]
        query_words = set(query_lower.split())
        
        overlap_count = 0
        for word in query_words:
            if len(word) > 2 and any(word in s for s in cand_skills_lower):
                overlap_count += 1
                
        if overlap_count > 0:
            semantic_score += (overlap_count * 15)
            match_reasons.append(f"Direct semantic skill match found for query keywords.")
            
        # Bio Overlap
        if any(word in candidate.bioSnippet.lower() for word in query_words if len(word) > 4):
            semantic_score += 15
            match_reasons.append("Bio contains strong contextual alignment with your search intent.")
            
        # Market Rarity
        if "AI" in candidate.skills and "UI/UX Design" in candidate.preferredCategories:
            rarity_indicators.append("Rare Hybrid: AI + Design")
            semantic_score += 10
            
        # Trust Evaluation
        if candidate.trustScore < 60:
            risk_factors.append("Below average Trust Score. Monitor workflow reliability closely.")
        elif candidate.trustScore > 85:
            match_reasons.append("Elite Trust Tier guarantees high workflow reliability.")
            
        # Experience Evaluation
        if candidate.experienceLevel == "Beginner" and "expert" in query_lower:
            semantic_score -= 20
            risk_factors.append("Experience level may not match senior requirements.")
            
        # Final calculations
        semantic_score = min(100, max(10, semantic_score))
        
        # Diversity Bonus (Deterministic pseudo-randomness based on ID for demo)
        diversity_bonus = (hash(candidate.userId) % 10) if idx > 0 else 0
        freshness_weight = (hash(candidate.userId + "fresh") % 15)
        
        overall = min(100, int((semantic_score * 0.7) + (candidate.trustScore * 0.2) + (diversity_bonus + freshness_weight)))
        
        # Momentum
        momentum = "stable"
        if freshness_weight > 10 and candidate.trustScore > 75:
            momentum = "rising"
        elif candidate.trustScore < 50:
            momentum = "declining"

        if not match_reasons:
            match_reasons.append("Broad skillset aligns with general requirements.")

        matches.append(CandidateMatch(
            userId=candidate.userId,
            semanticScore=semantic_score,
            diversityBonus=diversity_bonus,
            freshnessWeight=freshness_weight,
            overallScore=overall,
            matchReasoning=match_reasons[0], # Pick primary reason
            riskFactors=risk_factors,
            rarityIndicators=rarity_indicators,
            momentum=momentum
        ))

    # Sort by overall score
    matches.sort(key=lambda x: x.overallScore, reverse=True)
    
    # 3. AI Recruiter Guidance Generation
    guidance = []
    
    # Analyze the search results
    high_trust_count = sum(1 for m in matches if m.overallScore > 75)
    
    if len(matches) == 0:
        guidance.append(AIRecruiterGuidance(
            message="Market Scarcity: This exact skill combination is currently rare. Consider removing 1 constraint.",
            type="warning"
        ))
    elif high_trust_count == 0 and len(matches) > 0:
        guidance.append(AIRecruiterGuidance(
            message="Warning: The candidates matching this query have lower-than-average Trust Scores. Proceed with structured milestones.",
            type="warning"
        ))
    elif len(intent_tags) > 1:
        guidance.append(AIRecruiterGuidance(
            message=f"Opportunity: You are searching for a hybrid role ({', '.join(intent_tags)}). These profiles often deliver massive startup value.",
            type="opportunity"
        ))
    else:
        guidance.append(AIRecruiterGuidance(
            message="Market Trend: This category currently has a high volume of elite, verified talent available.",
            type="market_trend"
        ))

    return TalentSearchResponse(
        matches=matches,
        recruiterGuidance=guidance,
        searchIntentExtracted=intent_tags
    )
