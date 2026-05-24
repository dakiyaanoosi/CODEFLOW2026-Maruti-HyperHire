import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "ai-engine")))

from generation import local_job_analysis, local_pitch_enhancement
from matcher import compute_score_and_reasoning
from schemas import MatchWeights


JOB = {
    "jobId": "job-regression",
    "businessId": "biz",
    "companyName": "Acme",
    "title": "React Frontend Developer",
    "description": "Build a React dashboard with TypeScript and Tailwind CSS.",
    "category": "Web Development",
    "requiredSkills": ["React", "TypeScript", "Tailwind CSS"],
    "budget": 500.0,
    "deadline": "2026-06-30T00:00:00Z",
    "difficultyLevel": "Intermediate",
    "workMode": "Remote",
    "deliverables": ["Dashboard UI"],
    "status": "Published",
}


def test_empty_profile_scores_zero():
    candidate = {
        "name": "Empty User",
        "college": "",
        "bio": "",
        "skills": [],
        "experienceLevel": "Beginner",
        "availability": "",
        "preferredCategories": [],
        "hourlyRate": 0.0,
        "portfolioLinks": [],
        "trustScore": 80.0,
        "isVerified": False,
        "profileStrength": 0.0,
        "avatarUrl": "",
    }
    pct, rank, confidence, breakdown, reasoning = compute_score_and_reasoning(
        job=JOB,
        candidate=candidate,
        portfolios=[],
        weights=MatchWeights(),
    )
    assert pct == 0.0
    assert rank == 0.0
    assert confidence == 0.0
    assert breakdown.skill_overlap == 0.0
    assert "Insufficient profile data" in reasoning


def test_local_job_analysis_is_deterministic_and_grounded():
    first = local_job_analysis(JOB["title"], JOB["description"], JOB["budget"], JOB["deliverables"])
    second = local_job_analysis(JOB["title"], JOB["description"], JOB["budget"], JOB["deliverables"])
    assert first == second
    assert "React" in first["aiExtractedSkills"]
    assert first["difficultyLevel"] in {"Beginner", "Intermediate", "Advanced"}


def test_local_pitch_changes_with_job_context():
    design_pitch = local_pitch_enhancement(
        "I have made app screens before.",
        "I will design wireframes and final UI screens.",
        "Professional",
        "Mobile App UI Designer",
        "Design a Figma prototype and mobile design system.",
    )
    backend_pitch = local_pitch_enhancement(
        "I have built APIs before.",
        "I will implement endpoints and document them.",
        "Professional",
        "Backend API Developer",
        "Build REST APIs with database integration and tests.",
    )
    assert design_pitch["enhancedProposalText"] != backend_pitch["enhancedProposalText"]
    assert "UI/UX" in design_pitch["enhancedProposalText"]
    assert "Backend" in backend_pitch["enhancedProposalText"]


if __name__ == "__main__":
    test_empty_profile_scores_zero()
    test_local_job_analysis_is_deterministic_and_grounded()
    test_local_pitch_changes_with_job_context()
    print("AI regression checks passed.")
