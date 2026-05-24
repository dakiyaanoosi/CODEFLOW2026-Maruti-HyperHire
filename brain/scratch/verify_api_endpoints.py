import httpx
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

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

candidate_1 = {
    "id": "cand-1",
    "profile": {
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
    },
    "portfolios": [
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
}

candidate_2 = {
    "id": "cand-2",
    "profile": {
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
    },
    "portfolios": []
}

def verify_all():
    print("=== Testing FastAPI Endpoints ===")
    
    # 1. Test GET /
    print("\n1. Testing GET / ...")
    r = httpx.get(f"{BASE_URL}/")
    print(f"Status: {r.status_code}")
    print(r.json())
    assert r.status_code == 200
    
    # 2. Test POST /embed
    print("\n2. Testing POST /embed ...")
    r = httpx.post(f"{BASE_URL}/embed", json={"texts": ["Hello HyperHire AI Engine!", "FastAPI is great"]})
    print(f"Status: {r.status_code}")
    res = r.json()
    print(f"Number of embeddings returned: {len(res.get('embeddings', []))}")
    print(f"Embedding shape: {len(res.get('embeddings', [])[0])} dimensions")
    assert r.status_code == 200
    assert len(res.get("embeddings", [])) == 2
    assert len(res.get("embeddings", [])[0]) == 384
    
    # 3. Test POST /score
    print("\n3. Testing POST /score ...")
    r = httpx.post(f"{BASE_URL}/score", json={
        "job": job,
        "candidate": candidate_1
    })
    print(f"Status: {r.status_code}")
    res = r.json()
    print(json.dumps(res, indent=2))
    assert r.status_code == 200
    assert res["match_percentage"] > 80
    
    # 4. Test POST /match
    print("\n4. Testing POST /match ...")
    r = httpx.post(f"{BASE_URL}/match", json={
        "job": job,
        "candidates": [candidate_1, candidate_2]
    })
    print(f"Status: {r.status_code}")
    res = r.json()
    print(json.dumps(res, indent=2))
    assert r.status_code == 200
    assert len(res["ranked_candidates"]) == 2
    assert res["ranked_candidates"][0]["candidate_id"] == "cand-1"
    
    # 5. Test POST /recommend
    print("\n5. Testing POST /recommend ...")
    r = httpx.post(f"{BASE_URL}/recommend", json={
        "candidate": candidate_1,
        "jobs": [job]
    })
    print(f"Status: {r.status_code}")
    res = r.json()
    print(json.dumps(res, indent=2))
    assert r.status_code == 200
    assert len(res["ranked_jobs"]) == 1
    assert res["ranked_jobs"][0]["job_id"] == "job-101"
    
    print("\nALL API ENDPOINTS VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    try:
        verify_all()
    except Exception as e:
        print(f"\nVerification failed: {e}")
        sys.exit(1)
