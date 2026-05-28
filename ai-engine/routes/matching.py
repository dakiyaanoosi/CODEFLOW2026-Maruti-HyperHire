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
    JobAnalyzeRequest,
    JobAnalyzeResponse,
)
from utils import get_embeddings
from matcher import compute_score_and_reasoning
from generation import call_llm_json, local_job_analysis
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
    AI Smart Pitch Assistant that rewrites the cover letter and proposal.
    Uses LLM when keys are configured; falls back to structured semantic templates.
    """
    try:
        system_prompt = (
            "You are a professional AI pitch writer and application optimizer.\n"
            "Enhance the student's cover message and proposal text to make it competitive for the job.\n"
            "Do NOT write extremely verbose or robotic essays.\n"
            "Keep the response concise, strategic, and professional.\n"
            "You must return a JSON object matching the requested schema."
        )
        
        user_payload = {
            "coverMessage": request.coverMessage,
            "proposalText": request.proposalText,
            "tone": request.tone,
            "jobTitle": request.jobTitle,
            "jobDescription": request.jobDescription
        }
        
        llm_result = call_llm_json(system_prompt, user_payload, {
            "type": "object",
            "properties": {
                "enhancedCoverMessage": {"type": "string"},
                "enhancedProposalText": {"type": "string"},
                "recommendedDays": {"type": ["integer", "null"]},
                "upsellSuggestion": {"type": ["string", "null"]}
            },
            "required": ["enhancedCoverMessage", "enhancedProposalText", "recommendedDays", "upsellSuggestion"],
            "additionalProperties": False
        })
        
        if llm_result:
            return ApplicationEnhanceResponse(
                enhancedCoverMessage=llm_result.get("enhancedCoverMessage", ""),
                enhancedProposalText=llm_result.get("enhancedProposalText", ""),
                recommendedPrice=None,
                recommendedDays=llm_result.get("recommendedDays"),
                upsellSuggestion=llm_result.get("upsellSuggestion")
            )
            
    except Exception as e:
        print(f"Error calling LLM for application pitch enhance: {e}")
        
    # Local fallback
    try:
        from generation import local_pitch_enhancement
        local_res = local_pitch_enhancement(
            cover_message=request.coverMessage,
            proposal_text=request.proposalText,
            tone=request.tone,
            job_title=request.jobTitle,
            job_description=request.jobDescription
        )
        return ApplicationEnhanceResponse(
            enhancedCoverMessage=local_res["enhancedCoverMessage"],
            enhancedProposalText=local_res["enhancedProposalText"],
            recommendedPrice=None,
            recommendedDays=local_res["recommendedDays"],
            upsellSuggestion=local_res["upsellSuggestion"]
        )
    except Exception as e:
        logger.exception("Error in /application/enhance endpoint fallback")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/job/analyze", response_model=JobAnalyzeResponse)
def job_analyze_endpoint(request: JobAnalyzeRequest):
    """
    Analyzes a job title and description.
    Extracts required skills, category, difficulty, deliverables, complexity, and requirements.
    Uses LLM if available; otherwise falls back to deterministic local parsing.
    """
    try:
        system_prompt = (
            "You are an expert AI recruiting coordinator and workspace architect.\n"
            "Analyze the job title and description to extract workspace planning details.\n"
            "You must return a JSON object matching the requested schema.\n"
            "Keys:\n"
            "- aiExtractedSkills (list of strings): 4-8 core technical skills required.\n"
            "- aiGeneratedSummary (string): A professional 2-sentence summary of the gig.\n"
            "- aiDifficultyScore (integer, 1-10): The estimated difficulty of the project.\n"
            "- difficultyLevel (string): 'Beginner', 'Intermediate', or 'Advanced'.\n"
            "- suggestedCategory (string): The primary marketplace category (e.g. 'Web Development', 'Backend Engineering', 'UI/UX Design', 'Machine Learning', etc.).\n"
            "- deliverables (list of strings): 3-5 concrete deliverables expected at the end.\n"
            "- workflowComplexity (string): 'Low', 'Medium', or 'High'.\n"
            "- collaborationRequirements (string): A short description of how much communication/review is needed."
        )
        
        user_payload = {
            "title": request.title,
            "description": request.description
        }
        
        schema = {
            "type": "object",
            "properties": {
                "aiExtractedSkills": {"type": "array", "items": {"type": "string"}},
                "aiGeneratedSummary": {"type": "string"},
                "aiDifficultyScore": {"type": "integer"},
                "difficultyLevel": {"type": "string"},
                "suggestedCategory": {"type": "string"},
                "deliverables": {"type": "array", "items": {"type": "string"}},
                "workflowComplexity": {"type": "string"},
                "collaborationRequirements": {"type": "string"}
            },
            "required": [
                "aiExtractedSkills", "aiGeneratedSummary", "aiDifficultyScore",
                "difficultyLevel", "suggestedCategory", "deliverables",
                "workflowComplexity", "collaborationRequirements"
            ],
            "additionalProperties": False
        }
        
        llm_result = call_llm_json(system_prompt, user_payload, schema)
        
        if llm_result:
            return JobAnalyzeResponse(
                aiExtractedSkills=llm_result.get("aiExtractedSkills", []),
                aiGeneratedSummary=llm_result.get("aiGeneratedSummary", ""),
                aiDifficultyScore=int(llm_result.get("aiDifficultyScore", 5)),
                difficultyLevel=llm_result.get("difficultyLevel", "Intermediate"),
                suggestedCategory=llm_result.get("suggestedCategory", "Web Development"),
                deliverables=llm_result.get("deliverables", []),
                workflowComplexity=llm_result.get("workflowComplexity", "Medium"),
                collaborationRequirements=llm_result.get("collaborationRequirements", "Regular updates required.")
            )
            
        # Local Fallback
        local_res = local_job_analysis(request.title, request.description)
        
        deliverables = []
        desc_lower = request.description.lower()
        if "design" in desc_lower or "ui" in desc_lower:
            deliverables = ["Wireframes/Mockups", "Interactive Prototype", "Figma Design Tokens"]
        elif "api" in desc_lower or "database" in desc_lower or "backend" in desc_lower:
            deliverables = ["API Schema & Routes", "Database Setup", "Integration Tests"]
        else:
            deliverables = ["Initial requirements draft", "Project implementation code", "Handover documentation"]
            
        complexity = "Low" if len(deliverables) <= 3 and local_res["aiDifficultyScore"] <= 4 else "High" if local_res["aiDifficultyScore"] >= 7 else "Medium"
        collab = "Bi-weekly reviews and milestone milestones" if complexity == "High" else "Direct communication and final review"
        
        return JobAnalyzeResponse(
            aiExtractedSkills=local_res["aiExtractedSkills"],
            aiGeneratedSummary=local_res["aiGeneratedSummary"],
            aiDifficultyScore=local_res["aiDifficultyScore"],
            difficultyLevel=local_res["difficultyLevel"],
            suggestedCategory=local_res["suggestedCategory"],
            deliverables=deliverables,
            workflowComplexity=complexity,
            collaborationRequirements=collab
        )
    except Exception as e:
        logger.exception("Error in /job/analyze endpoint")
        raise HTTPException(status_code=500, detail=str(e))
