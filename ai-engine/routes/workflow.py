from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from generation import call_llm_json

router = APIRouter(prefix="/workflow")

class TaskSignal(BaseModel):
    title: str
    status: str
    dueDate: Optional[str] = None
    createdAt: str
    updatedAt: str

class WorkflowAnalyzeRequest(BaseModel):
    job_title: str
    application_text: str
    current_tasks: List[str]
    task_signals: Optional[List[TaskSignal]] = None
    inactivity_days: Optional[float] = 0.0
    overdue_count: Optional[int] = 0

class WorkflowSuggestRequest(BaseModel):
    job_title: str
    application_text: str

WORKFLOW_SCHEMA = {
    "type": "object",
    "properties": {
        "complexity": {"type": "string"},
        "risk_level": {"type": "string"},
        "summary": {"type": "string"},
        "productivity_insight": {"type": "string"},
        "risk_score": {"type": "integer"},
        "delay_prediction": {"type": "string"},
        "stability_insights": {"type": "string"}
    },
    "required": ["complexity", "risk_level", "summary", "productivity_insight", "risk_score", "delay_prediction", "stability_insights"],
    "additionalProperties": False
}

@router.post("/analyze")
async def analyze_workflow(req: WorkflowAnalyzeRequest):
    """
    Workflow intelligence analysis.
    Uses LLM if available; otherwise falls back to signal-based analysis.
    """
    try:
        system_prompt = (
            "You are a senior workflow management systems engineer and delivery officer.\n"
            "Analyze the state of a collaboration project based on the tasks list, inactivity, overdue tasks, and job/application context.\n"
            "Provide:\n"
            "- complexity ('Low', 'Medium', 'High')\n"
            "- risk_level ('Low', 'Medium', 'High')\n"
            "- summary (string): Explanation of risk level.\n"
            "- productivity_insight (string): Tips for improvements.\n"
            "- risk_score (integer, 0-100): Numerical representation of delay probability.\n"
            "- delay_prediction (string): Text prediction of delay.\n"
            "- stability_insights (string): Insights about collaboration stability.\n"
            "You must return a JSON object matching the requested schema."
        )
        
        user_payload = {
            "job_title": req.job_title,
            "application_text": req.application_text,
            "tasks_count": len(req.current_tasks),
            "inactivity_days": req.inactivity_days,
            "overdue_count": req.overdue_count,
            "tasks": [t.model_dump() for t in req.task_signals] if req.task_signals else []
        }
        
        llm_result = call_llm_json(system_prompt, user_payload, WORKFLOW_SCHEMA)
        if llm_result:
            return llm_result
    except Exception as e:
        print(f"Error calling LLM for workflow analysis: {e}")

    # Fallback (signal-based deterministic scoring)
    task_count = len(req.current_tasks)
    
    # 1. Complexity
    complexity = "Low"
    if task_count > 10 or "backend" in req.job_title.lower() or "ai" in req.job_title.lower():
        complexity = "High"
    elif task_count > 5:
        complexity = "Medium"

    # 2. Risk Score & Level
    risk_score = 10
    if task_count == 0:
        risk_score += 30
    if req.overdue_count:
        risk_score += min(50, req.overdue_count * 20)
    if req.inactivity_days:
        risk_score += min(40, int(req.inactivity_days * 10))
        
    risk_score = min(100, risk_score)
    
    risk_level = "Low"
    if risk_score >= 70:
        risk_level = "High"
    elif risk_score >= 30:
        risk_level = "Medium"

    # 3. Delay Prediction
    if risk_score >= 70:
        delay_prediction = "High probability of deliverable deadline failure."
    elif risk_score >= 35:
        delay_prediction = "Moderate risk of minor milestone delay."
    else:
        delay_prediction = "Low risk. Project is on schedule."

    # 4. Summary & Stability Insights
    if task_count == 0:
        summary = "No tasks have been created. High risk of project stalling."
        stability_insights = "Zero activity recorded. Prompt kickoff session recommended."
    elif req.overdue_count and req.overdue_count > 0:
        summary = f"Workflow has {req.overdue_count} overdue task(s). Action is required."
        stability_insights = "Task delays detected. Developer may be encountering blockers."
    elif req.inactivity_days and req.inactivity_days > 4.0:
        summary = f"No board activity recorded in {int(req.inactivity_days)} days."
        stability_insights = "Communication gap flagged. Request status sync."
    else:
        summary = "Workflow is well-structured and actively managed."
        stability_insights = "Strong collaboration stability and consistent progress."

    return {
        "complexity": complexity,
        "risk_level": risk_level,
        "summary": summary,
        "productivity_insight": "Breaking down tasks into smaller, <2 day deliverables improves velocity by 34%.",
        "risk_score": risk_score,
        "delay_prediction": delay_prediction,
        "stability_insights": stability_insights
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
