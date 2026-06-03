from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import datetime
from generation import call_llm_json

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

OPTIMIZATION_SCHEMA = {
    "type": "object",
    "properties": {
        "scores": {
            "type": "object",
            "properties": {
                "overall": {"type": "integer"},
                "clarity": {"type": "integer"},
                "relevance": {"type": "integer"},
                "professionalism": {"type": "integer"},
                "marketCompetitiveness": {"type": "integer"},
                "trustCompatibility": {"type": "integer"}
            },
            "required": ["overall", "clarity", "relevance", "professionalism", "marketCompetitiveness", "trustCompatibility"],
            "additionalProperties": False
        },
        "percentile": {"type": "integer"},
        "confidence": {"type": "integer"},
        "confidenceReasoning": {"type": "string"},
        "weaknesses": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "phrase": {"type": "string"},
                    "reason": {"type": "string"},
                    "suggestedFix": {"type": "string"}
                },
                "required": ["phrase", "reason", "suggestedFix"],
                "additionalProperties": False
            }
        },
        "insights": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "text": {"type": "string"},
                    "type": {"type": "string"}
                },
                "required": ["text", "type"],
                "additionalProperties": False
            }
        }
    },
    "required": ["scores", "percentile", "confidence", "confidenceReasoning", "weaknesses", "insights"],
    "additionalProperties": False
}

@router.post("/proposal", response_model=OptimizationAnalysisResponse)
def optimize_proposal(payload: ProposalOptimizationPayload):
    """
    Evaluates a student's proposal semantically against the job requirements.
    Uses LLM if available; otherwise falls back to deterministic local parsing.
    """
    try:
        system_prompt = (
            "You are a professional AI proposal strategist and career advisor.\n"
            "Evaluate the student's proposal letter and proposed approach against the job description and required skills.\n"
            "Provide multi-dimensional scores (overall, clarity, relevance, professionalism, marketCompetitiveness, trustCompatibility as integers 1-100).\n"
            "Identify weaknesses: parts of the text that sound generic, lack specificity, or miss key requirements.\n"
            "Identify strategic insights: actionable growth tips.\n"
            "You must return a JSON object matching the requested schema."
        )
        
        user_payload = {
            "text": payload.text,
            "jobDescription": payload.jobDescription,
            "jobRequiredSkills": payload.jobRequiredSkills,
            "studentTrustScore": payload.studentTrustScore
        }
        
        llm_result = call_llm_json(system_prompt, user_payload, OPTIMIZATION_SCHEMA)
        
        if llm_result:
            scores_data = llm_result.get("scores", {})
            return OptimizationAnalysisResponse(
                scores=OptimizationScores(
                    overall=int(scores_data.get("overall", 70)),
                    clarity=int(scores_data.get("clarity", 70)),
                    relevance=int(scores_data.get("relevance", 70)),
                    professionalism=int(scores_data.get("professionalism", 70)),
                    marketCompetitiveness=int(scores_data.get("marketCompetitiveness", 70)),
                    trustCompatibility=int(scores_data.get("trustCompatibility", 70))
                ),
                previousOverallScore=payload.previousScore,
                percentile=int(llm_result.get("percentile", 50)),
                confidence=int(llm_result.get("confidence", 80)),
                confidenceReasoning=llm_result.get("confidenceReasoning", "Analysis based on proposal details."),
                weaknesses=[
                    OptimizationWeakness(**w) for w in llm_result.get("weaknesses", [])
                ],
                insights=[
                    OptimizationInsight(**ins) for ins in llm_result.get("insights", [])
                ],
                lastUpdated=datetime.datetime.utcnow().isoformat() + "Z"
            )
    except Exception as e:
        print(f"Error calling LLM for proposal optimization: {e}")

    # Rubric-based deterministic fallback (remove Math.random)
    text_lower = payload.text.lower()
    word_count = len(text_lower.split())
    
    skills_mentioned = sum(1 for skill in payload.jobRequiredSkills if skill.lower() in text_lower)
    relevance = 40 if len(payload.jobRequiredSkills) == 0 else min(100, int((skills_mentioned / len(payload.jobRequiredSkills)) * 100) + 20)
    if word_count < 20: 
        relevance = min(relevance, 30)
        
    clarity = min(100, 30 + (word_count * 2)) if word_count < 35 else 85
    professionalism = 90 if any(greet in text_lower for greet in ["sincerely", "regards", "thank you", "hello", "hi"]) else 65
    
    weaknesses = []
    generic_phrases = ["i want this job", "i am hardworking", "hire me", "i can do this"]
    for phrase in generic_phrases:
        if phrase in text_lower:
            weaknesses.append(OptimizationWeakness(
                phrase=phrase,
                reason="Lacks technical specificity and sounds generic.",
                suggestedFix="Detail a specific past project where you delivered similar results."
            ))
            professionalism = max(40, professionalism - 15)
            clarity = max(40, clarity - 10)
            
    if word_count < 15 and text_lower != "":
        weaknesses.append(OptimizationWeakness(
            phrase=payload.text,
            reason="Proposal is too brief to evaluate semantic fit.",
            suggestedFix="Expand on how your skills directly solve the client's core problem."
        ))

    trust_compatibility = min(100, payload.studentTrustScore + 10)
    market_comp = (relevance + professionalism) // 2
    overall = (clarity + relevance + professionalism + market_comp + trust_compatibility) // 5

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
        percentile=max(1, 100 - overall),
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
    Uses LLM if available; otherwise falls back to deterministic local parsing.
    """
    try:
        system_prompt = (
            "You are an expert AI workforce architect.\n"
            "Evaluate the business's gig creation details (title, description, budget, category, skills).\n"
            "Provide multi-dimensional scores (overall, clarity, relevance, professionalism, marketCompetitiveness, trustCompatibility as integers 1-100).\n"
            "Identify weaknesses in the description, requirements, or budget constraints.\n"
            "Provide actionable strategic recruitment insights.\n"
            "You must return a JSON object matching the requested schema."
        )
        
        user_payload = {
            "title": payload.title,
            "description": payload.description,
            "budget": payload.budget,
            "category": payload.category,
            "skills": payload.skills,
            "businessTrustScore": payload.businessTrustScore
        }
        
        llm_result = call_llm_json(system_prompt, user_payload, OPTIMIZATION_SCHEMA)
        
        if llm_result:
            scores_data = llm_result.get("scores", {})
            return OptimizationAnalysisResponse(
                scores=OptimizationScores(
                    overall=int(scores_data.get("overall", 70)),
                    clarity=int(scores_data.get("clarity", 70)),
                    relevance=int(scores_data.get("relevance", 70)),
                    professionalism=int(scores_data.get("professionalism", 70)),
                    marketCompetitiveness=int(scores_data.get("marketCompetitiveness", 70)),
                    trustCompatibility=int(scores_data.get("trustCompatibility", 70))
                ),
                previousOverallScore=payload.previousScore,
                percentile=int(llm_result.get("percentile", 50)),
                confidence=int(llm_result.get("confidence", 80)),
                confidenceReasoning=llm_result.get("confidenceReasoning", "Analysis based on gig parameters."),
                weaknesses=[
                    OptimizationWeakness(**w) for w in llm_result.get("weaknesses", [])
                ],
                insights=[
                    OptimizationInsight(**ins) for ins in llm_result.get("insights", [])
                ],
                lastUpdated=datetime.datetime.utcnow().isoformat() + "Z"
            )
    except Exception as e:
        print(f"Error calling LLM for gig optimization: {e}")

    # Fallback (deterministic)
    desc_lower = payload.description.lower()
    word_count = len(desc_lower.split())
    
    clarity = min(100, 30 + (word_count * 1.5)) if word_count < 40 else 85
    relevance = 90 if len(payload.skills) > 2 else 50
    professionalism = 85
    
    market_comp = 80
    insights = []
    weaknesses = []
    
    if payload.budget > 0 and payload.budget < 5000:
        market_comp = 50
        insights.append(OptimizationInsight(
            text="Current budget range may discourage high-trust, elite candidates. The marketplace average for this category is higher.",
            type="market_trend"
        ))
    elif payload.budget > 0 and payload.budget < 25000:
        market_comp = 70
        insights.append(OptimizationInsight(
            text="Budget is competitive for intermediate candidates, but consider a slightly higher cap for elite experts.",
            type="market_trend"
        ))
    
    if word_count < 20 and word_count > 0:
        weaknesses.append(OptimizationWeakness(
            phrase=payload.description,
            reason="Description is too brief to semantically attract the right talent.",
            suggestedFix="Detail the core deliverables, technical stack, and expected timeline clearly."
        ))
        clarity = max(30, clarity - 20)
        
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
        percentile=max(1, 100 - overall),
        confidence=min(95, 50 + (word_count * 2)),
        confidenceReasoning="Clear deliverables and budget enable high-confidence matching." if overall > 75 else "Vague requirements limit semantic matching precision.",
        weaknesses=weaknesses,
        insights=insights,
        lastUpdated=datetime.datetime.utcnow().isoformat() + "Z"
    )
