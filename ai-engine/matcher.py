import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from typing import Dict, Any, List, Tuple
from utils import (
    compile_job_text,
    compile_candidate_text,
    compile_portfolio_text,
    get_embedding,
    get_embeddings,
)
from schemas import MatchWeights, ScoreBreakdown

# Experience mapping definitions
EXP_LEVEL_MAP = {
    "beginner": 1,
    "intermediate": 2,
    "advanced": 3,
    "expert": 4
}

JOB_DIFF_MAP = {
    "beginner": 1,
    "intermediate": 2,
    "advanced": 3
}

def calculate_cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """
    Computes the cosine similarity between two dense embedding vectors.
    Clamps the result to the range [0.0, 1.0].
    """
    if not vec1 or not vec2:
        return 0.0
    v1 = np.array(vec1).reshape(1, -1)
    v2 = np.array(vec2).reshape(1, -1)
    sim = cosine_similarity(v1, v2)[0][0]
    return float(np.clip(sim, 0.0, 1.0))

def compute_score_and_reasoning(
    job: Dict[str, Any],
    candidate: Dict[str, Any],
    portfolios: List[Dict[str, Any]],
    weights: MatchWeights
) -> Tuple[float, float, float, ScoreBreakdown, str]:
    """
    Computes a comprehensive matching score and reasoning for a candidate against a job.
    
    Returns:
        - match_percentage (0 to 100 integer)
        - ranking_score (float, 0.0 to 1.0)
        - confidence_score (float, 0.0 to 1.0)
        - breakdown (ScoreBreakdown)
        - reasoning (str explanation)
    """
    
    # If the candidate profile is empty (no skills, empty bio, and no portfolios)
    if not candidate.get("skills") and not candidate.get("bio", "").strip() and not portfolios:
        return (
            0.0,
            0.0,
            0.0,
            ScoreBreakdown(
                semantic_similarity=0.0,
                skill_overlap=0.0,
                trust_score=0.0,
                experience_level=0.0,
                portfolio_relevance=0.0,
                category_alignment=0.0
            ),
            "Please complete your profile by adding skills, a bio, or portfolio items to get personalized matching recommendations."
        )

    # 1. Semantic Similarity
    job_text = compile_job_text(job)
    cand_text = compile_candidate_text(candidate)
    
    job_embedding = get_embedding(job_text)
    cand_embedding = get_embedding(cand_text)
    
    semantic_sim = calculate_cosine_similarity(job_embedding, cand_embedding)
    
    # 2. Skill Overlap
    cand_skills = [s.lower().strip() for s in candidate.get("skills", [])]
    req_skills = [s.lower().strip() for s in job.get("requiredSkills", [])]
    
    matched_skills = list(set(cand_skills).intersection(set(req_skills)))
    if not req_skills:
        skill_overlap = 1.0
    else:
        skill_overlap = len(matched_skills) / len(set(req_skills))
        
    # 3. Trust Score
    trust_score_raw = candidate.get("trustScore", 0.0)
    trust_score = float(np.clip(trust_score_raw / 100.0, 0.0, 1.0))
    
    # 4. Experience Level Match
    cand_exp = candidate.get("experienceLevel", "Beginner").lower().strip()
    job_diff = job.get("difficultyLevel", "Beginner").lower().strip()
    
    cand_val = EXP_LEVEL_MAP.get(cand_exp, 1)
    job_val = JOB_DIFF_MAP.get(job_diff, 1)
    
    if cand_val >= job_val:
        exp_score = 1.0
    else:
        exp_score = cand_val / job_val
        
    # 5. Portfolio Relevance
    portfolio_relevance = 0.0
    best_portfolio_title = None
    
    if portfolios:
        port_texts = [compile_portfolio_text(p) for p in portfolios]
        port_embeddings = get_embeddings(port_texts)
        
        max_sim = -1.0
        best_idx = -1
        
        for idx, port_emb in enumerate(port_embeddings):
            sim = calculate_cosine_similarity(job_embedding, port_emb)
            if sim > max_sim:
                max_sim = sim
                best_idx = idx
                
        if best_idx != -1:
            portfolio_relevance = max_sim
            best_portfolio_title = portfolios[best_idx].get("title", "")
            
    # 6. Category Alignment
    job_category = job.get("category", "").lower().strip()
    preferred_categories = [cat.lower().strip() for cat in candidate.get("preferredCategories", [])]
    
    if job_category in preferred_categories:
        category_score = 1.0
    else:
        category_score = 0.0
        
    # --- Weighted Math & Normalization ---
    w_sum = (
        weights.semantic +
        weights.skills +
        weights.trust +
        weights.experience +
        weights.portfolio +
        weights.category
    )
    
    if w_sum > 0:
        w_sem = weights.semantic / w_sum
        w_sk = weights.skills / w_sum
        w_tr = weights.trust / w_sum
        w_ex = weights.experience / w_sum
        w_po = weights.portfolio / w_sum
        w_ca = weights.category / w_sum
    else:
        # Fallback to equal weight
        w_sem = w_sk = w_tr = w_ex = w_po = w_ca = 1.0 / 6.0
        
    ranking_score = (
        w_sem * semantic_sim +
        w_sk * skill_overlap +
        w_tr * trust_score +
        w_ex * exp_score +
        w_po * portfolio_relevance +
        w_ca * category_score
    )
    
    match_percentage = int(round(ranking_score * 100))
    # Clip percentage to [0, 100] just in case
    match_percentage = max(0, min(100, match_percentage))
    
    # Confidence score is calculated based on semantic similarity + skills overlap (core qualifiers)
    confidence_score = float(np.clip(semantic_sim * 0.6 + skill_overlap * 0.4, 0.0, 1.0))
    
    breakdown = ScoreBreakdown(
        semantic_similarity=round(semantic_sim, 4),
        skill_overlap=round(skill_overlap, 4),
        trust_score=round(trust_score, 4),
        experience_level=round(exp_score, 4),
        portfolio_relevance=round(portfolio_relevance, 4),
        category_alignment=round(category_score, 4)
    )
    
    # --- Generate AI Reasoning Explanation ---
    reasons = []
    if portfolio_relevance > 0.65 and best_portfolio_title:
        reasons.append(f"highly relevant portfolio projects like '{best_portfolio_title}'")
    if skill_overlap > 0.5 and matched_skills:
        matched_titles = [s.title() if len(s) > 3 else s.upper() for s in matched_skills[:3]]
        skills_str = ", ".join(matched_titles)
        if len(matched_skills) > 3:
            skills_str += " and more"
        reasons.append(f"strong matching skills in {skills_str}")
    elif semantic_sim > 0.65:
        reasons.append("close semantic alignment between their profile and the job description")
        
    extra = []
    if trust_score_raw >= 80:
        extra.append(f"a high trust score ({int(trust_score_raw)}%)")
    if exp_score == 1.0:
        extra.append(f"experience level ({candidate.get('experienceLevel', 'Beginner')}) that matches the job difficulty")
    if category_score == 1.0:
        extra.append("direct category preference alignment")
        
    reason_str = "Recommended because the candidate has "
    if reasons:
        reason_str += " and ".join(reasons)
    else:
        reason_str += "relevant profile details matching the role"
        
    if extra:
        if len(extra) > 1:
            reason_str += f", backed by {', '.join(extra[:-1])} and {extra[-1]}"
        else:
            reason_str += f", backed by {extra[0]}"
            
    reason_str += "."
    
    return float(match_percentage), float(ranking_score), float(confidence_score), breakdown, reason_str
