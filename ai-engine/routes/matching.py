from fastapi import APIRouter, HTTPException
from schemas import (
    EmbedRequest,
    EmbedResponse,
    ScoreRequest,
    ScoreResponse,
    MatchRequest,
    MatchResponse,
    RecommendRequest,
    RecommendResponse,
    JobScoreResponse,
    ScoreBreakdown,
    PortfolioSummarizeRequest,
    PortfolioSummarizeResponse,
    ApplicationEnhanceRequest,
    ApplicationEnhanceResponse,
)
from utils import get_embeddings
from matcher import compute_score_and_reasoning
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/embed", response_model=EmbedResponse)
def embed_endpoint(request: EmbedRequest):
    """
    Exposes raw sentence-transformer vector embedding generation for text inputs.
    """
    try:
        if not request.texts:
            raise HTTPException(status_code=400, detail="Text list cannot be empty.")
        embeddings = get_embeddings(request.texts)
        return EmbedResponse(embeddings=embeddings)
    except Exception as e:
        logger.exception("Error in /embed endpoint")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/score", response_model=ScoreResponse)
def score_endpoint(request: ScoreRequest):
    """
    Scores a single candidate against a single job posting, returning weights breakdown and reasoning.
    """
    try:
        job_dict = request.job.model_dump()
        cand_dict = request.candidate.profile.model_dump()
        port_dicts = [p.model_dump() for p in request.candidate.portfolios] if request.candidate.portfolios else []
        
        match_pct, rank_score, conf_score, breakdown, reasoning = compute_score_and_reasoning(
            job=job_dict,
            candidate=cand_dict,
            portfolios=port_dicts,
            weights=request.weights
        )
        
        return ScoreResponse(
            candidate_id=request.candidate.id,
            match_percentage=int(match_pct),
            ranking_score=rank_score,
            confidence_score=conf_score,
            breakdown=breakdown,
            reasoning=reasoning
        )
    except Exception as e:
        logger.exception("Error in /score endpoint")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/match", response_model=MatchResponse)
def match_endpoint(request: MatchRequest):
    """
    Accepts a single job and a list of candidates. Evaluates each candidate, ranks them in descending order of score, and returns the result.
    """
    try:
        job_dict = request.job.model_dump()
        
        results = []
        for cand in request.candidates:
            cand_dict = cand.profile.model_dump()
            port_dicts = [p.model_dump() for p in cand.portfolios] if cand.portfolios else []
            
            match_pct, rank_score, conf_score, breakdown, reasoning = compute_score_and_reasoning(
                job=job_dict,
                candidate=cand_dict,
                portfolios=port_dicts,
                weights=request.weights
            )
            
            results.append(
                ScoreResponse(
                    candidate_id=cand.id,
                    match_percentage=int(match_pct),
                    ranking_score=rank_score,
                    confidence_score=conf_score,
                    breakdown=breakdown,
                    reasoning=reasoning
                )
            )
            
        # Rank by score descending
        results.sort(key=lambda x: x.ranking_score, reverse=True)
        
        return MatchResponse(
            job_id=request.job.jobId,
            ranked_candidates=results
        )
    except Exception as e:
        logger.exception("Error in /match endpoint")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recommend", response_model=RecommendResponse)
def recommend_endpoint(request: RecommendRequest):
    """
    Accepts a candidate profile and a list of jobs. Evaluates each job, ranks them in descending order of match, and returns the recommendation list.
    """
    try:
        cand_dict = request.candidate.profile.model_dump()
        port_dicts = [p.model_dump() for p in request.candidate.portfolios] if request.candidate.portfolios else []
        
        results = []
        for job in request.jobs:
            job_dict = job.model_dump()
            
            match_pct, rank_score, conf_score, breakdown, reasoning = compute_score_and_reasoning(
                job=job_dict,
                candidate=cand_dict,
                portfolios=port_dicts,
                weights=request.weights
            )
            
            results.append(
                JobScoreResponse(
                    job_id=job.jobId,
                    title=job.title,
                    company_name=job.companyName,
                    match_percentage=int(match_pct),
                    ranking_score=rank_score,
                    confidence_score=conf_score,
                    breakdown=breakdown,
                    reasoning=reasoning
                )
            )
            
        # Rank by score descending
        results.sort(key=lambda x: x.ranking_score, reverse=True)
        
        return RecommendResponse(
            candidate_id=request.candidate.id,
            ranked_jobs=results
        )
    except Exception as e:
        logger.exception("Error in /recommend endpoint")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/portfolio/summarize", response_model=PortfolioSummarizeResponse)
def portfolio_summarize_endpoint(request: PortfolioSummarizeRequest):
    """
    Generates a professional AI summary for a portfolio item based on its details.
    """
    try:
        desc = request.description.strip()
        # Clean description sentences
        sentences = [s.strip() for s in desc.split('.') if s.strip()]
        
        key_points = []
        for s in sentences:
            s_lower = s.lower()
            if any(keyword in s_lower for keyword in ["implement", "build", "creat", "develop", "design", "integrat", "launch", "optim", "deliv", "wrote", "us"]):
                if len(s) > 15 and len(s) < 150:
                    key_points.append(s)
                    
        if not key_points:
            key_points = sentences[:2]
        else:
            key_points = key_points[:2]
            
        key_points_str = ". ".join(key_points)
        if key_points_str and not key_points_str.endswith('.'):
            key_points_str += '.'
            
        tags_str = ", ".join(request.tags) if request.tags else ""
        tech_stack_clause = f" utilizing {tags_str}" if tags_str else ""
        
        summary = (
            f"This is a {request.category} project titled '{request.title}'{tech_stack_clause}. "
            f"The project showcases practical hands-on execution: {key_points_str} "
            f"It demonstrates strong problem-solving capabilities, focus on high-quality delivery, and optimization."
        )
        
        return PortfolioSummarizeResponse(summary=summary)
    except Exception as e:
        logger.exception("Error in /portfolio/summarize endpoint")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/application/enhance", response_model=ApplicationEnhanceResponse)
def application_enhance_endpoint(request: ApplicationEnhanceRequest):
    """
    Simulates an AI Smart Pitch Assistant that rewrites the cover letter and proposal.
    In a production system, this would call an LLM. Here we use rule-based expansion to demonstrate the UX.
    """
    try:
        # Rule-based generation for demonstration
        tone_prefix = "Hey there! " if request.tone.lower() == "conversational" else "Dear Hiring Team, "
        
        enhanced_cover = f"{tone_prefix}I am very interested in the '{request.jobTitle}' role. Based on your description, I am confident my skills align perfectly with what you're looking for. {request.coverMessage.strip()} I'm ready to dive in and deliver high-quality results."
        
        enhanced_proposal = f"### Approach & Methodology\nI have carefully reviewed the requirements for '{request.jobTitle}'. My proposed approach:\n\n1. **Discovery & Alignment**: Understand the exact scope and target audience.\n2. **Execution**: {request.proposalText.strip()}\n3. **Review & Handover**: Deliver the final assets and provide any necessary support.\n\nI can start immediately and will ensure regular communication throughout the project."

        # Simple rule-based suggestion for demonstration
        # In a real app, the LLM would extract/suggest this based on the job description
        desc_lower = request.jobDescription.lower()
        
        upsell = None
        days = 7
        if "design" in desc_lower or "ui" in desc_lower:
            upsell = "Offer to include a mini style guide or 2 extra revision rounds for a 15% premium."
            days = 5
        elif "develop" in desc_lower or "api" in desc_lower or "backend" in desc_lower:
            upsell = "Offer to include basic API documentation or unit tests as a quality guarantee."
            days = 10
        elif "video" in desc_lower or "edit" in desc_lower:
            upsell = "Offer to provide raw project files or a short teaser clip for social media."
            days = 4
        else:
            upsell = "Offer expedited delivery (2 days faster) for a small rush fee."

        return ApplicationEnhanceResponse(
            enhancedCoverMessage=enhanced_cover,
            enhancedProposalText=enhanced_proposal,
            recommendedPrice=None, # Leave price logic to UI, or we can suggest one here. Let's leave None to not override budget if not confident.
            recommendedDays=days,
            upsellSuggestion=upsell
        )
    except Exception as e:
        logger.exception("Error in /application/enhance endpoint")
        raise HTTPException(status_code=500, detail=str(e))
