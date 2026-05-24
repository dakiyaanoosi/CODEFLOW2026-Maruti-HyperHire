import httpx
import json

BASE_URL = "http://127.0.0.1:8000"

job = {
    "jobId": "job-101",
    "businessId": "biz-202",
    "companyName": "Tech Cafe",
    "title": "React Frontend Developer",
    "description": "Looking for a junior front-end developer to build modular web interfaces using React.",
    "category": "Web Development",
    "requiredSkills": ["React"],
    "budget": 200.0,
    "deadline": "2026-06-30T00:00:00Z",
    "difficultyLevel": "Intermediate",
    "workMode": "Remote",
    "deliverables": ["Responsive layout"],
    "status": "Published"
}

# Candidate missing almost all profile fields (like a new user)
incomplete_candidate = {
    "id": "cand-new",
    "profile": {
        "name": "Rahul Kumar",
        # college, bio, skills, experienceLevel, availability, preferredCategories, hourlyRate, portfolioLinks, trustScore, isVerified, profileStrength are omitted
    },
    "portfolios": []
}

def verify():
    print("Sending match request for incomplete profile...")
    r = httpx.post(f"{BASE_URL}/match", json={
        "job": job,
        "candidates": [incomplete_candidate]
    })
    print(f"Response status code: {r.status_code}")
    print(json.dumps(r.json(), indent=2))
    assert r.status_code == 200
    print("\nSUCCESS: AI Engine successfully processed incomplete candidate profile with default fallbacks!")

if __name__ == "__main__":
    verify()
