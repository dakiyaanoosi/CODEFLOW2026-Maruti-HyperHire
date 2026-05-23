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
