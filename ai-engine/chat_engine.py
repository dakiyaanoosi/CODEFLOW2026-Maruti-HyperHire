"""
HyperAI Chat Engine
====================
Rule-based fallback chat engine that generates contextual, intelligent responses
based on page context, user role, and active entities (job, profile, portfolio).

When an LLM key is configured, the /chat route will use call_llm_json() from
generation.py instead of this engine. This engine ensures HyperAI always works.
"""

import re
from typing import Any, Dict, List, Optional, Tuple


# ---------------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------------

def _fmt_pct(val: float) -> str:
    return f"{int(round(val * 100))}%"


def _skills_str(skills: List[str], n: int = 5) -> str:
    if not skills:
        return "no skills listed"
    top = skills[:n]
    return ", ".join(top) + ("..." if len(skills) > n else "")


def _page_label(page: str) -> str:
    mapping = {
        "/profile": "your profile page",
        "/marketplace": "the job marketplace",
        "/jobs": "the jobs listing",
        "/applications": "your applications",
        "/dashboard": "your dashboard",
        "/portfolio": "your portfolio",
        "/analytics": "analytics",
        "/talent": "the talent search",
        "/business-profile": "your business profile",
        "/messages": "messages",
        "/settings": "settings",
    }
    for key, label in mapping.items():
        if key in (page or ""):
            return label
    return "the current page"


# ---------------------------------------------------------------------------
# Quick-action dispatch: maps action labels to pre-built contextual responses
# ---------------------------------------------------------------------------

def _handle_improve_profile(profile: Optional[Dict], portfolio: Optional[List]) -> Tuple[str, List[str]]:
    name = profile.get("name", "your profile") if profile else "your profile"
    skills = profile.get("skills", []) if profile else []
    bio = profile.get("bio", "") if profile else ""
    trust = profile.get("trustScore", 80) if profile else 80
    strength = profile.get("profileStrength", 0) if profile else 0
    exp = profile.get("experienceLevel", "Intermediate") if profile else "Intermediate"

    issues = []
    actions = []

    if not bio or len(bio) < 80:
        issues.append("**Bio is too short** — A compelling bio (140+ words) increases your semantic match score by signaling depth to the AI ranker.")
        actions.append("Expand your bio with 2–3 specific accomplishments and your preferred work domain.")

    if len(skills) < 6:
        issues.append(f"**Skill coverage is thin** — You have {len(skills)} skills listed. Candidates with 8+ skills rank 34% higher on average.")
        actions.append("Add skills like TypeScript, REST APIs, PostgreSQL, or any domain-specific tools you actively use.")

    if trust < 75:
        issues.append(f"**Trust score is at {int(trust)}** — This is actively lowering your ranking confidence across the platform. Complete profile verification to boost it.")
    
    if strength < 70:
        issues.append(f"**Profile strength is {int(strength)}%** — Profiles above 80% receive 2× more job recommendations.")

    if not portfolio or len(portfolio) == 0:
        issues.append("**No portfolio items** — Candidates with 3+ portfolio projects score up to 28% higher on portfolio relevance in AI matching.")

    if not issues:
        response = (
            f"## {name}'s Profile Analysis\n\n"
            "Your profile is well-structured. Here's what can push you from good to excellent:\n\n"
            f"- **Experience Level**: {exp} — ensure your bio references this explicitly.\n"
            f"- **Trust Score**: {int(trust)}% — maintain this by completing work on time.\n"
            f"- **Skills**: {_skills_str(skills)} — consider adding adjacent or emerging skills.\n\n"
            "**Next step**: Add 1–2 portfolio projects that directly match your preferred categories."
        )
        suggestions = [
            "Add a case study to your portfolio showing measurable results.",
            "Update your availability to increase visibility in real-time searches.",
        ]
    else:
        issues_text = "\n".join(f"{i+1}. {issue}" for i, issue in enumerate(issues))
        actions_text = "\n".join(f"- {a}" for a in actions)
        response = (
            f"## Profile Optimization Report\n\n"
            f"I found **{len(issues)} critical gaps** in your profile that are reducing your AI ranking:\n\n"
            f"{issues_text}\n\n"
            f"### Recommended Actions\n{actions_text}"
        )
        suggestions = actions[:3]

    return response, suggestions


def _handle_analyze_portfolio(profile: Optional[Dict], portfolio: Optional[List]) -> Tuple[str, List[str]]:
    categories = profile.get("preferredCategories", []) if profile else []
    cat_str = ", ".join(categories[:3]) if categories else "your target domain"

    if not portfolio or len(portfolio) == 0:
        return (
            "## Portfolio Analysis\n\n"
            "**No portfolio items found.** Your portfolio is one of the most weighted factors in AI matching (15% of total score).\n\n"
            "### What to Add\n"
            "- Upload 3+ projects that directly match your preferred categories.\n"
            f"- For **{cat_str}**, include projects that show end-to-end delivery.\n"
            "- Add detailed descriptions — the AI uses these for semantic matching against job descriptions.\n\n"
            "A portfolio with 3 relevant projects can increase your match score by up to **28 percentage points**.",
            [
                "Add your strongest project first — it sets the semantic baseline.",
                "Write 100+ word descriptions per project for higher semantic depth.",
                "Tag each project with 5+ relevant skills.",
            ]
        )

    items = portfolio[:5]
    item_lines = "\n".join(
        f"- **{p.get('title', 'Untitled')}** ({p.get('category', 'General')}) — "
        f"{len(p.get('tags', []))} tags"
        for p in items
    )

    response = (
        f"## Portfolio Analysis\n\n"
        f"You have **{len(portfolio)} portfolio item(s)**. Here's my assessment:\n\n"
        f"{item_lines}\n\n"
        f"### Semantic Depth Check\n"
        f"For **{cat_str}** roles, your portfolio needs projects that explicitly reference:\n"
        "- The business problem solved\n"
        "- Technologies and tools used\n"
        "- Measurable outcomes or deliverables\n\n"
        "Items with thin descriptions (<50 words) score near-zero on portfolio relevance even if the work is excellent."
    )
    suggestions = [
        "Expand project descriptions to 100+ words for each item.",
        "Add tags that match the skills in your target job descriptions.",
        f"Include at least one project directly in the {categories[0] if categories else 'your primary'} category.",
    ]
    return response, suggestions


def _handle_explain_match(job: Optional[Dict], profile: Optional[Dict], rec_state: Optional[Dict]) -> Tuple[str, List[str]]:
    if not job:
        return (
            "## Match Score Explanation\n\n"
            "No active job is selected. Open a job listing from the marketplace to get a detailed breakdown of your match score.\n\n"
            "**What the AI evaluates:**\n"
            "- **Semantic Similarity** (30%) — How closely your profile text aligns with the job description.\n"
            "- **Skill Overlap** (20%) — How many required skills you explicitly list.\n"
            "- **Trust Score** (15%) — Your platform reliability rating.\n"
            "- **Portfolio Relevance** (15%) — Whether your portfolio projects align with the job category.\n"
            "- **Experience Level** (10%) — Whether your experience matches job difficulty.\n"
            "- **Category Alignment** (10%) — Whether the job category is in your preferred list.",
            ["Select a job from the marketplace to see your specific match breakdown."]
        )

    job_title = job.get("title", "the selected job")
    req_skills = job.get("requiredSkills", [])
    my_skills = profile.get("skills", []) if profile else []
    matched = set(s.lower() for s in my_skills) & set(s.lower() for s in req_skills)
    missing = [s for s in req_skills if s.lower() not in set(m.lower() for m in my_skills)]

    breakdown_lines = ""
    if rec_state and "breakdown" in rec_state:
        b = rec_state["breakdown"]
        breakdown_lines = (
            f"\n\n### Live Score Breakdown\n"
            f"| Dimension | Score |\n|---|---|\n"
            f"| Semantic Similarity | {_fmt_pct(b.get('semantic_similarity', 0))} |\n"
            f"| Skill Overlap | {_fmt_pct(b.get('skill_overlap', 0))} |\n"
            f"| Trust Score | {_fmt_pct(b.get('trust_score', 0))} |\n"
            f"| Portfolio Relevance | {_fmt_pct(b.get('portfolio_relevance', 0))} |\n"
            f"| Experience Level | {_fmt_pct(b.get('experience_level', 0))} |\n"
            f"| Category Alignment | {_fmt_pct(b.get('category_alignment', 0))} |"
        )

    response = (
        f"## Match Explanation: {job_title}\n\n"
        f"**Matched Skills** ({len(matched)}/{len(req_skills)}): {', '.join(list(matched)[:5]) or 'none'}\n\n"
        f"**Missing Skills**: {', '.join(missing[:5]) or 'none — great coverage!'}\n\n"
        f"The AI semantic engine compares the full text of your profile and portfolio against the job description "
        f"using vector embeddings. Even without exact skill matches, a high semantic score means your profile "
        f"language strongly aligns with what the employer is looking for."
        f"{breakdown_lines}"
    )
    suggestions = [
        f"Add {missing[0]} to your skills list to close the top gap." if missing else "Your skill coverage is complete.",
        "Expand your bio to include language from this job description.",
        "Add a portfolio project in the same category as this gig.",
    ]
    return response, suggestions


def _handle_suggest_skills(profile: Optional[Dict]) -> Tuple[str, List[str]]:
    categories = profile.get("preferredCategories", []) if profile else []
    existing = [s.lower() for s in (profile.get("skills", []) if profile else [])]

    TRENDING_BY_CATEGORY = {
        "Web Development": ["React", "Next.js", "TypeScript", "Tailwind CSS", "tRPC", "Bun.js"],
        "Backend Engineering": ["Go", "Rust", "gRPC", "Kafka", "Redis", "PostgreSQL", "Prisma"],
        "Mobile Development": ["React Native", "Expo", "SwiftUI", "Kotlin Multiplatform", "Flutter"],
        "UI/UX Design": ["Figma", "Framer", "Lottie", "Design Systems", "Accessibility (WCAG)"],
        "Machine Learning": ["PyTorch", "LangChain", "Hugging Face", "RAG", "Fine-tuning", "Vector DBs"],
        "Data Science": ["dbt", "Airflow", "Spark", "Polars", "LLM Ops", "MLflow"],
        "Digital Marketing": ["Programmatic Ads", "GA4", "Hotjar", "A/B Testing", "Email Automation"],
        "Content Writing": ["SEO Copywriting", "AI-assisted Writing", "Long-form Strategy", "Content Ops"],
        "Video Editing": ["DaVinci Resolve", "After Effects", "Motion Graphics", "Color Grading"],
        "Graphic Design": ["Figma", "Midjourney", "Brand Identity", "Motion Design"],
    }

    trending = []
    for cat in categories[:2]:
        suggestions = TRENDING_BY_CATEGORY.get(cat, [])
        for skill in suggestions:
            if skill.lower() not in existing and skill not in trending:
                trending.append(skill)

    if not trending:
        trending = ["TypeScript", "REST APIs", "PostgreSQL", "Docker", "Git", "CI/CD"]

    trending = trending[:6]

    response = (
        "## Trending Skills Report\n\n"
        f"Based on your preferred categories ({', '.join(categories[:2]) or 'general'}), "
        "here are the highest-demand skills in the current marketplace:\n\n"
        + "\n".join(f"- **{skill}** — high demand in active job postings" for skill in trending)
        + "\n\n"
        "Adding 2–3 of these to your profile will increase your semantic match score on relevant gigs "
        "and make you appear in more AI-powered recommendation results."
    )
    suggestions = [f"Add '{s}' to your skill list for better matching." for s in trending[:3]]
    return response, suggestions


def _handle_improve_gig(job: Optional[Dict]) -> Tuple[str, List[str]]:
    if not job:
        return (
            "## Gig Improvement Assistant\n\n"
            "No active job is selected. Open one of your posted gigs to get AI-powered improvement suggestions.",
            ["Open a gig from your dashboard to analyze it."]
        )

    title = job.get("title", "your gig")
    desc = job.get("description", "")
    skills = job.get("requiredSkills", [])
    budget = job.get("budget", 0)
    deliverables = job.get("deliverables", [])

    issues = []
    if len(desc) < 150:
        issues.append("**Description is too short** — Gigs with 200+ word descriptions attract 3× more qualified applicants because the AI has more content to semantically match against candidates.")
    if len(skills) < 4:
        issues.append(f"**Only {len(skills)} required skills listed** — Add 5–8 specific skills to increase match precision and reduce unqualified applications.")
    if not deliverables or len(deliverables) == 0:
        issues.append("**No deliverables specified** — Clear deliverables increase application quality by setting explicit expectations.")
    if budget < 50:
        issues.append(f"**Budget is ${int(budget)}** — Very low budgets filter out experienced candidates before they even apply.")

    if not issues:
        response = (
            f"## Gig Analysis: {title}\n\n"
            "Your gig description looks solid. Here are refinements to maximize match quality:\n\n"
            "- Mention your **company context** — candidates match better when they understand the product ecosystem.\n"
            "- Add a **\"Nice to Have\"** section for soft requirements that don't disqualify candidates.\n"
            "- Specify your **timezone preference** if collaboration is required."
        )
    else:
        issues_text = "\n".join(f"{i+1}. {issue}" for i, issue in enumerate(issues))
        response = (
            f"## Gig Analysis: {title}\n\n"
            f"I found **{len(issues)} improvement areas**:\n\n"
            f"{issues_text}\n\n"
            "Fixing these will increase both application volume and AI-ranked candidate quality."
        )

    suggestions = [
        "Add a structured deliverables list with clear acceptance criteria.",
        "Expand your description with specific technical requirements.",
        "List must-have vs. nice-to-have skills separately.",
    ]
    return response, suggestions


def _handle_analyze_candidates(rec_state: Optional[Dict]) -> Tuple[str, List[str]]:
    if not rec_state:
        return (
            "## Candidate Quality Analysis\n\n"
            "Run the AI matching engine on your active gig first. "
            "Open a job posting and click **Rank Candidates** to load live match data.",
            ["Run the AI ranker on your active gig to see candidate quality metrics."]
        )

    ranked = rec_state.get("ranked_candidates", [])
    if not ranked:
        return (
            "## Candidate Quality Analysis\n\n"
            "No ranked candidates found for the active gig. "
            "Make sure your job is active and candidates have applied.",
            ["Check that your gig is in Active status to receive applications."]
        )

    top = ranked[:3]
    top_lines = "\n".join(
        f"{i+1}. **{c.get('candidate_id', 'Candidate')}** — {c.get('match_percentage', 0)}% match, "
        f"confidence {_fmt_pct(c.get('confidence_score', 0))}"
        for i, c in enumerate(top)
    )

    avg_match = sum(c.get("match_percentage", 0) for c in ranked) / len(ranked)
    high_quality = [c for c in ranked if c.get("match_percentage", 0) >= 70]

    response = (
        f"## Candidate Pool Analysis\n\n"
        f"**Total Applicants**: {len(ranked)} | "
        f"**High Quality (70%+)**: {len(high_quality)} | "
        f"**Average Match**: {int(avg_match)}%\n\n"
        f"### Top Candidates\n{top_lines}\n\n"
        f"### Hiring Intelligence\n"
        f"{'Your pool has strong candidates — the AI confidence scores are high.' if avg_match > 65 else 'Match quality is moderate. Broadening the required skills list or adjusting difficulty level may attract stronger candidates.'}"
    )
    suggestions = [
        "Interview candidates with high confidence scores first — they predict the best outcome.",
        "Low-match candidates may still excel if their portfolio is highly relevant.",
        "Consider adjusting your budget to attract more experienced candidates.",
    ]
    return response, suggestions


# ---------------------------------------------------------------------------
# Generic conversational responses (non-quick-action messages)
# ---------------------------------------------------------------------------

def _contextual_response(
    message: str,
    page: str,
    role: str,
    job: Optional[Dict],
    profile: Optional[Dict],
    portfolio: Optional[List],
    application: Optional[Dict],
    rec_state: Optional[Dict],
) -> Tuple[str, List[str], List[str], Optional[Dict]]:
    """
    Route a free-text message to the most relevant contextual response.
    Returns (response_text, suggestions, quick_actions, reasoning_highlights).
    """
    msg_lower = message.lower().strip()

    # ---- Score / match related queries ----
    if any(w in msg_lower for w in ["score", "match", "rank", "why", "explain", "breakdown", "semantic"]):
        response, suggestions = _handle_explain_match(job, profile, rec_state)
        return response, suggestions, _quick_actions(role, page), _reasoning_highlights(rec_state)

    # ---- Profile related ----
    if any(w in msg_lower for w in ["profile", "bio", "improve", "optimize", "strengthen", "weak"]):
        response, suggestions = _handle_improve_profile(profile, portfolio)
        return response, suggestions, _quick_actions(role, page), None

    # ---- Portfolio related ----
    if any(w in msg_lower for w in ["portfolio", "project", "work", "showcase", "sample"]):
        response, suggestions = _handle_analyze_portfolio(profile, portfolio)
        return response, suggestions, _quick_actions(role, page), None

    # ---- Skills ----
    if any(w in msg_lower for w in ["skill", "learn", "trending", "demand", "technology", "tech"]):
        response, suggestions = _handle_suggest_skills(profile)
        return response, suggestions, _quick_actions(role, page), None

    # ---- Job / gig description (business) ----
    if role == "business" and any(w in msg_lower for w in ["gig", "job", "description", "posting", "listing"]):
        response, suggestions = _handle_improve_gig(job)
        return response, suggestions, _quick_actions(role, page), None

    # ---- Candidate analysis (business) ----
    if role == "business" and any(w in msg_lower for w in ["candidate", "applicant", "quality", "talent", "hire"]):
        response, suggestions = _handle_analyze_candidates(rec_state)
        return response, suggestions, _quick_actions(role, page), None

    # ---- Trust score ----
    if "trust" in msg_lower:
        trust = profile.get("trustScore", 80) if profile else 80
        response = (
            f"## Trust Score: {int(trust)}/100\n\n"
            "Your trust score is a platform-wide reliability metric that directly affects your AI ranking.\n\n"
            "**How it's calculated:**\n"
            "- On-time delivery rate\n"
            "- Response rate to messages\n"
            "- Profile completeness\n"
            "- Identity verification status\n\n"
            f"{'Your score is healthy. Maintain it by consistently delivering on time.' if trust >= 75 else 'Your score is below average. Complete your profile verification and ensure on-time delivery to improve it.'}"
        )
        suggestions = ["Complete identity verification to boost trust score by up to 15 points."]
        return response, suggestions, _quick_actions(role, page), None

    # ---- Fallback contextual response ----
    page_label = _page_label(page)
    if role == "business":
        response = (
            f"I'm HyperAI, your hiring intelligence assistant. You're currently on {page_label}.\n\n"
            "I can help you with:\n"
            "- **Gig optimization** — Make your job descriptions attract higher-quality applicants.\n"
            "- **Candidate analysis** — Understand AI match scores and hiring confidence.\n"
            "- **Ranking intelligence** — See why specific candidates rank highly.\n"
            "- **Requirement clarity** — Identify gaps in your posted requirements.\n\n"
            "Select a quick action below or ask me anything about your hiring pipeline."
        )
    else:
        response = (
            f"I'm HyperAI, your career intelligence assistant. You're currently on {page_label}.\n\n"
            "I can help you with:\n"
            "- **Profile optimization** — Identify gaps reducing your AI ranking.\n"
            "- **Match explanations** — Understand exactly why you score high or low on gigs.\n"
            "- **Portfolio analysis** — See which projects strengthen your semantic profile.\n"
            "- **Skill strategy** — Discover trending skills for your target categories.\n\n"
            "Select a quick action below or ask me anything about your career strategy."
        )
    return response, _default_suggestions(role), _quick_actions(role, page), None


# ---------------------------------------------------------------------------
# Quick actions per role + page
# ---------------------------------------------------------------------------

def _quick_actions(role: str, page: str) -> List[str]:
    base_student = ["Improve Profile", "Analyze Portfolio", "Suggest Trending Skills"]
    base_business = ["Improve Gig", "Analyze Candidate Quality", "Optimize Hiring Requirements"]

    page_extras = {
        "/profile": ["Explain Match Score", "Improve Profile"],
        "/marketplace": ["Explain Match Score", "Suggest Trending Skills"],
        "/portfolio": ["Analyze Portfolio", "Suggest Trending Skills"],
        "/applications": ["Explain Match Score", "Optimize Proposal"],
        "/jobs": ["Improve Gig", "Predict Application Quality"],
        "/talent": ["Analyze Candidate Quality", "Improve Gig"],
    }

    if role == "business":
        actions = base_business[:]
        for key, extras in page_extras.items():
            if key in (page or ""):
                for e in extras:
                    if e not in actions:
                        actions.insert(0, e)
        return actions[:5]
    else:
        actions = base_student[:]
        for key, extras in page_extras.items():
            if key in (page or ""):
                for e in extras:
                    if e not in actions:
                        actions.insert(0, e)
        return actions[:5]


def _default_suggestions(role: str) -> List[str]:
    if role == "business":
        return [
            "Open a job posting to start analyzing candidate quality.",
            "Ask me to review your gig description for clarity improvements.",
        ]
    return [
        "Select a marketplace gig to perform a semantic match analysis.",
        "Add trending skills to your profile to rank higher on AI recommendations.",
    ]


# ---------------------------------------------------------------------------
# Reasoning highlights extraction
# ---------------------------------------------------------------------------

def _reasoning_highlights(rec_state: Optional[Dict]) -> Optional[Dict[str, Any]]:
    if not rec_state:
        return None
    b = rec_state.get("breakdown")
    if not b:
        return None
    return {
        "Semantic Similarity": f"{_fmt_pct(b.get('semantic_similarity', 0))}",
        "Skill Overlap": f"{_fmt_pct(b.get('skill_overlap', 0))}",
        "Trust Score": f"{_fmt_pct(b.get('trust_score', 0))}",
        "Portfolio Relevance": f"{_fmt_pct(b.get('portfolio_relevance', 0))}",
        "Experience Fit": f"{_fmt_pct(b.get('experience_level', 0))}",
        "Category Alignment": f"{_fmt_pct(b.get('category_alignment', 0))}",
    }


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def generate_chat_response(
    message: str,
    history: List[Dict[str, str]],
    page_context: Optional[str],
    user_role: Optional[str],
    active_job: Optional[Dict],
    active_profile: Optional[Dict],
    active_portfolio: Optional[List],
    active_application: Optional[Dict],
    recommendation_state: Optional[Dict],
) -> Dict[str, Any]:
    """
    Main rule-based chat engine entrypoint.
    Returns a dict with: response, suggestions, quickActions, reasoningHighlights.
    """
    role = user_role or "student"
    page = page_context or "/dashboard"
    msg = message.strip()

    # Route quick actions
    msg_lower = msg.lower()

    if msg_lower in ("improve profile", "optimize profile"):
        response, suggestions = _handle_improve_profile(active_profile, active_portfolio)
        return {
            "response": response,
            "suggestions": suggestions,
            "quickActions": _quick_actions(role, page),
            "reasoningHighlights": None,
        }

    if msg_lower in ("analyze portfolio",):
        response, suggestions = _handle_analyze_portfolio(active_profile, active_portfolio)
        return {
            "response": response,
            "suggestions": suggestions,
            "quickActions": _quick_actions(role, page),
            "reasoningHighlights": None,
        }

    if msg_lower in ("explain match score", "explain match", "match score"):
        response, suggestions = _handle_explain_match(active_job, active_profile, recommendation_state)
        return {
            "response": response,
            "suggestions": suggestions,
            "quickActions": _quick_actions(role, page),
            "reasoningHighlights": _reasoning_highlights(recommendation_state),
        }

    if msg_lower in ("suggest trending skills", "trending skills", "suggest skills"):
        response, suggestions = _handle_suggest_skills(active_profile)
        return {
            "response": response,
            "suggestions": suggestions,
            "quickActions": _quick_actions(role, page),
            "reasoningHighlights": None,
        }

    if msg_lower in ("improve gig", "optimize gig", "improve job description"):
        response, suggestions = _handle_improve_gig(active_job)
        return {
            "response": response,
            "suggestions": suggestions,
            "quickActions": _quick_actions(role, page),
            "reasoningHighlights": None,
        }

    if msg_lower in ("analyze candidate quality", "analyze candidates", "candidate quality"):
        response, suggestions = _handle_analyze_candidates(recommendation_state)
        return {
            "response": response,
            "suggestions": suggestions,
            "quickActions": _quick_actions(role, page),
            "reasoningHighlights": _reasoning_highlights(recommendation_state),
        }

    if msg_lower in ("optimize hiring requirements", "optimize requirements"):
        job_title = active_job.get("title", "your gig") if active_job else "your gig"
        response = (
            f"## Hiring Requirements Optimizer\n\n"
            f"For **{job_title}**, here's how to sharpen your requirements:\n\n"
            "1. **Split Must-Have vs. Nice-to-Have** — Lumping all skills as required filters out good candidates who lack one minor tool.\n"
            "2. **Use standard skill names** — Write 'React' not 'React.js Frontend Dev'. The AI uses exact skill matching.\n"
            "3. **Match difficulty to budget** — An 'Advanced' difficulty gig at a beginner budget creates application drop-off.\n"
            "4. **Specify deliverables** — Each deliverable becomes a semantic signal for candidate matching.\n"
            "5. **State your timeline clearly** — Unrealistic deadlines reduce serious applicant rates by ~40%."
        )
        suggestions = [
            "List 5–8 specific required skills for precise AI matching.",
            "Add at least 3 clear deliverables to your job posting.",
        ]
        return {
            "response": response,
            "suggestions": suggestions,
            "quickActions": _quick_actions(role, page),
            "reasoningHighlights": None,
        }

    if msg_lower in ("predict application quality", "application quality", "predict quality"):
        response = (
            "## Application Quality Predictor\n\n"
            "Based on your current gig configuration, here's what the AI predicts about application quality:\n\n"
            "**Key quality signals:**\n"
            "- Gigs with **detailed descriptions (200+ words)** attract 3× more qualified applications.\n"
            "- **Clear budget ranges** reduce low-effort applications by 45%.\n"
            "- **Specific skill requirements** (6–8 skills) improve AI candidate ranking precision.\n"
            "- **Listed deliverables** increase serious applicant rate by 60%.\n\n"
            "Select a gig and run the AI matcher to see predicted candidate quality scores."
        )
        suggestions = [
            "Improve your gig description to 200+ words for better quality signals.",
            "Add a realistic budget to filter out mismatched applicants.",
        ]
        return {
            "response": response,
            "suggestions": suggestions,
            "quickActions": _quick_actions(role, page),
            "reasoningHighlights": None,
        }

    if msg_lower in ("optimize proposal",):
        app_job = active_application.get("jobTitle", "the gig") if active_application else "the gig"
        response = (
            f"## Proposal Optimizer\n\n"
            f"To win **{app_job}**, your proposal needs to:\n\n"
            "1. **Lead with the outcome** — Don't start with 'I am a developer'. Start with 'I'll deliver X in Y days.'\n"
            "2. **Mirror the job description** — Use the exact same technical terms the employer used. The AI checks for semantic alignment.\n"
            "3. **Show relevant work** — Reference 1 portfolio project directly relevant to this gig.\n"
            "4. **Be specific about delivery** — State your approach, timeline, and what the employer receives at handover.\n"
            "5. **Close with confidence** — End with a clear next step: 'I'm ready to start Monday — let's confirm scope.'"
        )
        suggestions = [
            "Use the Smart Pitch feature in your application form for AI-enhanced proposals.",
            "Reference portfolio items that match this gig's category.",
        ]
        return {
            "response": response,
            "suggestions": suggestions,
            "quickActions": _quick_actions(role, page),
            "reasoningHighlights": None,
        }

    # Generic contextual routing
    response, suggestions, quick_actions, reasoning = _contextual_response(
        msg, page, role, active_job, active_profile, active_portfolio, active_application, recommendation_state
    )
    return {
        "response": response,
        "suggestions": suggestions,
        "quickActions": quick_actions,
        "reasoningHighlights": reasoning,
    }
