import sys
import os

# Add the ai-engine directory to the path so we can import modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "ai-engine")))

from matcher import compute_score_and_reasoning
from schemas import MatchWeights

# Mock Job data matching our schemas
job = {
    "jobId": "job-101",
    "businessId": "biz-202",
    "companyName": "Tech Cafe",
    "title": "React Frontend Developer",
    "description": "Looking for a junior front-end developer to build modular web interfaces using React, Tailwind CSS, and TypeScript. Needs to design clean, modern landing pages and debug components.",
    "category": "Web Development",
    "requiredSkills": ["React", "TypeScript", "Tailwind CSS"],
    "budget": 200.0,
    "deadline": "2026-06-30T00:00:00Z",
    "difficultyLevel": "Intermediate",
    "workMode": "Remote",
    "deliverables": ["Responsive layout", "TypeScript components"],
    "status": "Published"
}

# Mock Candidate 1 (Strong match: matches skills, categories, intermediate, has portfolios)
candidate_1 = {
    "name": "Sarah Chen",
    "college": "IIT Delhi",
    "bio": "Frontend developer focusing on React and Next.js applications. Passionate about TypeScript, tailwindcss, and responsive web design. Love crafting premium CSS layouts.",
    "skills": ["React", "TypeScript", "Tailwind CSS", "JavaScript", "HTML/CSS"],
    "experienceLevel": "Intermediate",
    "availability": "15 hrs/week",
    "preferredCategories": ["Web Development", "UI/UX Design"],
    "hourlyRate": 25.0,
    "portfolioLinks": ["https://sarahchen.dev"],
    "trustScore": 92.0,
    "isVerified": True,
    "profileStrength": 88.0,
    "avatarUrl": ""
}

portfolios_1 = [
    {
        "portfolioId": "port-1",
        "userId": "cand-1",
        "title": "Interactive Tailwind Portfolio",
        "description": "A responsive personal developer portfolio website designed with Tailwind CSS, React, and smooth Framer Motion page transitions.",
        "category": "Web Development",
        "mediaType": "link",
        "mediaUrl": "https://sarahchen.dev/portfolio",
        "tags": ["React", "Tailwind CSS", "TypeScript"]
    }
]

# Mock Candidate 2 (Weak match: different skills, beginner, no portfolio)
candidate_2 = {
    "name": "Alex Miller",
    "college": "Kolkata University",
    "bio": "Aspiring graphic designer and content writer. Experienced with Adobe Photoshop and writing blog articles about traveling.",
    "skills": ["Photoshop", "Content Writing", "Illustrator"],
    "experienceLevel": "Beginner",
    "availability": "10 hrs/week",
    "preferredCategories": ["Graphic Design", "Content Writing"],
    "hourlyRate": 15.0,
    "portfolioLinks": [],
    "trustScore": 70.0,
    "isVerified": False,
    "profileStrength": 45.0,
    "avatarUrl": ""
}

portfolios_2 = []

def run_tests():
    print("--- TESTING HYPERHIRE AI MATCHING ENGINE ---")
    weights = MatchWeights()
    
    print("\n--- Evaluating Sarah Chen (Expected Strong Match) ---")
    pct_1, rank_1, conf_1, breakdown_1, reason_1 = compute_score_and_reasoning(
        job=job,
        candidate=candidate_1,
        portfolios=portfolios_1,
        weights=weights
    )
    print(f"Match Percentage: {pct_1}%")
    print(f"Ranking Score:    {rank_1:.4f}")
    print(f"Confidence:       {conf_1:.4f}")
    print(f"Breakdown:        {breakdown_1.model_dump()}")
    print(f"AI Reasoning:     {reason_1}")
    
    print("\n--- Evaluating Alex Miller (Expected Weak Match) ---")
    pct_2, rank_2, conf_2, breakdown_2, reason_2 = compute_score_and_reasoning(
        job=job,
        candidate=candidate_2,
        portfolios=portfolios_2,
        weights=weights
    )
    print(f"Match Percentage: {pct_2}%")
    print(f"Ranking Score:    {rank_2:.4f}")
    print(f"Confidence:       {conf_2:.4f}")
    print(f"Breakdown:        {breakdown_2.model_dump()}")
    print(f"AI Reasoning:     {reason_2}")
    
    assert pct_1 > pct_2, "Verification failed: Sarah Chen (strong match) should score higher than Alex Miller"
    print("\nSUCCESS: Scoring logic ranks candidate matches correctly.")

if __name__ == "__main__":
    run_tests()
