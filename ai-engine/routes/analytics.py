from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict
import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
from model import get_model

router = APIRouter(prefix="/analytics")

class HeatmapRequest(BaseModel):
    portfolio_skills: List[str]
    job_requirements: List[str]

@router.post("/market-heatmap")
async def generate_market_heatmap(req: HeatmapRequest):
    """
    Semantic Market Intelligence:
    Uses all-MiniLM-L6-v2 to embed portfolio skills and job requirements,
    clusters them to find 'hot' zones of market demand, and compares student
    supply against business demand.
    """
    model = get_model()

    if not req.portfolio_skills and not req.job_requirements:
        return {
            "insights": ["Not enough data to generate semantic heatmap."],
            "trending_skills": [],
            "skill_clusters": []
        }

    # Safe fallbacks if empty
    p_skills = req.portfolio_skills if req.portfolio_skills else ["general"]
    j_skills = req.job_requirements if req.job_requirements else ["general"]

    # 1. Embeddings
    p_emb = model.encode(p_skills)
    j_emb = model.encode(j_skills)

    # 2. Compute Demand Similarity (How much does portfolio match job demands?)
    # A high similarity to job requirements means high demand.
    similarity_matrix = cosine_similarity(p_emb, j_emb)
    
    # Average demand score for each portfolio skill
    demand_scores = np.mean(similarity_matrix, axis=1)

    trending_skills = []
    for idx, skill in enumerate(p_skills):
        score = float(demand_scores[idx])
        # Simple heuristic momentum based on semantic match
        momentum = "↑" if score > 0.4 else "↓" if score < 0.2 else "→"
        trending_skills.append({
            "skill": skill,
            "demand_score": round(score * 100, 1), # 0-100 scale
            "momentum": momentum
        })

    # Sort by highest demand
    trending_skills = sorted(trending_skills, key=lambda x: x["demand_score"], reverse=True)

    # 3. Semantic Clustering (Find 'Rising Categories')
    # Combine all skills to find clusters
    all_skills = list(set(p_skills + j_skills))
    if len(all_skills) >= 3:
        all_emb = model.encode(all_skills)
        n_clusters = min(3, len(all_skills) // 2)
        kmeans = KMeans(n_clusters=n_clusters, random_state=42).fit(all_emb)
        
        clusters = {}
        for skill, label in zip(all_skills, kmeans.labels_):
            if label not in clusters:
                clusters[label] = []
            clusters[label].append(skill)
            
        cluster_list = [{"category_id": int(k), "skills": v} for k, v in clusters.items()]
    else:
        cluster_list = [{"category_id": 0, "skills": all_skills}]

    # Generate an AI insight
    top_skill = trending_skills[0]["skill"] if trending_skills else "General"
    insight = f"Based on semantic analysis, {top_skill} is highly aligned with current market demand."

    return {
        "insights": [insight],
        "trending_skills": trending_skills,
        "skill_clusters": cluster_list
    }
