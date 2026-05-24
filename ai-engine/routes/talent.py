from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from generation import call_llm_json

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

TALENT_SCHEMA = {
    "type": "object",
    "properties": {
        "matches": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "userId": {"type": "string"},
                    "semanticScore": {"type": "integer"},
                    "diversityBonus": {"type": "integer"},
                    "freshnessWeight": {"type": "integer"},
                    "overallScore": {"type": "integer"},
                    "matchReasoning": {"type": "string"},
                    "riskFactors": {"type": "array", "items": {"type": "string"}},
                    "rarityIndicators": {"type": "array", "items": {"type": "string"}},
                    "momentum": {"type": "string"}
                },
                "required": ["userId", "semanticScore", "diversityBonus", "freshnessWeight", "overallScore", "matchReasoning", "riskFactors", "rarityIndicators", "momentum"],
                "additionalProperties": False
            }
        },
        "recruiterGuidance": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "message": {"type": "string"},
                    "type": {"type": "string"}
                },
                "required": ["message", "type"],
                "additionalProperties": False
            }
        },
        "searchIntentExtracted": {
            "type": "array",
            "items": {"type": "string"}
        }
    },
    "required": ["matches", "recruiterGuidance", "searchIntentExtracted"],
    "additionalProperties": False
}

@router.post("/search", response_model=TalentSearchResponse)
def search_talent(payload: TalentSearchRequest):
    """
    Semantic Workforce Graph Search Engine.
    Executes intent extraction, semantic overlap, and diversity balancing.
    Uses LLM if available; otherwise falls back to local semantic match calculations.
    """
    try:
        system_prompt = (
            "You are an expert AI recruiter.\n"
            "Rank candidates against the search query.\n"
            "Evaluate candidate skills, bioSnippet, preferred categories, and experience level.\n"
            "Produce overallScore (1-100), semanticScore (1-100), matchReasoning, riskFactors, rarityIndicators, and momentum ('stable', 'rising', 'declining').\n"
            "Also provide recruiterGuidance (opportunities, warnings, trends) and searchIntentExtracted tags.\n"
            "You must return a JSON object matching the requested schema."
        )
        
        user_payload = {
            "query": payload.query,
            "candidates": [c.model_dump() for c in payload.candidates]
        }
        
        llm_result = call_llm_json(system_prompt, user_payload, TALENT_SCHEMA)
        
        if llm_result:
            matches_data = llm_result.get("matches", [])
            matches = [
                CandidateMatch(**m) for m in matches_data
            ]
            guidance = [
                AIRecruiterGuidance(**g) for g in llm_result.get("recruiterGuidance", [])
            ]
            return TalentSearchResponse(
                matches=matches,
                recruiterGuidance=guidance,
                searchIntentExtracted=llm_result.get("searchIntentExtracted", [])
            )
            
    except Exception as e:
        print(f"Error calling LLM for talent search: {e}")

    # Fallback path: Real semantic search using MiniLM embeddings
    try:
        matches = []
        for idx, candidate in enumerate(payload.candidates):
            # Create a pseudo-job representation of the query
            pseudo_job = {
                "title": "Search Request",
                "description": payload.query,
                "category": candidate.preferredCategories[0] if candidate.preferredCategories else "General",
                "requiredSkills": [],
                "difficultyLevel": "intermediate"
            }
            candidate_dict = {
                "bio": candidate.bioSnippet,
                "skills": candidate.skills,
                "trustScore": candidate.trustScore,
                "experienceLevel": candidate.experienceLevel,
                "preferredCategories": candidate.preferredCategories
            }
            
            from matcher import compute_score_and_reasoning
            from schemas import MatchWeights
            
            match_pct, rank_score, conf_score, breakdown, reasoning = compute_score_and_reasoning(
                job=pseudo_job,
                candidate=candidate_dict,
                portfolios=[],
                weights=MatchWeights(
                    semantic=0.6,
                    skills=0.2,
                    trust=0.1,
                    experience=0.1,
                    portfolio=0.0,
                    category=0.0
                )
            )
            
            # Risk factors
            risk_factors = []
            if candidate.trustScore < 60:
                risk_factors.append("Low trust rating (below 60%). Monitor deliverable milestones closely.")
                
            rarity = []
            cand_skills_lower = [s.lower() for s in candidate.skills]
            if "ai" in cand_skills_lower or "machine learning" in cand_skills_lower:
                rarity.append("AI Specialist")
            if "typescript" in cand_skills_lower and "react" in cand_skills_lower:
                rarity.append("Full-Stack JS Specialist")
            
            momentum = "stable"
            if candidate.trustScore > 80:
                momentum = "rising"
            elif candidate.trustScore < 50:
                momentum = "declining"
                
            matches.append(CandidateMatch(
                userId=candidate.userId,
                semanticScore=int(breakdown.semantic_similarity * 100),
                diversityBonus=0,
                freshnessWeight=0,
                overallScore=int(match_pct),
                matchReasoning=reasoning,
                riskFactors=risk_factors,
                rarityIndicators=rarity,
                momentum=momentum
            ))
            
        # Rank by overall score descending
        matches.sort(key=lambda x: x.overallScore, reverse=True)
        
        # Intent tags
        intent_tags = ["General Sourcing"]
        query_lower = payload.query.lower()
        if "react" in query_lower or "frontend" in query_lower:
            intent_tags = ["Frontend Sourcing"]
        elif "backend" in query_lower or "node" in query_lower:
            intent_tags = ["Backend Sourcing"]
        elif "ai" in query_lower or "ml" in query_lower or "machine" in query_lower:
            intent_tags = ["AI/Machine Learning Sourcing"]
            
        guidance = [
            AIRecruiterGuidance(
                message=f"Ranked candidates semantically using local vector models. Match percentage corresponds to vector similarity against target description.",
                type="market_trend"
            )
        ]
        
        return TalentSearchResponse(
            matches=matches,
            recruiterGuidance=guidance,
            searchIntentExtracted=intent_tags
        )
    except Exception as e:
        print(f"Error in fallback talent search: {e}")
        return TalentSearchResponse(matches=[], recruiterGuidance=[], searchIntentExtracted=["General"])
