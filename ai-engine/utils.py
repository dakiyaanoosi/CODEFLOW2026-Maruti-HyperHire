from typing import List, Dict, Any, Union
from model import get_model
import numpy as np

def clean_text(text: str) -> str:
    """
    Cleans and normalizes raw text for embedding generation.
    """
    if not text:
        return ""
    return " ".join(text.strip().split())

def compile_job_text(job: Dict[str, Any]) -> str:
    """
    Compiles job details into a single rich text representation for semantic embedding.
    """
    title = job.get("title", "")
    description = job.get("description", "")
    category = job.get("category", "")
    skills = job.get("requiredSkills", [])
    if isinstance(skills, list):
        skills_str = ", ".join(skills)
    else:
        skills_str = str(skills)
    
    deliverables = job.get("deliverables", [])
    if isinstance(deliverables, list):
        deliv_str = "; ".join(deliverables)
    else:
        deliv_str = str(deliverables)
        
    difficulty = job.get("difficultyLevel", "")
    
    parts = [
        f"Job Title: {title}",
        f"Category: {category}",
        f"Difficulty: {difficulty}",
        f"Required Skills: {skills_str}",
        f"Description: {description}",
    ]
    if deliv_str:
        parts.append(f"Deliverables: {deliv_str}")
        
    return clean_text(" | ".join(parts))

def compile_candidate_text(candidate: Dict[str, Any]) -> str:
    """
    Compiles candidate details into a single rich text representation for semantic embedding.
    """
    bio = candidate.get("bio", "")
    skills = candidate.get("skills", [])
    if isinstance(skills, list):
        skills_str = ", ".join(skills)
    else:
        skills_str = str(skills)
        
    experience = candidate.get("experienceLevel", "")
    college = candidate.get("college", "")
    
    parts = [
        f"College: {college}",
        f"Experience Level: {experience}",
        f"Skills: {skills_str}",
        f"Bio: {bio}",
    ]
    
    return clean_text(" | ".join(parts))

def compile_portfolio_text(portfolio: Dict[str, Any]) -> str:
    """
    Compiles portfolio item details into a single rich text representation.
    """
    title = portfolio.get("title", "")
    description = portfolio.get("description", "")
    category = portfolio.get("category", "")
    tags = portfolio.get("tags", [])
    if isinstance(tags, list):
        tags_str = ", ".join(tags)
    else:
        tags_str = str(tags)
        
    parts = [
        f"Portfolio Title: {title}",
        f"Category: {category}",
        f"Tags: {tags_str}",
        f"Description: {description}",
    ]
    return clean_text(" | ".join(parts))

def get_embedding(text: str) -> List[float]:
    """
    Generates a dense vector embedding for a single text string.
    """
    model = get_model()
    embedding = model.encode(text, convert_to_numpy=True)
    return embedding.tolist()

def get_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generates dense vector embeddings for a list of text strings in batch.
    """
    if not texts:
        return []
    model = get_model()
    embeddings = model.encode(texts, convert_to_numpy=True)
    return embeddings.tolist()
