from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/workflow")

class WorkflowAnalyzeRequest(BaseModel):
    job_title: str
    application_text: str
    current_tasks: List[str]

class WorkflowSuggestRequest(BaseModel):
    job_title: str
    application_text: str

@router.post("/analyze")
async def analyze_workflow(req: WorkflowAnalyzeRequest):
    """
    Hackathon-grade workflow intelligence analysis.
    In a full production environment, this would use a generative model like OpenAI or Gemini.
    """
    # Simple heuristic analysis based on task count
    task_count = len(req.current_tasks)
    
    complexity = "Low"
    if task_count > 10 or "backend" in req.job_title.lower():
        complexity = "High"
    elif task_count > 5:
        complexity = "Medium"

    risk_level = "Low"
    if task_count == 0:
        risk_level = "High"
        summary = "No tasks have been created. High risk of project stalling."
    elif task_count < 3:
        risk_level = "Medium"
        summary = "Few tasks defined. Consider breaking down the project further."
    else:
        summary = "Workflow is well-structured and actively managed."

    return {
        "complexity": complexity,
        "risk_level": risk_level,
        "summary": summary,
        "productivity_insight": "Breaking down tasks into smaller, <2 day deliverables improves velocity by 34%."
    }

@router.post("/suggest-tasks")
async def suggest_tasks(req: WorkflowSuggestRequest):
    """
    Suggests a breakdown of tasks based on the job title.
    """
    title_lower = req.job_title.lower()
    
    suggestions = [
        "Initial requirements gathering & kickoff meeting",
        "Set up project repository and architecture",
    ]

    if "frontend" in title_lower or "ui" in title_lower or "design" in title_lower:
        suggestions.extend([
            "Design system setup and component library",
            "Implement responsive UI mockups",
            "Integrate frontend with mock APIs",
            "Cross-browser testing and optimization"
        ])
    elif "backend" in title_lower or "api" in title_lower or "data" in title_lower:
        suggestions.extend([
            "Database schema design and migration",
            "Implement core API endpoints",
            "Setup authentication and authorization middleware",
            "Write unit tests for critical business logic"
        ])
    else:
        suggestions.extend([
            "Draft initial deliverables",
            "Review cycle #1 with stakeholders",
            "Incorporate feedback and finalize",
            "Final handover and documentation"
        ])

    return {
        "suggested_tasks": suggestions
    }
