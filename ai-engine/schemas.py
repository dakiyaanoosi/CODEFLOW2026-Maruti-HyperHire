from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# --- Firestore Data Sub-Models ---

class JobModel(BaseModel):
    jobId: str
    businessId: str
    companyName: str
    title: str
    description: str
    category: str
    requiredSkills: Optional[List[str]] = []
    budget: float
    deadline: str
    difficultyLevel: str
    workMode: str
    deliverables: Optional[List[str]] = []
    status: str
    aiGeneratedSummary: Optional[str] = None
    aiExtractedSkills: Optional[List[str]] = None
    aiDifficultyScore: Optional[float] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class StudentProfileModel(BaseModel):
    name: str
    college: Optional[str] = ""
    bio: Optional[str] = ""
    skills: Optional[List[str]] = []
    experienceLevel: Optional[str] = "Beginner"
    availability: Optional[str] = ""
    preferredCategories: Optional[List[str]] = []
    hourlyRate: Optional[float] = 0.0
    portfolioLinks: Optional[List[str]] = []
    trustScore: Optional[float] = 80.0
    isVerified: Optional[bool] = False
    profileStrength: Optional[float] = 0.0
    avatarUrl: Optional[str] = ""

class PortfolioItemModel(BaseModel):
    portfolioId: str
    userId: str
    title: str
    description: Optional[str] = ""
    category: Optional[str] = ""
    mediaType: str
    mediaUrl: str
    tags: Optional[List[str]] = []
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

# --- Request/Response Helper Models ---

class CandidateWithPortfolios(BaseModel):
    id: str  # Student uid
    profile: StudentProfileModel
    portfolios: Optional[List[PortfolioItemModel]] = []

class MatchWeights(BaseModel):
    semantic: float = Field(default=0.30, ge=0.0, le=1.0)
    skills: float = Field(default=0.20, ge=0.0, le=1.0)
    trust: float = Field(default=0.15, ge=0.0, le=1.0)
    experience: float = Field(default=0.10, ge=0.0, le=1.0)
    portfolio: float = Field(default=0.15, ge=0.0, le=1.0)
    category: float = Field(default=0.10, ge=0.0, le=1.0)

class ScoreBreakdown(BaseModel):
    semantic_similarity: float
    skill_overlap: float
    trust_score: float
    experience_level: float
    portfolio_relevance: float
    category_alignment: float

# --- Endpoint API Request / Response Models ---

class EmbedRequest(BaseModel):
    texts: List[str]

class EmbedResponse(BaseModel):
    embeddings: List[List[float]]

class ScoreRequest(BaseModel):
    job: JobModel
    candidate: CandidateWithPortfolios
    weights: Optional[MatchWeights] = MatchWeights()

class ScoreResponse(BaseModel):
    candidate_id: str
    match_percentage: int
    ranking_score: float
    confidence_score: float
    breakdown: ScoreBreakdown
    reasoning: str

class MatchRequest(BaseModel):
    job: JobModel
    candidates: List[CandidateWithPortfolios]
    weights: Optional[MatchWeights] = MatchWeights()

class MatchResponse(BaseModel):
    job_id: str
    ranked_candidates: List[ScoreResponse]

class JobScoreResponse(BaseModel):
    job_id: str
    title: str
    company_name: str
    match_percentage: int
    ranking_score: float
    confidence_score: float
    breakdown: ScoreBreakdown
    reasoning: str

class RecommendRequest(BaseModel):
    candidate: CandidateWithPortfolios
    jobs: List[JobModel]
    weights: Optional[MatchWeights] = MatchWeights()

class RecommendResponse(BaseModel):
    candidate_id: str
    ranked_jobs: List[JobScoreResponse]

class PortfolioSummarizeRequest(BaseModel):
    title: str
    description: str
    category: str
    tags: Optional[List[str]] = []

class PortfolioSummarizeResponse(BaseModel):
    summary: str

class ApplicationEnhanceRequest(BaseModel):
    coverMessage: str
    proposalText: str
    tone: str
    jobTitle: str
    jobDescription: str

class ApplicationEnhanceResponse(BaseModel):
    enhancedCoverMessage: str
    enhancedProposalText: str
    recommendedPrice: Optional[float] = None
    recommendedDays: Optional[int] = None
    upsellSuggestion: Optional[str] = None

class JobAnalyzeRequest(BaseModel):
    title: str
    description: str

class JobAnalyzeResponse(BaseModel):
    aiExtractedSkills: List[str]
    aiGeneratedSummary: str
    aiDifficultyScore: int
    difficultyLevel: str
    suggestedCategory: str
    deliverables: List[str]
    workflowComplexity: str
    collaborationRequirements: str
