import json
import os
import re
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass


SKILL_CATALOG = {
    "React": ["react", "jsx", "frontend", "front-end", "component"],
    "TypeScript": ["typescript", "type-safe", "typed javascript"],
    "JavaScript": ["javascript", "js"],
    "Next.js": ["next.js", "nextjs", "server components"],
    "Tailwind CSS": ["tailwind", "css", "responsive"],
    "Node.js": ["node", "node.js"],
    "REST APIs": ["api", "rest", "endpoint"],
    "PostgreSQL": ["postgres", "postgresql", "sql"],
    "Python": ["python", "pandas", "script"],
    "Machine Learning": ["machine learning", "ml model", "fine-tune", "training"],
    "Figma": ["figma", "wireframe", "prototype"],
    "UI/UX Design": ["ui/ux", "user experience", "interface design", "design system"],
    "Video Editing": ["video", "editing", "premiere", "after effects"],
    "Digital Marketing": ["marketing", "seo", "social media", "ads"],
    "Content Writing": ["content", "blog", "copywriting", "article"],
    "Branding": ["brand", "logo", "identity", "typography"],
}

CATEGORY_KEYWORDS = {
    "Web Development": ["react", "frontend", "website", "dashboard", "next.js", "tailwind"],
    "Backend Engineering": ["backend", "api", "database", "server", "node", "postgres"],
    "Mobile Development": ["mobile", "ios", "android", "flutter", "react native", "swift"],
    "UI/UX Design": ["figma", "wireframe", "prototype", "ui/ux", "design system"],
    "Video Editing": ["video", "edit", "premiere", "after effects", "youtube"],
    "Digital Marketing": ["marketing", "seo", "social media", "ads", "campaign"],
    "Machine Learning": ["machine learning", "llm", "model", "tensorflow", "pytorch"],
    "Data Science": ["data", "analytics", "dashboard", "etl", "pandas"],
    "Content Writing": ["content", "blog", "copywriting", "article", "writing"],
    "Graphic Design": ["logo", "brand", "illustrator", "graphic", "typography"],
}


def _sentences(text: str) -> List[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text.strip()) if s.strip()]


def extract_skills(text: str) -> List[str]:
    lower = text.lower()
    skills = [
        skill for skill, keywords in SKILL_CATALOG.items()
        if any(keyword in lower for keyword in keywords)
    ]
    return skills[:8] if skills else ["Communication", "Problem Solving"]


def infer_category(text: str) -> str:
    lower = text.lower()
    scores = {
        category: sum(1 for keyword in keywords if keyword in lower)
        for category, keywords in CATEGORY_KEYWORDS.items()
    }
    best_category, best_score = max(scores.items(), key=lambda item: item[1])
    return best_category if best_score > 0 else "General Execution"


def infer_difficulty_score(text: str, deliverables_count: int = 0) -> int:
    lower = text.lower()
    score = 4
    score += min(deliverables_count, 3)
    score += sum(1 for word in ["advanced", "senior", "architecture", "scalable", "production", "automation"] if word in lower)
    score += sum(1 for word in ["integrate", "api", "database", "analytics", "security", "tests"] if word in lower)
    score -= sum(1 for word in ["basic", "simple", "beginner", "minor", "small fix"] if word in lower)
    return max(1, min(10, score))


def difficulty_label(score: int) -> str:
    if score <= 3:
        return "Beginner"
    if score <= 7:
        return "Intermediate"
    return "Advanced"


def local_job_analysis(title: str, description: str, budget: float = 0.0, deliverables: Optional[List[str]] = None) -> Dict[str, Any]:
    deliverables = deliverables or []
    text = f"{title}\n{description}\n{' '.join(deliverables)}"
    skills = extract_skills(text)
    category = infer_category(text)
    difficulty = infer_difficulty_score(text, len(deliverables))
    sentence = _sentences(description)[:1]
    summary_base = sentence[0] if sentence else f"{title} requires delivery across {category.lower()}."
    summary = (
        f"{summary_base.rstrip('.')}."
        f" Core execution areas: {', '.join(skills[:4])}."
    )
    if budget:
        summary += f" Suggested scope should fit a budget near ${int(budget)}."
    return {
        "aiExtractedSkills": skills,
        "aiGeneratedSummary": summary,
        "aiDifficultyScore": difficulty,
        "difficultyLevel": difficulty_label(difficulty),
        "suggestedCategory": category,
    }


def local_portfolio_summary(title: str, description: str, category: str, tags: List[str]) -> str:
    key_sentences = _sentences(description)[:2]
    evidence = " ".join(key_sentences) if key_sentences else "The work includes practical execution and delivery artifacts."
    tag_clause = f" using {', '.join(tags[:5])}" if tags else ""
    return (
        f"{title} is a {category} portfolio project{tag_clause}. "
        f"{evidence} "
        "It highlights the candidate's execution process, deliverables, and relevant applied skills."
    )


def local_pitch_enhancement(
    cover_message: str,
    proposal_text: str,
    tone: str,
    job_title: str,
    job_description: str,
) -> Dict[str, Any]:
    analysis = local_job_analysis(job_title, job_description)
    skills = analysis["aiExtractedSkills"][:4]
    opener = "Hi," if tone.lower() == "conversational" else "Dear Hiring Team,"
    cover = (
        f"{opener}\n\n"
        f"I'd like to work on {job_title}. Your brief points to {', '.join(skills).lower()} work, "
        f"and I can turn the requirements into clear deliverables with regular progress updates.\n\n"
        f"{cover_message.strip()}\n\n"
        "I can start by confirming scope, then share a concise execution plan before moving into delivery."
    )
    proposal = (
        "### Proposed Approach\n"
        "1. Confirm success criteria, assets, timeline, and review points.\n"
        f"2. Execute the core work: {proposal_text.strip() or 'complete the requested deliverables with documented progress'}.\n"
        "3. Share a review build or draft, incorporate feedback, and hand over final files with notes.\n\n"
        f"### Relevant Focus\nThis proposal is optimized for {analysis['suggestedCategory']} work and prioritizes {', '.join(skills)}."
    )
    days = 4 if analysis["difficultyLevel"] == "Beginner" else 7 if analysis["difficultyLevel"] == "Intermediate" else 12
    upsell = (
        "Add a short handover document and one structured revision round so the business can reuse the work confidently."
    )
    return {
        "enhancedCoverMessage": cover,
        "enhancedProposalText": proposal,
        "recommendedPrice": None,
        "recommendedDays": days,
        "upsellSuggestion": upsell,
    }


def call_openai_json(system_prompt: str, user_payload: Dict[str, Any], schema: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
    body = {
        "model": model,
        "input": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)},
        ],
        "text": {
            "format": {
                "type": "json_schema",
                "name": "hyperhire_ai_result",
                "strict": True,
                "schema": schema,
            }
        },
    }
    request = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return None

    output_text = payload.get("output_text")
    if not output_text:
        chunks = []
        for item in payload.get("output", []):
            for content in item.get("content", []):
                if content.get("type") == "output_text":
                    chunks.append(content.get("text", ""))
        output_text = "".join(chunks)
    if not output_text:
        return None
    try:
        return json.loads(output_text)
    except json.JSONDecodeError:
        return None


def _gemini_schema(schema: Dict[str, Any]) -> Dict[str, Any]:
    converted = dict(schema)
    converted.pop("additionalProperties", None)
    schema_type = converted.get("type")
    if isinstance(schema_type, list):
        nullable = "null" in schema_type
        non_null = [item for item in schema_type if item != "null"]
        converted["type"] = non_null[0] if non_null else "string"
        if nullable:
            converted["nullable"] = True
    if "properties" in converted:
        converted["properties"] = {
            key: _gemini_schema(value)
            for key, value in converted["properties"].items()
        }
    if "items" in converted:
        converted["items"] = _gemini_schema(converted["items"])
    return converted


def call_gemini_json(system_prompt: str, user_payload: Dict[str, Any], schema: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return None

    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    body = {
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": json.dumps(user_payload, ensure_ascii=False)}],
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": _gemini_schema(schema),
        },
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    request = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return None

    chunks = []
    for candidate in payload.get("candidates", []):
        content = candidate.get("content", {})
        for part in content.get("parts", []):
            if "text" in part:
                chunks.append(part["text"])
    if not chunks:
        return None
    try:
        return json.loads("".join(chunks))
    except json.JSONDecodeError:
        return None


def call_llm_json(system_prompt: str, user_payload: Dict[str, Any], schema: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    provider = os.getenv("LLM_PROVIDER", "auto").lower()
    if provider == "openai":
        return call_openai_json(system_prompt, user_payload, schema)
    if provider == "gemini":
        return call_gemini_json(system_prompt, user_payload, schema)
    return (
        call_openai_json(system_prompt, user_payload, schema)
        or call_gemini_json(system_prompt, user_payload, schema)
    )
